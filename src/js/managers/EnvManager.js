import {
  AmbientLight,
  Color,
  DirectionalLight,
  NearestFilter,
  OrthographicCamera,
  RGBAFormat,
  ShaderMaterial,
  Vector3,
  WebGLRenderTarget,
} from 'three'
// Modules
import Debugger from '@/js/managers/Debugger'
import vertexShadowmapShader from '@glsl/shadows/shadowmap.vert'
import fragmentShadowmapShader from '@glsl/shadows/shadowmap.frag'
import DATA_ENV from '../data/env.json'
import { MODE } from '../utils/constants'
import { hexToRgb } from '../utils/three'
import { gsap } from 'gsap'
import Settings from '../utils/Settings'

const MAX_SHADOW_CAMERA = 300

class EnvManager {
  #sunDir
  #sunShadowMap
  #shadowMaterial
  #shadowSkinMaterial
  #ambientLight
  #state
  #scene
  #index = 0
  #settings = {
    castShadows: DATA_ENV.explore[this.#index].castShadows,
    sunDir: new Vector3(DATA_ENV.explore[this.#index].sunDirX, DATA_ENV.explore[this.#index].sunDirY, 0), // Aube : -10,3, 0
    ambientLight: DATA_ENV.explore[this.#index].ambientLight,
    coefShadow: DATA_ENV.explore[this.#index].coefShadow,
    sky: DATA_ENV.explore[this.#index].sky,
    sky2: DATA_ENV.explore[this.#index].sky2,
    alphaClouds: DATA_ENV.explore[this.#index].alphaClouds,
    alphaStars: DATA_ENV.explore[this.#index].alphaStars,
  }
  #settingsOcean = { ...DATA_ENV.explore[this.#index].ocean }
  progress = 0
  #toonMaterials = []
  #fog
  constructor() {
    this.compassElBkg = document.body.querySelector('[data-compass-bkg]')
  }

  get settingsOcean() {
    return this.#settingsOcean
  }

  get settings() {
    return this.#settings
  }

  get sunDir() {
    return this.#sunDir
  }

  get ambientLight() {
    return this.#ambientLight
  }

  get sunShadowMap() {
    return this.#sunShadowMap
  }

  get shadowMaterial() {
    return this.#shadowMaterial
  }

  get shadowSkinMaterial() {
    return this.#shadowSkinMaterial
  }

  _createSunLight() {
    const dirLight = new DirectionalLight('#555555')
    dirLight.position.set(this.#settings.sunDir.x, this.#settings.sunDir.y, this.#settings.sunDir.z)

    return dirLight
  }

  _createSunShadowMap(scene) {
    const frustumSize = 50
    // create Ortho camera for custom shadow map

    this.#sunDir.shadow.camera = new OrthographicCamera(
      -frustumSize / 2,
      frustumSize / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      MAX_SHADOW_CAMERA
    )

    // Same position as LIGHT position.
    this.#sunDir.shadow.camera.position.copy(this.#sunDir.position)
    this.#sunDir.shadow.camera.lookAt(new Vector3(0, 0, 0))

    // Create the depthTexture
    this.#sunDir.shadow.mapSize.x = Settings.textureSize / 2
    this.#sunDir.shadow.mapSize.y = Settings.textureSize / 2

    const pars = {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
    }

    this.#sunDir.shadow.map = new WebGLRenderTarget(this.#sunDir.shadow.mapSize.x, this.#sunDir.shadow.mapSize.y, pars)

    this.#shadowMaterial = new ShaderMaterial({
      vertexShader: vertexShadowmapShader,
      fragmentShader: fragmentShadowmapShader,
    })

    this.#shadowSkinMaterial = new ShaderMaterial({
      vertexShader: vertexShadowmapShader,
      fragmentShader: fragmentShadowmapShader,
      defines: {
        USE_BONES: true,
      },
    })

    scene.add(this.#sunDir.shadow.camera) // add camera for shadowmap

    return this.#sunDir.shadow
  }

  init(scene) {
    this.#scene = scene
    this.#sunDir = this._createSunLight()
    this.#ambientLight = new AmbientLight(this.#settings.ambientLight)

    // this.#scene.add(this.#ambientLight)
    this.#sunShadowMap = this._createSunShadowMap(scene)
    this._createDebugFolder()

    this.#scene.background = new Color(this.#settings.sky)
  }

  setToonMaterials() {
    this.#scene.traverse((object) => {
      if (object?.material?.name === 'toon') {
        this.#toonMaterials.push(object.material)
      }
    })

    // remove duplicates
    this.#toonMaterials = this.#toonMaterials.filter((item, index) => this.#toonMaterials.indexOf(item) === index)
  }

  setOceanExtend(oceanExtend) {
    this.oceanExtend = oceanExtend
  }

  updateSettings(mode) {
    this.tl?.kill()
    if (mode === MODE.EXPLORE) {
      this.#settingsOcean = { ...DATA_ENV.explore[this.#index].ocean }
      this.anim(true)
      this.oceanExtend.visible = true
    } else if (mode === MODE.GAME) {
      this.#settingsOcean = { ...DATA_ENV.game.ocean }
      this.updateEnv(0, 0, mode)
      this.oceanExtend.visible = false
    }
  }

  anim(first) {
    if (first) {
      this.#index = 3
    }
    this.tl?.kill()
    this.tl = new gsap.timeline()
    const nextIndex = this.#index === 3 ? 0 : this.#index + 1
    const durTransi = 5
    const durStay = 25 // 25
    this.tl.fromTo(
      this,
      {
        progress: 0,
      },
      {
        progress: 1,
        duration: durTransi,
        onUpdate: () => {
          this.updateEnv(this.#index, nextIndex)
        },
      }
    )
    this.tl.add(() => {
      if (this.#index === 3) {
        this.#index = 0
      } else {
        this.#index++
      }
    })
    this.tl.add(() => {
      this.anim()
    }, `+=${durStay}`)

    this.tlCompass = new gsap.timeline()

    const obj = { value: 0 }
    const indexNow = this.#index

    this.tlCompass.to(obj, {
      value: 1,
      duration: durStay + durTransi,
      ease: 'linear',
      onUpdate: () => {
        this.compassElBkg.style.transform = `scale(0.9) rotate(${(-360 / 4) * obj.value + (-360 / 4) * indexNow}deg)`
      },
    })
  }

  updateEnv(index, nextIndex, mode) {
    // return
    let current = DATA_ENV.explore[index]
    let next = DATA_ENV.explore[nextIndex]

    if (mode === MODE.GAME) {
      current = DATA_ENV.game
      next = DATA_ENV.game
    }

    // light + sky
    const currentSky = hexToRgb(current.sky)
    const nextSky = hexToRgb(next.sky)
    //
    if (currentSky) {
      const color = `rgb(${Math.round(currentSky.r + this.progress * (nextSky.r - currentSky.r))}, ${Math.round(
        currentSky.g + this.progress * (nextSky.g - currentSky.g)
      )}, ${Math.round(currentSky.b + this.progress * (nextSky.b - currentSky.b))})`

      this.#settings.sky = color
    }
    this.#scene.background = new Color(this.#settings.sky)

    const currentSky2 = hexToRgb(current.sky2)
    const nextSky2 = hexToRgb(next.sky2)
    //
    if (currentSky2) {
      const color = `rgb(${Math.round(currentSky2.r + this.progress * (nextSky2.r - currentSky2.r))}, ${Math.round(
        currentSky2.g + this.progress * (nextSky2.g - currentSky2.g)
      )}, ${Math.round(currentSky2.b + this.progress * (nextSky2.b - currentSky2.b))})`
      // console.log('update sky 2', color)

      this.#settings.sky2 = color
    }

    // update Lights and toon
    this.#settings.coefShadow = current.coefShadow + this.progress * (next.coefShadow - current.coefShadow)

    const currentAmbient = hexToRgb(current.ambientLight)
    const nextAmbient = hexToRgb(next.ambientLight)

    if (currentAmbient) {
      const color = `rgb(${Math.round(
        currentAmbient.r + this.progress * (nextAmbient.r - currentAmbient.r)
      )}, ${Math.round(currentAmbient.g + this.progress * (nextAmbient.g - currentAmbient.g))}, ${Math.round(
        currentAmbient.b + this.progress * (nextAmbient.b - currentAmbient.b)
      )})`

      this.#settings.ambientLight = color
    }

    // sun Dir
    this.#settings.castShadows = next.castShadows

    if (this.#settings.castShadows) {
      this.#settings.sunDir.x = current.sunDirX + this.progress * (next.sunDirX - current.sunDirX)
      this.#settings.sunDir.y = current.sunDirY + this.progress * (next.sunDirY - current.sunDirY)
    } else {
      this.#settings.sunDir.y = MAX_SHADOW_CAMERA + 50
    }
    this.#sunDir.shadow.camera.position.copy(this.#settings.sunDir)
    this.#sunDir.shadow.camera.lookAt(new Vector3(0, 0, 0))

    // stars
    this.#settings.alphaStars = current.alphaStars + this.progress * (next.alphaStars - current.alphaStars)
    // clouds
    this.#settings.alphaClouds = current.alphaClouds + this.progress * (next.alphaClouds - current.alphaClouds)

    // ocean
    this.#settingsOcean.foam = current.ocean.foam + this.progress * (next.ocean.foam - current.ocean.foam)
    this.#settingsOcean.yScale = current.ocean.yScale + this.progress * (next.ocean.yScale - current.ocean.yScale)
    if (!this.forcedYStrength) {
      this.tlForceYStrength?.kill()
      this.tlRemoveForceYStrength?.kill()
      this.#settingsOcean.yStrength =
        current.ocean.yStrength + this.progress * (next.ocean.yStrength - current.ocean.yStrength)
    }
    this.#settingsOcean.alphaTex =
      current.ocean.alphaTex + this.progress * (next.ocean.alphaTex - current.ocean.alphaTex)
    this.#settingsOcean.alphaTex2 =
      current.ocean.alphaTex2 + this.progress * (next.ocean.alphaTex2 - current.ocean.alphaTex2)
    this.#settingsOcean.alphaWaves =
      current.ocean.alphaWaves + this.progress * (next.ocean.alphaWaves - current.ocean.alphaWaves)
    this.#settingsOcean.alphaLightnings =
      current.ocean.alphaLightnings + this.progress * (next.ocean.alphaLightnings - current.ocean.alphaLightnings)
    // console.log(this.progress, this.#settingsOcean.repeat)
    const currentColor = hexToRgb(current.ocean.color)
    const nextColor = hexToRgb(next.ocean.color)

    if (currentColor) {
      const color = `rgb(${Math.round(currentColor.r + this.progress * (nextColor.r - currentColor.r))}, ${Math.round(
        currentColor.g + this.progress * (nextColor.g - currentColor.g)
      )}, ${Math.round(currentColor.b + this.progress * (nextColor.b - currentColor.b))})`

      this.#settingsOcean.color = color
    }

    const currentFogColor = hexToRgb(current.ocean.fogColor)
    const nextFogColor = hexToRgb(next.ocean.fogColor)

    if (currentFogColor) {
      const color = `rgb(${Math.round(
        currentFogColor.r + this.progress * (nextFogColor.r - currentFogColor.r)
      )}, ${Math.round(currentFogColor.g + this.progress * (nextFogColor.g - currentFogColor.g))}, ${Math.round(
        currentFogColor.b + this.progress * (nextFogColor.b - currentFogColor.b)
      )})`

      this.#settingsOcean.fogColor = color
    }

    this.#settingsOcean.fogDensity =
      current.ocean.fogDensity + this.progress * (next.ocean.fogDensity - current.ocean.fogDensity)

    for (let i = 0; i < this.#toonMaterials.length; i++) {
      const material = this.#toonMaterials[i]
      material.uniforms.ambientColor.value = new Color(this.#settings.ambientLight)
      if (material.uniforms.coefShadow) {
        material.uniforms.coefShadow.value = this.#settings.coefShadow
      }
    }
  }

  forceYStrength() {
    this.forcedYStrength = true
    const yStrength = 9

    this.tlForceYStrength?.kill()
    this.tlRemoveForceYStrength?.kill()
    this.tlForceYStrength = new gsap.timeline()
    this.tlForceYStrength.to(this.#settingsOcean, {
      yStrength,
      duration: 3,
    })
  }

  removeForceYStrength() {
    this.forcedYStrength = false
    this.tlForceYStrength?.kill()
    this.tlRemoveForceYStrength?.kill()

    this.tlRemoveForceYStrength = new gsap.timeline()
    this.tlRemoveForceYStrength.to(this.#settingsOcean, {
      yStrength: DATA_ENV.explore[this.#index].ocean.yStrength,
      duration: 3,
    })
  }

  // update({ time, delta }) {}

  /**
   * Debug
   */
  _createDebugFolder() {
    if (!Debugger) return

    const settingsChangedHandler = () => {
      this.#sunDir.position.set(this.#settings.sunDir.x, this.#settings.sunDir.y, this.#settings.sunDir.z)
      this.#ambientLight.color = new Color(this.#settings.ambientLight)

      this.#toonMaterials.forEach((material) => {
        material.uniforms.ambientColor.value = new Color(this.#settings.ambientLight)
        if (material.uniforms.coefShadow) {
          material.uniforms.coefShadow.value = this.#settings.coefShadow
        }
      })

      // update shadowmap camera
      this.#sunShadowMap.camera.position.copy(this.#sunDir.position)
      this.#sunShadowMap.camera.lookAt(new Vector3(0, 0, 0))
    }

    const debugFolder = Debugger.addFolder({ title: `Env`, expanded: false })

    debugFolder.addInput(this.#settings, 'sunDir').on('change', settingsChangedHandler)
    debugFolder.addInput(this.#settings, 'ambientLight').on('change', settingsChangedHandler)
    debugFolder.addInput(this.#settings, 'coefShadow').on('change', settingsChangedHandler)
    debugFolder.addInput(this.#settings, 'sky')
    debugFolder.addInput(this.#settings, 'sky2')

    debugFolder.addInput(this.#settingsOcean, 'color')
    debugFolder.addInput(this.#settingsOcean, 'speedTex')
    debugFolder.addInput(this.#settingsOcean, 'speedWave')
    debugFolder.addInput(this.#settingsOcean, 'repeat')
    debugFolder.addInput(this.#settingsOcean, 'yScale', { step: 0.001 })
    debugFolder.addInput(this.#settingsOcean, 'yStrength')

    const btn = debugFolder.addButton({
      title: 'Copy settings',
      label: 'copy', // optional
    })

    btn.on('click', () => {
      navigator.clipboard.writeText(JSON.stringify(this.#settings))
      console.log('copied to clipboard', this.#settings)
    })
    return debugFolder
  }
}

export default new EnvManager()

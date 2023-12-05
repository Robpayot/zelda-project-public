import { Color, Object3D, ShaderMaterial, Vector2, Vector3 } from 'three'

import vertexShader from '@glsl/partials/common.vert'
import fragmentShaderLong from '@glsl/clouds/long.frag'
import fragmentShaderLongBack from '@glsl/clouds/longback.frag'
import fragmentShaderSmall from '@glsl/clouds/small.frag'
import LongCloud from './LongCloud'
import LoaderManager from '../../managers/LoaderManager'
import { randFloat, randInt } from 'three/src/math/MathUtils'
import SmallCloud from './SmallCloud'
import EnvManager from '../../managers/EnvManager'

const ASSETS_LONG = [{ map: 'long-cloud-1' }, { map: 'long-cloud-2' }]
const ASSETS_BACK = [{ map: 'long-cloud-back-1' }, { map: 'long-cloud-back-2' }]
const ASSETS_SMALL = [{ map: 'small-cloud-1' }, { map: 'small-cloud-2' }, { map: 'small-cloud-3' }]

// set up cloud
const SCALE_RATIO = 2
const SCALE_Y = 3.5
const SCALE_SMALL = 1.5
const RADIUS_SMALL = 1400 * SCALE_SMALL
const Y_SMALL = 200

export default class Clouds extends Object3D {
  #scene
  #debug
  #settings = {
    nbClouds: 21,
    nbBackClouds: 7,
    nbSmallClouds: 9,
    radius: 1400 * SCALE_Y,
    light: 0.3,
    y: 150 * SCALE_Y,
  }
  #clouds
  #materials = {}
  #materialsArr = []
  constructor({ debug, scene }) {
    super()

    this.#debug = debug
    this.#scene = scene

    this.#materials = this._createMaterials()

    for (const key in this.#materials) {
      this.#materialsArr.push(this.#materials[key])
    }

    this.#clouds = this._createClouds()

    this._createDebugFolder()

    this.renderOrder = 20
  }

  _createMaterials() {
    const materials = {}
    // long Cloud tex 1

    // Long
    for (let i = 0; i < ASSETS_LONG.length; i++) {
      const texName = ASSETS_LONG[i]

      const texture = LoaderManager.get(texName.map).texture

      materials[texName.map] = new ShaderMaterial({
        vertexShader,
        fragmentShader: fragmentShaderLong,
        uniforms: {
          map: { value: LoaderManager.get(texName.map).texture },
          light: { value: this.#settings.light },
          uTime: { value: 0 },
          globalOpacity: { value: EnvManager.settings.alphaClouds },
          smoothBlue: { value: new Vector2(0.4, 0.75) },
          textureSize: { value: new Vector2(texture.source.data.width, texture.source.data.height) },
        },
        transparent: true,
        depthWrite: false,
        // blending: AdditiveBlending
      })
    }

    // Long Back

    for (let i = 0; i < ASSETS_BACK.length; i++) {
      const texName = ASSETS_BACK[i]

      materials[texName.map] = new ShaderMaterial({
        vertexShader,
        fragmentShader: fragmentShaderLongBack,
        uniforms: {
          map: { value: LoaderManager.get(texName.map).texture },
          light: { value: this.#settings.light },
          uTime: { value: 0 },
          globalOpacity: { value: EnvManager.settings.alphaClouds },
          smoothBlue: { value: new Vector2(0, 1) },
        },
        transparent: true,
        depthWrite: false,
        // blending: AdditiveBlending
      })
    }

    return materials
  }

  _createClouds() {
    const clouds = []
    const total = this.#settings.nbClouds

    const divAngle = (Math.PI * 2) / total
    const radius = this.#settings.radius

    const DIR = [-1, 1]

    let countOrder

    const divAngleBack = (Math.PI * 2) / this.#settings.nbBackClouds

    // LONG BACK
    for (let i = 0; i < this.#settings.nbBackClouds; i++) {
      let cloudRadius = radius + 150 + randInt(-120, 120)
      let offsetAngle = randFloat(-0.1, 0.1)
      const currentAngle = divAngleBack * i + offsetAngle
      const x = cloudRadius * Math.cos(currentAngle)
      const z = cloudRadius * Math.sin(currentAngle)

      const y = this.#settings.y + randFloat(-4, 100) * SCALE_Y

      const numTex = randInt(0, ASSETS_BACK.length - 1)

      let material = this.#materials[ASSETS_BACK[numTex].map]

      const dir = DIR[randInt(0, 1)]

      const speed = randFloat(1, 2) * SCALE_RATIO

      const cloud = new LongCloud({
        position: new Vector3(x, y, z),
        material,
        index: countOrder,
        dir,
        speed,
        currentAngle,
        radius: cloudRadius,
      })

      const s = randFloat(4, 5.5) * SCALE_RATIO

      const sx = s * randFloat(1.5, 2) * SCALE_RATIO
      const sy = s * randFloat(1, 1.5) * SCALE_RATIO
      cloud.scale.set(sx, sy, s)

      this.add(cloud)

      countOrder++

      clouds.push(cloud)
    }

    // LONG

    for (let i = 0; i < total; i++) {
      let cloudRadius = radius + randInt(-120, 120)
      let offsetAngle = randFloat(-0.1, 0.1)
      const currentAngle = divAngle * i + offsetAngle
      const x = cloudRadius * Math.cos(currentAngle)
      const z = cloudRadius * Math.sin(currentAngle)

      const y = this.#settings.y + randFloat(-8, 200) * SCALE_Y

      const numTex = randInt(0, ASSETS_LONG.length - 1)

      let material = this.#materials[ASSETS_LONG[numTex].map]

      const dir = DIR[randInt(0, 1)]

      const speed = randFloat(1, 2) * SCALE_RATIO

      const cloud = new LongCloud({
        position: new Vector3(x, y, z),
        material,
        index: countOrder,
        dir,
        speed,
        currentAngle,
        radius: cloudRadius,
      })

      const s = randFloat(2, 2.5) * SCALE_RATIO

      const sx = s * randFloat(1.5, 2) * SCALE_RATIO
      const sy = s * randFloat(1, 1.5) * SCALE_RATIO
      cloud.scale.set(sx, sy, s)

      this.add(cloud)

      clouds.push(cloud)

      countOrder++
    }

    // SMALL
    for (let i = 0; i < total; i++) {
      let cloudRadius = RADIUS_SMALL + randInt(-500, -300)
      let offsetAngle = randFloat(-0.1, 0.1)
      const currentAngle = divAngle * i + offsetAngle
      const x = cloudRadius * Math.cos(currentAngle)
      const z = cloudRadius * Math.sin(currentAngle)

      const y = Y_SMALL + randFloat(120, 300) * SCALE_SMALL

      const numTex = randInt(0, ASSETS_SMALL.length - 1)

      const dir = DIR[randInt(0, 1)]

      const speed = randFloat(1, 2) * SCALE_RATIO

      // create material for each
      // Small
      const texName = ASSETS_SMALL[numTex]

      const material = new ShaderMaterial({
        vertexShader,
        fragmentShader: fragmentShaderSmall,
        uniforms: {
          map: { value: LoaderManager.get(texName.map).texture },
          light: { value: 0.1 },
          uTime: { value: 0 },
          opacity: { value: 1 },
          globalOpacity: { value: EnvManager.settings.alphaClouds },
        },
        transparent: true,
        depthWrite: false,
        // blending: AdditiveBlending
      })

      const cloud = new SmallCloud({
        position: new Vector3(x, y, z),
        material,
        index: countOrder,
        dir,
        speed,
        currentAngle,
        radius: cloudRadius,
        delay: randFloat(0, 30),
      })

      const s = randFloat(4, 6) * SCALE_SMALL

      const sx = s * randFloat(1.5, 2) * SCALE_SMALL
      const sy = s * randFloat(1, 1.5) * SCALE_SMALL
      cloud.scale.set(sx, sy, s)

      this.add(cloud)

      clouds.push(cloud)

      countOrder++
    }

    return clouds
  }

  _createMesh() {
    // const mesh = new Mesh(GEOMETRY, this.#material)
    // this.add(mesh)
  }

  /**
   * Update
   */
  update({ time, delta }) {
    for (let i = 0; i < this.#clouds.length; i++) {
      const cloud = this.#clouds[i]
      cloud.update({ time, delta })

      if (cloud.mainMaterial.uniforms.globalOpacity) {
        cloud.mainMaterial.uniforms.globalOpacity.value = EnvManager.settings.alphaClouds
      }
    }
  }

  resize({ width, height }) {}

  /**
   * Debug
   */
  _createDebugFolder() {
    if (!this.#debug) return

    return

    const settingsChangedHandler = () => {
      // this.#material.uniforms.color.value = new Color(this.#settings.color)
      this.#scene.background = new Color(this.#settings.color)
    }

    const debug = this.#debug.addFolder({ title: 'Sky', expanded: true })

    const btn = debug.addButton({
      title: 'Copy settings',
      label: 'copy', // optional
    })

    btn.on('click', () => {
      navigator.clipboard.writeText(JSON.stringify(this.#settings))
      console.log('copied to clipboard', this.#settings)
    })

    return debug
  }
}

import { AnimationMixer, LoopOnce, MeshBasicMaterial, ShaderMaterial, Vector2 } from 'three'
import LoaderManager from '@/js/managers/LoaderManager'
import ControllerManager from '@/js/managers/ControllerManager'
import EnvManager from '@/js/managers/EnvManager'
import { EventBusSingleton } from 'light-event-bus'

// Shaders
import vertexToonShader from '@glsl/partials/toon.vert'
import fragmentToonShader from '@glsl/partials/toon.frag'
// Receive shadows
import vertexReceiveShadowShader from '@glsl/shadows/receiveShadow.vert'
import fragmentReceiveShadowShader from '@glsl/shadows/receiveShadow.frag'

import fragmentShaderPupil from '@glsl/link/pupil.frag'
import fragmentShaderMouth from '@glsl/link/mouth.frag'
import { CUSTOM_LINK, DARK_LINK, END_CAMERA_LINK, START_CAMERA_LINK } from '../../utils/constants'
import Settings from '../../utils/Settings'

const NB_MOUTH = 8
const NB_EYES = 6

export default class Link {
  #debug
  #settings = {
    pupil: {
      dirX: 0,
      dirY: 0,
      scale: 1.05,
      switchMouth: false,
    },
    hatRX: 0,
    hatRY: 0,
    hatRZ: 0,
  }
  mastPos = 0
  sailState = 0.01
  #scene
  #mesh
  #pupilLeft
  #pupilRight
  #mouth
  #hat
  #mixer
  #mixerShield
  #mixerHead
  #shield
  #mouthIndex = 0
  #mouthTextures = []
  #eyeLeft
  #eyeRight
  #eyeLeftIndex = 0
  #eyeRightIndex = 0
  #eyesTextures = []
  #darkMouthTextures = []
  #isDark = false
  constructor({ debug, scene, gltf }) {
    this.#debug = debug
    this.#scene = scene

    this.#mesh = this._createMesh()

    this._createMaterials()

    this._createDebugFolder()

    //

    this.hatBoneA = this.#mesh.getObjectByName('hatA_jnt')
    this.hatBoneB = this.#mesh.getObjectByName('hatB_jnt')
    this.hatBoneC = this.#mesh.getObjectByName('hatC_jnt')

    this.hair1A = this.#mesh.getObjectByName('hair1A_jnt')
    this.hair1B = this.#mesh.getObjectByName('hair1B_jnt')
    this.hair2A = this.#mesh.getObjectByName('hair2A_jnt')
    this.hair2B = this.#mesh.getObjectByName('hair2B_jnt')

    this.hatBoneARotZ = -0.92 // FIX because default rotation is clear after animation is ready

    // Set up stance animation
    const animations = gltf.animations

    this.#mixer = new AnimationMixer(this.#mesh)
    this.#mixerHead = new AnimationMixer(this.#mesh)
    this.#mixerShield = new AnimationMixer(this.#shield)

    this.actions = []

    animations.forEach((animation) => {
      if (animation.name === 'stance') {
        const action = this.#mixer.clipAction(animation)
        action.play()
      } else if (animation.name === 'stanceCustom') {
        const action = this.#mixer.clipAction(animation)
        action.clampWhenFinished = true
        action.setLoop(LoopOnce)
        // action.play()
        this.actionStanceCustom = action
      } else if (animation.name === 'shieldAction') {
        // Animation for shield
        const action = this.#mixerShield.clipAction(animation)
        action.play()
      }
    })

    // Events
    EventBusSingleton.subscribe(START_CAMERA_LINK, this._playHeadAnimation)
    EventBusSingleton.subscribe(END_CAMERA_LINK, this._reverseHeadAnimation)
    EventBusSingleton.subscribe(CUSTOM_LINK, this._customFace)
    EventBusSingleton.subscribe(DARK_LINK, this._setDarkLink)
  }

  _playHeadAnimation = () => {
    this.actionStanceCustom.paused = false
    this.actionStanceCustom.timeScale = 1
    this.actionStanceCustom.play()
  }

  _reverseHeadAnimation = () => {
    this.actionStanceCustom.paused = false
    this.actionStanceCustom.timeScale = -1
    this.actionStanceCustom.play()
    this.#mixer.update(5)
  }

  _createMaterials() {
    const eyebrowLeft = this.#mesh.getObjectByName('link-eyebrowLeft')
    const eyebrowRight = this.#mesh.getObjectByName('link-eyebrowRight')
    const eyeLeft = this.#mesh.getObjectByName('link-eyeLeft')
    const eyeRight = this.#mesh.getObjectByName('link-eyeRight')
    const pupilLeft = this.#mesh.getObjectByName('link-pupilLeft')
    const pupilRight = this.#mesh.getObjectByName('link-pupilRight')
    this.#mouth = this.#mesh.getObjectByName('link-mouth')
    this.#hat = this.#mesh.getObjectByName('link-hat')

    this.#shield = this.#mesh.getObjectByName('link-shield')

    // replace materials with custom Toon
    this.#mesh.children.forEach((child) => {
      if (child.type === 'SkinnedMesh' || child.type === 'Mesh') {
        const textureOg = child.material.map
        child.material = new ShaderMaterial({
          vertexShader: vertexToonShader,
          fragmentShader: fragmentToonShader,
          uniforms: {
            map: { value: textureOg },
            sunDir: { value: EnvManager.sunDir.position },
            ambientColor: { value: EnvManager.ambientLight.color },
            coefShadow: { value: EnvManager.settings.coefShadow },
            sRGBSpace: {
              value: 0,
            },
          },
          defines: {
            USE_BONES: child.type === 'SkinnedMesh',
          },
          name: 'toon',
        })

        // cast Shadows for main body + hat

        if (
          child.name === 'link-arms-bassin' ||
          child.name === 'link-body-ears' ||
          child.name === 'link-arms-bassin' ||
          child.name === 'link-hair' ||
          child.name === 'link-head' ||
          child.name === 'link-hat' ||
          child.name === 'link-shield'
        ) {
          child.castCustomShadow = true
          // add receive shadows
          child.material = new ShaderMaterial({
            vertexShader: vertexReceiveShadowShader,
            fragmentShader: fragmentReceiveShadowShader,
            uniforms: {
              map: { value: textureOg },
              sunDir: { value: EnvManager.sunDir.position },
              ambientColor: { value: EnvManager.ambientLight.color },
              coefShadow: { value: EnvManager.settings.coefShadow },
              // receive shadows
              uDepthMap: {
                value: null, // EnvManager.sunShadowMap.map.texture,
              },
              uShadowCameraP: {
                value: EnvManager.sunShadowMap.camera.projectionMatrix,
              },
              uShadowCameraV: {
                value: EnvManager.sunShadowMap.camera.matrixWorldInverse,
              },
              sRGBSpace: {
                value: 0,
              },
            },
            defines: {
              USE_BONES: child.type === 'SkinnedMesh',
              USE_SHADOWS: Settings.castShadows,
            },
            name: 'toon',
          })
        }
      }
    })

    // eyebrow left
    const texEyebrowLeft = LoaderManager.get('eyebrow-1').texture
    texEyebrowLeft.flipY = false
    eyebrowLeft.material = new MeshBasicMaterial({
      map: texEyebrowLeft,
      transparent: true,
      // visible: false,
    })

    // eyebrowRight
    eyebrowRight.material = new MeshBasicMaterial({
      map: texEyebrowLeft,
      transparent: true,
      // visible: false,
    })

    for (let i = 0; i < NB_EYES; i++) {
      const texture = LoaderManager.get(`eye-${i + 1}`).texture
      texture.flipY = false
      this.#eyesTextures.push(texture)
    }

    // eye left
    eyeLeft.material = new MeshBasicMaterial({
      map: this.#eyesTextures[this.#eyeLeftIndex],
      transparent: true,
      // visible: false,
    })

    eyeLeft.renderOrder = 1

    this.#eyeLeft = eyeLeft
    // eyeLeft.visible = false

    eyeRight.material = new MeshBasicMaterial({
      map: this.#eyesTextures[this.#eyeRightIndex],
      transparent: true,
      // visible: false,
    })

    eyeRight.renderOrder = 1

    this.#eyeRight = eyeRight

    const texPupil = LoaderManager.get('pupil').texture
    texPupil.flipY = false

    pupilLeft.material = new ShaderMaterial({
      vertexShader: vertexToonShader,
      fragmentShader: fragmentShaderPupil,
      uniforms: {
        map: { value: texPupil },
        uMask: { value: this.#eyesTextures[this.#eyeLeftIndex] },
        uDir: { value: new Vector2(this.#settings.pupil.dirX, this.#settings.pupil.dirY) },
        uScale: { value: this.#settings.pupil.scale },
        uFLip: { value: -1 },
        sunDir: { value: EnvManager.sunDir.position },
        ambientColor: { value: EnvManager.ambientLight.color },
        coefShadow: { value: EnvManager.settings.coefShadow },
      },
      transparent: true,
      defines: {
        USE_BONES: true,
      },
      name: 'toon',
    })

    pupilLeft.renderOrder = 100

    pupilRight.material = new ShaderMaterial({
      vertexShader: vertexToonShader,
      fragmentShader: fragmentShaderPupil,
      uniforms: {
        map: { value: texPupil },
        uMask: { value: this.#eyesTextures[this.#eyeRightIndex] },
        uDir: { value: new Vector2(this.#settings.pupil.dirX, this.#settings.pupil.dirY) },
        uScale: { value: this.#settings.pupil.scale },
        uFLip: { value: 1 },
        sunDir: { value: EnvManager.sunDir.position },
        ambientColor: { value: EnvManager.ambientLight.color },
        coefShadow: { value: EnvManager.settings.coefShadow },
      },
      transparent: true,
      defines: {
        USE_BONES: true,
      },
      name: 'toon',
    })

    pupilRight.renderOrder = 100

    this.#pupilLeft = pupilLeft
    this.#pupilRight = pupilRight

    for (let i = 0; i < NB_MOUTH; i++) {
      const texture = LoaderManager.get(`mouth${i + 1}`).texture
      texture.flipY = false
      this.#mouthTextures.push(texture)
    }

    for (let i = 0; i < NB_MOUTH; i++) {
      const texture = LoaderManager.get(`dark-mouth${i + 1}`).texture
      texture.flipY = false
      this.#darkMouthTextures.push(texture)
    }

    this.#mouth.material = new ShaderMaterial({
      vertexShader: vertexReceiveShadowShader,
      fragmentShader: fragmentShaderMouth,
      uniforms: {
        map: { value: this.#mouthTextures[this.#mouthIndex] },
        sunDir: { value: EnvManager.sunDir.position },
        ambientColor: { value: EnvManager.ambientLight.color },
        coefShadow: { value: EnvManager.settings.coefShadow },
        // receive shadows
        uDepthMap: {
          value: null, // EnvManager.sunShadowMap.map.texture,
        },
        uShadowCameraP: {
          value: EnvManager.sunShadowMap.camera.projectionMatrix,
        },
        uShadowCameraV: {
          value: EnvManager.sunShadowMap.camera.matrixWorldInverse,
        },
      },
      defines: {
        USE_BONES: true,
        USE_SHADOWS: Settings.castShadows,
      },
      name: 'toon',
    })

    this.#mouth.receiveCustomShadow = true
  }

  _createMesh() {
    return this.#scene.getObjectByName('link')
  }

  _customFace = ({ type, incr, el }) => {
    let arrMouth = this.#mouthTextures
    if (this.#isDark) {
      arrMouth = this.#darkMouthTextures
    }
    if (type === 'mouth') {
      this.#mouthIndex += incr
      if (this.#mouthIndex < 0) {
        this.#mouthIndex = NB_MOUTH - 1
      } else if (this.#mouthIndex > NB_MOUTH - 1) {
        this.#mouthIndex = 0
      }

      this.#mouth.material.uniforms.map.value = arrMouth[this.#mouthIndex]

      el.innerHTML = this.#mouthIndex + 1
    } else if (type === 'eye-left') {
      this.#eyeLeftIndex += incr
      if (this.#eyeLeftIndex < 0) {
        this.#eyeLeftIndex = NB_EYES - 1
      } else if (this.#eyeLeftIndex > NB_EYES - 1) {
        this.#eyeLeftIndex = 0
      }

      this.#eyeLeft.material.map = this.#eyesTextures[this.#eyeLeftIndex]
      this.#pupilLeft.material.uniforms.uMask.value = this.#eyesTextures[this.#eyeLeftIndex]

      el.innerHTML = this.#eyeLeftIndex + 1
    } else if (type === 'eye-right') {
      this.#eyeRightIndex += incr
      if (this.#eyeRightIndex < 0) {
        this.#eyeRightIndex = NB_EYES - 1
      } else if (this.#eyeRightIndex > NB_EYES - 1) {
        this.#eyeRightIndex = 0
      }

      this.#eyeRight.material.map = this.#eyesTextures[this.#eyeRightIndex]
      this.#pupilRight.material.uniforms.uMask.value = this.#eyesTextures[this.#eyeRightIndex]

      el.innerHTML = this.#eyeRightIndex + 1
    }
  }

  _setDarkLink = () => {
    this.#isDark = true
    const darkTunic = LoaderManager.get('dark_tunic').texture
    darkTunic.flipY = false
    darkTunic.needsUpdate = true

    const texPupil = LoaderManager.get('dark_pupil').texture
    texPupil.flipY = false
    texPupil.needsUpdate = true

    this.#mesh.children.forEach((child) => {
      if (child.type === 'SkinnedMesh' || child.type === 'Mesh') {
        if (
          child.name === 'link-arms-bassin' ||
          child.name === 'link-belt' ||
          child.name === 'link-body-ears' ||
          child.name === 'link-hair' ||
          child.name === 'link-handLeft' ||
          child.name === 'link-handRight' ||
          child.name === 'link-hat' ||
          child.name === 'link-head' ||
          child.name === 'link-legs' ||
          child.name === 'link-nose'
        ) {
          if (child.material.uniforms) {
            child.material.uniforms.map.value = darkTunic
            child.material.uniforms.sRGBSpace.value = 1
          }
        }
      }
    })

    this.#mouth.material.uniforms.map.value = this.#darkMouthTextures[this.#mouthIndex]
    this.#pupilLeft.material.uniforms.map.value = texPupil
    this.#pupilRight.material.uniforms.map.value = texPupil
  }

  /**
   * Update
   */
  update({ time, delta }) {
    // stance animation
    this.#mixer?.update(0.07)
    this.#mixerShield?.update(0.05)
    // this.#mixerHead?.update(0.8)
    // this.hatBone.rotation.y = Math.sin(time * 0.8)

    this.hatBoneA.rotation.z = this.hatBoneARotZ + 0.88 * ControllerManager.boat.velocityP
    this.hatBoneB.rotation.z = Math.sin(time * 10) * 0.3 * ControllerManager.boat.velocityP
    this.hatBoneC.rotation.z = Math.sin(time * 15) * 0.4 * ControllerManager.boat.velocityP

    this.hair1A.rotation.z = Math.sin(time * 20) * 0.3 * ControllerManager.boat.velocityP
    this.hair2A.rotation.z = Math.sin(time * 15) * 0.4 * ControllerManager.boat.velocityP

    this.#pupilRight.material.uniforms.uDir.value = new Vector2(ControllerManager.boat.turnForce * 0.8, 0)
    this.#pupilLeft.material.uniforms.uDir.value = new Vector2(ControllerManager.boat.turnForce * 0.8, 0)
  }

  resize({ width, height }) {}

  /**
   * Debug
   */
  _createDebugFolder() {
    if (!this.#debug) return

    const settingsChangedHandler = () => {
      this.#pupilLeft.material.uniforms.uDir.value = new Vector2(this.#settings.pupil.dirX, this.#settings.pupil.dirY)
      this.#pupilRight.material.uniforms.uDir.value = new Vector2(this.#settings.pupil.dirX, this.#settings.pupil.dirY)
      this.#pupilLeft.material.uniforms.uScale.value = this.#settings.pupil.scale
      this.#pupilRight.material.uniforms.uScale.value = this.#settings.pupil.scale

      if (this.#settings.pupil.switchMouth) {
        let texture = LoaderManager.get('mouth7').texture

        this.#mouth.material.uniforms.map.value = texture
      } else {
        this.#mouth.material.uniforms.map.value = LoaderManager.get('mouth1').texture
      }
    }

    const debug = this.#debug.addFolder({ title: 'Link', expanded: false })

    debug.addInput(this.#settings.pupil, 'dirX').on('change', settingsChangedHandler)
    debug.addInput(this.#settings.pupil, 'dirY').on('change', settingsChangedHandler)
    debug.addInput(this.#settings.pupil, 'scale').on('change', settingsChangedHandler)
    debug.addInput(this.#settings.pupil, 'switchMouth').on('change', settingsChangedHandler)
    debug.addInput(this.#settings, 'hatRX').on('change', settingsChangedHandler)
    debug.addInput(this.#settings, 'hatRY').on('change', settingsChangedHandler)
    debug.addInput(this.#settings, 'hatRZ').on('change', settingsChangedHandler)

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

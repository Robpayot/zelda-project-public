import { AnimationMixer, Color, DoubleSide, Euler, LoopOnce, ShaderMaterial, Vector3 } from 'three'
import EnvManager from '../../managers/EnvManager'

// Toon
import vertexToonShader from '@glsl/partials/toon.vert'
import fragmentToonShader from '@glsl/partials/toon.frag'
import gsap from 'gsap'
import { degToRad } from 'three/src/math/MathUtils'
import LoaderManager from '../../managers/LoaderManager'
import { START_CAMERA_TREASURE_FOUND } from '../../utils/constants'
import { EventBusSingleton } from 'light-event-bus'

export default class Seabox {
  #object
  #debug
  #settings = {
    position: {
      x: 2.44,
      y: 68.62,
      z: 21.87,
    },
  }
  constructor(parent, debug) {
    this.#debug = debug
    // Custom Material

    const gltf = LoaderManager.get('seabox').gltf

    this.#object = gltf.scene.getObjectByName('seabox')

    this.#object.children.forEach((child) => {
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
            sRGBSpace: { value: 0 },
            scaleY: { value: 1 },
          },
          defines: {
            USE_BONES: child.type === 'SkinnedMesh',
          },
          name: 'toon',
        })
      }
    })

    const s = 0.0105
    this.#object.scale.set(s, s, s)

    this.#object.position.x = -1.35
    this.#object.position.y = -0.25
    this.#object.position.z = 0.465
    this.#object.rotation.z = degToRad(90)

    this.#object.initY = this.#object.position.y

    parent.add(this.#object)

    this.#object.visible = false

    this._createDebugFolder()

    EventBusSingleton.subscribe(START_CAMERA_TREASURE_FOUND, this._playTreasureAnimation)
  }

  get object() {
    return this.#object
  }

  reset() {
    this.#object.visible = false
    this.#object.position.x = -1.35
    this.#object.position.y = -0.25
    this.#object.position.z = 0.465
    this.#object.rotation.z = degToRad(90)

    this.#object.children[1].rotation.x = 0
  }

  pull(dir) {
    if (dir > 0) {
      this.#object.position.x = 1.35
    } else {
      this.#object.position.x = -1.35
    }

    this.#object.visible = true
  }

  _playTreasureAnimation = () => {
    this.#object.visible = true
    this.#object.position.x = 0
    this.#object.position.y = 0.1
    this.#object.position.z = 0.3
    this.#object.rotation.z = Math.PI

    gsap.to(this.#object.children[1].rotation, { x: degToRad(-100), duration: 2 })
  }

  /**
   * Debug
   */
  _createDebugFolder() {
    if (!this.#debug) return

    const settingsChangedHandler = (e) => {}

    const debug = this.#debug.addFolder({ title: 'Seabox', expanded: true })

    debug.addInput(this.#object, 'position', { step: 100 })
    debug.addInput(this.#object, 'rotation', { step: 100 })
    // debug.addInput(this.#settings, 'rotation', { step: 0.1 }).on('change', settingsChangedHandler)
    // debug.addInput(this.#rope, 'rotation')
    const btn = debug.addButton({
      title: 'Copy settings',
      label: 'copy', // optional
    })

    // btn.on('click', () => {
    //   navigator.clipboard.writeText(JSON.stringify(this.#settings))
    //   console.log('copied to clipboard', this.#settings)
    // })

    return debug
  }
}

import { BufferAttribute, BufferGeometry, Points, PointsMaterial } from 'three'
import vertexShader from '@glsl/boat/particlesJump.vert'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import LoaderManager from '../../managers/LoaderManager'
import { degToRad, lerp, randFloat } from 'three/src/math/MathUtils'
import ControllerManager from '../../managers/ControllerManager'
import EnvManager from '../../managers/EnvManager'
import SoundManager, { SOUNDS_CONST } from '../../managers/SoundManager'
import { MODE } from '../../utils/constants'
import ModeManager from '../../managers/ModeManager'

const MAX_OPACITY = 0.6
const NB_PARTICLES = 500
const GRAVITY = 0.5
const MAX_GRAVITY_LOW = -4

export default class ParticlesJump {
  #mesh
  #material
  #settings = {
    uDuration: 22.079601287841797,
    uForce: 0.01602332919157715,
    uCoefDelay: 8.086924171447755,
    uSpeed: 4.257499465942383,
    uCoefY: 2.737105579376221,
    uActive: 0,
  }
  jumpP = 0

  #debug
  #initZ = 7
  #initY = -1
  #targetUp = 0
  #up = 0
  constructor(parent, debug) {
    this.#debug = debug
    // Custom Material

    // Particles in Front
    // Create geometry
    const geometry = new BufferGeometry()

    let delayArray = []
    let sizeArray = []
    let positionArray = []
    let angleArray = []

    const range = 5

    for (let i = 0; i < NB_PARTICLES; i++) {
      delayArray.push(Math.random() + 1)
      sizeArray.push(randFloat(0.6, 1.5))

      const angle = randFloat(0, 360)
      const radius = randFloat(0, range)

      positionArray[i * 3] = Math.cos(degToRad(angle)) * radius
      positionArray[i * 3 + 1] = this.#initY
      positionArray[i * 3 + 2] = Math.sin(degToRad(angle)) * radius

      angleArray[i] = degToRad(randFloat(0, 360))
    }

    const position = new Float32Array(positionArray)
    const delay = new Float32Array(delayArray)
    const size = new Float32Array(sizeArray)
    const angle = new Float32Array(angleArray)

    // itemSize = 1 because there are 1 values (components) per vertex
    geometry.setAttribute('position', new BufferAttribute(position, 3))
    geometry.setAttribute('delay', new BufferAttribute(delay, 1))
    geometry.setAttribute('aSize', new BufferAttribute(size, 1))
    geometry.setAttribute('angle', new BufferAttribute(angle, 1))

    const texture = LoaderManager.get('bubble').texture

    this.#material = new CustomShaderMaterial({
      baseMaterial: PointsMaterial,
      vertexShader,
      // fragmentShader,
      map: texture,
      silent: true, // Disables the default warning if true
      uniforms: {
        uTime: { value: 100 },
        uDuration: { value: this.#settings.uDuration },
        uCoefDelay: { value: this.#settings.uCoefDelay },
        uCoefY: { value: this.#settings.uCoefY },
        uActive: { value: 1 },
        uProgress: { value: 0 },
      },
      // side: DoubleSide,
      transparent: true,
      opacity: MAX_OPACITY,
      alphaTest: 0.5,
    })

    this.#mesh = new Points(geometry, this.#material)

    this.#mesh.position.z = this.#initZ
    this.#mesh.position.y = 0

    parent.add(this.#mesh)

    this._createDebugFolder()
  }

  get mesh() {
    return this.#mesh
  }

  update({ time, delta, velocity }) {
    // Jump
    if (ControllerManager.boat.up > 0) {
      this.progress = 0
      // this.#mesh.position.z -= ControllerManager.boat.velocity * ControllerManager.boat.speedTextureOffset
      if (!this.startJump) {
        this.startJump = true
        this.finishJump = false
      }
    } else if (this.startJump) {
      this.startJump = false
      this.go = true

      if (!this.finishJump) {
        this.#mesh.position.z = this.#initZ
        this.finishJump = true
        if (ModeManager.state === MODE.EXPLORE) {
          SoundManager.play(SOUNDS_CONST.DROP_WATER)
        }

        if (this.#up >= MAX_GRAVITY_LOW) {
          this.#up = -1
          this.#targetUp = 14.5
        }
      }
    }

    if (this.go) {
      this.#mesh.position.z -= ControllerManager.boat.velocity * ControllerManager.boat.speedTextureOffset
    }

    this.#up = Math.max(MAX_GRAVITY_LOW, lerp(this.#up, this.#targetUp, 0.05))
    this.#targetUp -= GRAVITY

    if (this.#up === MAX_GRAVITY_LOW) {
      this.#mesh.visible = false
    } else {
      this.#mesh.visible = true
    }

    this.#material.uniforms.uProgress.value = this.#up
    this.#material.opacity = MAX_OPACITY * Math.min(1, EnvManager.settingsOcean.foam)
    this.#material.alphaTest = this.#material.opacity - 0.05
  }

  /**
   * Debug
   */
  _createDebugFolder() {
    if (!this.#debug) return

    const settingsChangedHandler = () => {
      this.#material.uniforms.uDuration.value = this.#settings.uDuration
      this.#material.uniforms.uForce.value = this.#settings.uForce
      this.#material.uniforms.uCoefDelay.value = this.#settings.uCoefDelay
      this.#material.uniforms.uCoefY.value = this.#settings.uCoefY
    }

    const debug = this.#debug.addFolder({ title: 'Splash Jump', expanded: false })

    debug.addInput(this.#settings, 'uDuration').on('change', settingsChangedHandler)
    debug.addInput(this.#settings, 'uForce').on('change', settingsChangedHandler)
    debug.addInput(this.#settings, 'uCoefDelay').on('change', settingsChangedHandler)
    debug.addInput(this.#settings, 'uCoefY').on('change', settingsChangedHandler)
    debug.addInput(this.#settings, 'uActive', { min: 0, max: 1 }).on('change', settingsChangedHandler)
    debug.addInput(this.#settings, 'uSpeed')

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

import { BufferAttribute, BufferGeometry, Points, PointsMaterial } from 'three'
import vertexShader from '@glsl/boat/particlesFront.vert'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import LoaderManager from '../../managers/LoaderManager'
import { degToRad, randFloat } from 'three/src/math/MathUtils'
import ControllerManager from '../../managers/ControllerManager'
import { gsap } from 'gsap'
import EnvManager from '../../managers/EnvManager'
import { BOAT_MODE } from '.'

const MAX_OPACITY = 0.8
const NB_PARTICLES = 2300

export default class ParticlesFront {
  #mesh
  #material
  #settings = {
    uDuration: 22.079601287841797,
    uForce: 0.0223926472,
    uCoefDelay: 8.086924171447755,
    uSpeed: 4.257499465942383,
    uCoefY: 2.274037380218506,
    uActive: 0,
  }
  jumpP = 0

  #debug
  #initZ = 6
  maxSpeed = 1
  constructor(parent, debug, scene) {
    this.#debug = debug
    // Custom Material

    // Particles in Front
    // Create geometry
    const geometry = new BufferGeometry()

    let delayArray = []
    let sizeArray = []
    let positionArray = []
    let angleArray = []

    for (let i = 0; i < NB_PARTICLES; i++) {
      delayArray.push(Math.random() + 1)
      sizeArray.push(randFloat(0.6, 1.5))

      positionArray[i * 3] = 0
      positionArray[i * 3 + 1] = 0
      positionArray[i * 3 + 2] = 1.6

      angleArray[i] = degToRad(randFloat(5, 175))
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
        uForce: { value: this.#settings.uForce },
        uCoefDelay: { value: this.#settings.uCoefDelay },
        uCoefY: { value: this.#settings.uCoefY },
        uActive: { value: 1 },
      },
      // side: DoubleSide,
      // TODO: depthTest / Write ?
      transparent: true,
      opacity: MAX_OPACITY,
      // alphaTest: 0.6,
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
      this.#mesh.position.z -= ControllerManager.boat.velocity * ControllerManager.boat.speedTextureOffset
      if (!this.startJump) {
        this.startJump = true
        this.finishJump = false
        this.tlJump?.kill()
        this.tlJumpFinish?.kill()
        this.tlJump = gsap.to(this, {
          jumpP: 1,
          duration: 0.6,
        })
      }
    } else if (this.startJump) {
      this.startJump = false
      if (!this.finishJump) {
        this.#mesh.position.z = this.#initZ
        this.finishJump = true
        this.tlJumpFinish?.kill()
        this.tlJump?.kill()
        this.tlJumpFinish = gsap.fromTo(
          this,
          {
            jumpP: 1,
          },
          {
            jumpP: 0,
            duration: 0.5,
          }
        )
      }
    }

    const progress = velocity * (1 - this.jumpP) * this.maxSpeed

    this.#material.uniforms.uTime.value += (delta / 16) * this.#settings.uSpeed
    this.#material.uniforms.uActive.value = progress
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

    const debug = this.#debug.addFolder({ title: 'Splash Front', expanded: false })

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

  transitioningSpeed(mode) {
    if (mode === BOAT_MODE.HOOK) {
      gsap.to(this, { maxSpeed: 0.2, duration: 1.5 })
    } else {
      gsap.to(this, { maxSpeed: 1, duration: 1.5 })
    }
  }
}

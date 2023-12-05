import { BufferAttribute, Points, PointsMaterial } from 'three'
import vertexShader from '@glsl/boat/particlesSide.vert'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import LoaderManager from '../../managers/LoaderManager'
import { randFloat } from 'three/src/math/MathUtils'
import ControllerManager from '../../managers/ControllerManager'
import EnvManager from '../../managers/EnvManager'

const MAX_OPACITY = 0.4

export default class ParticlesSide {
  #mesh
  #material
  #settings = {
    uDuration: 13.812566757202148,
    uForce: 0.0153018208,
    uCoefDelay: 1,
    uSpeed: 0.4844324875,
    uCoefY: 0.28125667572021484,
    uActive: 0,
  }

  #debug
  constructor(parent, debug) {
    this.#debug = debug
    // Custom Material

    // Particles around boat
    const particlesEdgeMesh = parent.getObjectByName('particles-boat')

    const geoParticles = particlesEdgeMesh.geometry.clone()

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
        uActive: { value: 0 },
      },
      // side: DoubleSide,
      transparent: true,
      opacity: MAX_OPACITY,
      // alphaWrite: false,
      alphaTest: 0.3,
    })

    const count = geoParticles.attributes.position.count

    let delayArray = []
    let sizeArray = []

    for (let i = 0; i < count; i++) {
      delayArray.push(Math.random() + 1)
      sizeArray.push(randFloat(0.2, 0.8))
    }

    const delay = new Float32Array(delayArray)
    const size = new Float32Array(sizeArray)

    // itemSize = 1 because there are 1 values (components) per vertex
    geoParticles.setAttribute('delay', new BufferAttribute(delay, 1))
    geoParticles.setAttribute('aSize', new BufferAttribute(size, 1))

    this.#mesh = new Points(geoParticles, this.#material)

    parent.remove(particlesEdgeMesh)
    parent.add(this.#mesh)

    this._createDebugFolder()
  }

  get mesh() {
    return this.#mesh
  }

  update({ time, delta, turnForce, velocity }) {
    this.#material.uniforms.uTime.value += (delta / 16) * this.#settings.uSpeed
    this.#material.opacity = Math.min(
      2 * turnForce + velocity,
      MAX_OPACITY * Math.min(1, EnvManager.settingsOcean.foam)
    )
    this.#material.uniforms.uActive.value = Math.min(3 * turnForce + velocity, 1)

    this.#material.alphaTest = this.#material.opacity - 0.05

    if (ControllerManager.boat.up > 0) {
      this.#material.opacity = 0
    }
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
      this.#material.opacity = 0.5 * this.#settings.uActive
    }

    const debug = this.#debug.addFolder({ title: 'Splash Side', expanded: false })

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

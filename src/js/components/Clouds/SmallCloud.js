import { gsap } from 'gsap'
import { Color, Mesh, Object3D, PlaneGeometry, Vector3 } from 'three'
import { randFloat } from 'three/src/math/MathUtils'

const GEOMETRY = new PlaneGeometry(50, 50)

const CENTER = new Vector3(0, 0, 0)

export default class SmallCloud extends Object3D {
  #material
  #debug
  #settings = {
    color: '#4c6ed4',
    repeat: 10,
    speedTex: 0.001,
  }
  #index
  #dir
  #speed
  #currentAngle
  #radius
  #scaleDown
  #scale = 1
  #tlScale
  #mesh
  constructor({ debug, position, material, index, dir, speed, currentAngle, radius, scaleDown, delay }) {
    super()

    this.#index = index
    this.#currentAngle = currentAngle
    this.#debug = debug
    this.#material = material
    this.#dir = dir
    this.#speed = speed
    this.#radius = radius
    this.#scaleDown = scaleDown

    this.position.copy(position)

    this.#mesh = this._createMesh()

    this.lookAt(CENTER)
    this.#tlScale = new gsap.timeline({ repeat: -1, delay })
    const mesh = this.#mesh
    const duration = randFloat(15, 25)
    this.#tlScale.to(mesh.scale, { x: 0, y: 0, duration }, 1)
    this.#tlScale.to(material.uniforms.opacity, { value: 0, duration }, 1)
    this.#tlScale.add(() => {
      // update position
      this.#currentAngle = randFloat(-Math.PI * 2, Math.PI * 2)
      material.uniforms.opacity.value = 0
      mesh.scale.x = 1
      mesh.scale.y = 1
    })
    this.#tlScale.to(material.uniforms.opacity, { value: 1, duration: 5 })

    // this._createDebugFolder()
  }

  get mainMaterial() {
    return this.#material
  }

  _createMesh() {
    const mesh = new Mesh(GEOMETRY, this.#material)
    mesh.renderOrder = this.#index + 10
    this.add(mesh)
    return mesh
  }

  /**
   * Update
   */
  update({ time, delta }) {
    this.#material.uniforms.uTime.value += (delta / 16) * this.#settings.speedTex

    this.#currentAngle += this.#speed * this.#dir * (delta / 16) * 0.00004

    const x = this.#radius * Math.cos(this.#currentAngle)
    const z = this.#radius * Math.sin(this.#currentAngle)

    this.position.x = x
    this.position.z = z

    this.lookAt(CENTER)
  }

  resize({ width, height }) {}

  /**
   * Debug
   */
  _createDebugFolder() {
    if (!this.#debug) return

    const settingsChangedHandler = () => {
      this.#material.uniforms.color.value = new Color(this.#settings.color)
      this.#material.uniforms.repeat.value = this.#settings.repeat
    }

    const debug = this.#debug.addFolder({ title: 'Ocean', expanded: true })

    debug.addInput(this.#settings, 'color').on('change', settingsChangedHandler)
    debug.addInput(this.#settings, 'repeat').on('change', settingsChangedHandler)

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

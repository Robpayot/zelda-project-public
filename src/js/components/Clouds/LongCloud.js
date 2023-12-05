import { Color, Mesh, Object3D, PlaneGeometry, Vector3 } from 'three'

const GEOMETRY = new PlaneGeometry(200, 50)

const CENTER = new Vector3(0, 0, 0)

export default class LongCloud extends Object3D {
  #material
  #debug
  #settings = {
    color: '#4c6ed4',
    repeat: 10,
    speedTex: 0.001,
  }
  #scale = 15
  #index
  #dir
  #speed
  #currentAngle
  #radius
  constructor({ debug, position, material, index, dir, speed, currentAngle, radius }) {
    super()

    this.#index = index
    this.#currentAngle = currentAngle
    this.#debug = debug
    this.#material = material
    this.#dir = dir
    this.#speed = speed
    this.#radius = radius

    this.position.copy(position)

    this._createMesh()

    this.lookAt(CENTER)

    // this._createDebugFolder()
  }

  get mainMaterial() {
    return this.#material
  }

  _createMesh() {
    const mesh = new Mesh(GEOMETRY, this.#material)
    mesh.renderOrder = this.#index + 10
    this.add(mesh)
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

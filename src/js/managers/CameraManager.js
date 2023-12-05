// Modules
import Debugger from '@/js/managers/Debugger'

export default class CameraManager {
  #config
  #renderer
  #scene
  #cameras
  #active
  #isEnabled
  #debug
  #settings
  constructor({ config, renderer, scene, cameras, settings }) {
    // Options
    this.#config = config
    this.#renderer = renderer
    this.#scene = scene
    this.#cameras = cameras
    this.#settings = settings

    // Props
    this.#active = null
    this.#isEnabled = false

    // Setup
    this.#debug = this._createDebug()
    this.#cameras = this._createCameras()
    this._setupDebugTypes()
  }

  destroy() {
    this._destroyCameras()
  }

  /**
   * Getters & Setters
   */
  get active() {
    return this.#active
  }

  /**
   * Public
   */
  get(name) {
    return this._getCamera(name)
  }

  enable() {
    this.#isEnabled = true
    this.#active?.enable()
  }

  disable() {
    this.#isEnabled = false
    this.#active?.disable()
  }

  activate(name) {
    if (this.#active && this.#active.name === name) return

    this.#active?.hide()
    this.#active?.disable()

    const camera = this.get(name)
    if (camera) {
      this.#active = camera
      this.#active.enable()
      this.#active.show()
      // this.dispatchEvent('change', camera)
    }

    this._updateDebugCamera(this.#active)
  }

  /**
   * Private
   */
  _createCameras() {
    const createdCameras = []
    this.#cameras.forEach((camera) => {
      const options = {
        debug: this.#debug,
        renderer: this.#renderer,
        scene: this.#scene,
        settings: camera.settings,
      }

      const instance = new camera.camera(options)
      instance.name = camera.name
      createdCameras.push(instance)
    })
    return createdCameras
  }

  _getCamera(name) {
    return this.#cameras.find((camera) => camera.name === name)
  }

  _destroyCameras() {
    this.#cameras.forEach((camera) => {
      if (typeof camera.destroy === 'function') camera.destroy()
    })
    this.#cameras = null
  }

  /**
   * Update
   */
  update({ time, delta }) {
    if (!this.#isEnabled) return

    this.#cameras.forEach((camera) => {
      if (typeof camera.update === 'function') camera.update({ time, delta })
    })
  }

  updateMode(mode) {
    this.active?.updateMode(mode)
  }

  /**
   * Resize
   */
  resize(width, height) {
    this.#cameras.forEach((camera) => camera.resize(width, height))
  }

  /**
   * Debug
   */
  _createDebug() {
    if (!Debugger) return
    const debug = Debugger.addFolder({ title: 'Cameras', tab: this.#config.name })
    return debug
  }

  _setupDebugTypes() {
    if (!this.#debug) return

    const options = {}
    this.#cameras.forEach((camera) => {
      options[camera.name] = camera.name
    })

    this.#debug
      .addBlade({
        view: 'list',
        label: 'camera',
        value: null,
        options,
      })
      .on('change', ({ value }) => {
        this.activate(value)
      })
  }

  _updateDebugCamera(camera) {
    if (!this.#debug) return
    const debug = this.#debug.children.find((child) => child.label === 'camera')
    debug.value = camera.name
  }
}

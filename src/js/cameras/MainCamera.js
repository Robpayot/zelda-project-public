import { PerspectiveCamera } from 'three'

export default class MainCamera {
  #settings
  #scene
  camera
  index = 0
  #instance
  #name

  constructor({ scene, settings, renderer }) {
    this.#scene = scene
    this.#settings = settings
    // Setup
    this.#instance = this._createInstance()
  }

  /**
   * Getters & Setters
   */
  get name() {
    return this.#name
  }

  set name(value) {
    this.#name = value
  }

  get instance() {
    return this.#instance
  }

  /**
   * Private
   */
  _createInstance() {
    const settings = this.#settings.explore
    const aspectRatio = window.innerWidth / window.innerHeight
    const fieldOfView = settings.fov
    const nearPlane = 0.1
    const farPlane = 10000

    const instance = new PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane)
    instance.position.copy(settings.position)
    instance.lookAt(0, 0, 0)

    return instance
  }

  /**
   * Public
   */
  enable() {
    this._isEnabled = true
  }

  disable() {
    this._isEnabled = false
  }

  show() {}

  hide() {}

  // handleMouseMove = (e) => {
  //   const { x, y } = e.detail
  //   const forceX = this.#rotateForceX
  //   const forceY = this.#rotateForceY

  //   this.#targetRotateX = y * forceX
  //   this.#targetRotateY = -x * forceY
  // }

  update(deltaTime) {
    // if (!ResizeManager.isTouch) {
    //   this.mouseMoveCamera(deltaTime)
    // }
  }

  mouseMoveCamera(deltaTime) {
    // if (this.camera.rotation.x !== degToRad(this.#targetRotateX)) {
    //   this.camera.rotation.x = lerp(this.camera.rotation.x, degToRad(this.#targetRotateX), this.#coefRotate * deltaTime)
    // }
    // if (this.camera.rotation.y !== degToRad(this.#targetRotateY)) {
    //   this.camera.rotation.y = lerp(this.camera.rotation.y, degToRad(this.#targetRotateY), this.#coefRotate * deltaTime)
    // }
  }

  resize({ width, height }) {
    this.#instance.aspect = width / height
    this.#instance.updateProjectionMatrix()
  }

  destroy() {
    this.events(false)
  }
}

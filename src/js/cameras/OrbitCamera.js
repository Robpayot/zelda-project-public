// Vendor
import { PerspectiveCamera, Vector3 } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EventBusSingleton } from 'light-event-bus'
import {
  CAMERA_FOLLOW,
  CLOSE_TREASURE,
  END_CAMERA_LINK,
  MODE,
  START_CAMERA_LINK,
  START_CAMERA_TREASURE_FOUND,
  START_TOUCH,
} from '../utils/constants'
import gsap from 'gsap'
import ControllerManager from '../managers/ControllerManager'
import { degToRad, lerp } from 'three/src/math/MathUtils'
import Settings from '../utils/Settings'
import CinematicManager from '../managers/CinematicManager'

// Constants
const DEFAULT_POSITION = new Vector3(50, 20, 0)

export default class OrbitCamera {
  #debugContainer
  #renderer
  #near
  #far
  #fov
  #name
  #isEnabled
  #instance
  #controls
  #settings
  // camera pos for Treasure found
  #distanceTreasure = 45
  #initAngleTreasure = degToRad(-90)
  #initYTreasure = 50
  followX = 0
  followZ = 0
  controlTargetX = 0
  controlTargetZ = 0
  constructor({ debug, renderer, settings }) {
    // Options
    this.#debugContainer = debug
    this.#renderer = renderer
    this.#settings = settings

    // Props
    this.#name = null
    this.#isEnabled = false

    // Setup
    this.#instance = this._createInstance()
    this.#controls = this._createControls()

    this.#controls.addEventListener('change', () => {
      if (Settings.touch) {
        this.controlTargetX = this.#instance.position.x
        this.controlTargetZ = this.#instance.position.z
      }
    })

    EventBusSingleton.subscribe(START_CAMERA_LINK, this.goToLink)
    EventBusSingleton.subscribe(END_CAMERA_LINK, this.leaveLink)
    EventBusSingleton.subscribe(CAMERA_FOLLOW, this.cameraFollow)
    EventBusSingleton.subscribe(START_TOUCH, this.resetCameraFollow)
    EventBusSingleton.subscribe(START_CAMERA_TREASURE_FOUND, this.cinematicTreasureFound)
    EventBusSingleton.subscribe(CLOSE_TREASURE, this.cinematicTreasureFoundReset)
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
   * Public
   */
  enable() {
    this.#isEnabled = true
    this.#controls.enabled = true
  }

  disable() {
    this.#isEnabled = true
    this.#controls.enabled = false
  }

  show() {
    this._showDebug()
  }

  hide() {
    this._hideDebug()
  }

  updateMode(mode) {
    let settings = {}
    if (mode === MODE.EXPLORE) {
      settings = this.#settings.explore
      if (Settings.touch) {
        settings = this.#settings.exploreTouch
      }
      this.#controls.enabled = true
    } else if (mode === MODE.GAME) {
      settings = this.#settings.game
      this.#controls.enabled = false
    }

    if (!settings.position) return

    this.instance.position.copy(settings.position)
    this.instance.lookAt(0, 0, 0)
    this.instance.zoom = settings.zoom
    this.instance.fov = settings.fov

    this.instance.setRotationFromEuler(settings.rotation)

    this.distFromCenter = this.#controls.getDistance()

    this.initAngle = Math.atan2(0 - this.instance.position.z, 0 - this.instance.position.x)

    this.followX = this.distFromCenter * Math.cos(ControllerManager.boat.angleDir - this.initAngle)
    this.followZ = this.distFromCenter * Math.sin(ControllerManager.boat.angleDir - this.initAngle)

    this.controlTargetX = this.followX
    this.controlTargetZ = this.followZ
  }

  /**
   * Private
   */
  _createInstance() {
    const settings = this.#settings.explore
    const aspectRatio = window.innerWidth / window.innerHeight
    const fieldOfView = settings.fov
    const nearPlane = 0.1
    const farPlane = 7500

    const instance = new PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane)
    instance.position.copy(settings.position)
    instance.lookAt(0, 0, 0)
    instance.zoom = settings.zoom

    instance.setRotationFromEuler(settings.rotation)

    return instance
  }

  _createControls() {
    const controls = new OrbitControls(this.#instance, this.#renderer.domElement)
    controls.screenSpacePanning = true
    controls.enabled = false

    const savedTarget = JSON.parse(localStorage.getItem('camera-orbit-target'))
    if (savedTarget) {
      controls.target.x = savedTarget.x
      controls.target.y = savedTarget.y
      controls.target.z = savedTarget.z
    }

    controls.target = new Vector3(0, 7.5, 2)
    controls.maxDistance = 120
    controls.minDistance = 20
    controls.maxPolarAngle = degToRad(85)

    controls.enablePan = false

    controls.update()

    return controls
  }

  goToLink = () => {
    this.instance.lookAt(this.#controls.target.x, this.#controls.target.y, this.#controls.target.z)
    this.#controls.enabled = false

    const playerDir = -ControllerManager.boat.angleDir

    const angle = playerDir
    const radius = 20

    const x = radius * Math.cos(angle)
    const z = radius * Math.sin(angle)

    gsap.to(this.instance.position, {
      x: x,
      y: 10,
      z: z,
      duration: 2,
      onUpdate: () => {
        this.instance.lookAt(this.#controls.target.x, this.#controls.target.y, this.#controls.target.z)
      },
      ease: 'power4.out',
    })
  }

  leaveLink = () => {
    const settings = this.#settings.explore

    if (Settings.touch) {
      const targetX = -this.distFromCenter * Math.cos(ControllerManager.boat.angleDir - this.initAngle)
      const targetZ = this.distFromCenter * Math.sin(ControllerManager.boat.angleDir - this.initAngle)
      gsap.to(this.instance.position, {
        x: targetX,
        y: this.#settings.exploreTouch.position.y,
        z: targetZ,
        duration: 2,
        ease: 'power4.out',
        onUpdate: () => {
          this.instance.lookAt(this.#controls.target.x, this.#controls.target.y, this.#controls.target.z)
        },
        onComplete: () => {
          this.#controls.enabled = true
        },
      })
    } else {
      gsap.to(this.instance.position, {
        x: settings.position.x,
        y: settings.position.y,
        z: settings.position.z,
        duration: 2,
        ease: 'power4.out',
        onUpdate: () => {
          this.instance.lookAt(this.#controls.target.x, this.#controls.target.y, this.#controls.target.z)
        },
        onComplete: () => {
          this.#controls.enabled = true
        },
      })
    }
  }

  cinematicTreasureFound = (angleDir) => {
    this.lastAngleDir = angleDir
    this.#controls.enabled = false

    const targetX = -this.#distanceTreasure * Math.cos(angleDir - this.#initAngleTreasure)
    const targetZ = this.#distanceTreasure * Math.sin(angleDir - this.#initAngleTreasure)

    this.#instance.position.x = targetX
    this.#instance.position.z = targetZ
    this.#instance.position.y = this.#initYTreasure

    this.instance.lookAt(this.#controls.target.x, this.#controls.target.y, this.#controls.target.z)

    const obj = { val: this.#distanceTreasure }
    gsap.to(obj, {
      val: 22,
      duration: 6.5,
      ease: 'power1.inOut',
      onUpdate: () => {
        const targetX = -obj.val * Math.cos(angleDir - this.#initAngleTreasure)
        const targetZ = obj.val * Math.sin(angleDir - this.#initAngleTreasure)

        this.#instance.position.x = targetX
        this.#instance.position.z = targetZ
        this.#instance.position.y = 5 + obj.val
        this.instance.lookAt(this.#controls.target.x, this.#controls.target.y, this.#controls.target.z)
      },
    })
  }

  cinematicTreasureFoundReset = () => {
    let settings = {}
    settings = this.#settings.explore
    if (Settings.touch) {
      settings = this.#settings.exploreTouch
    }

    const targetX = -this.distFromCenter * Math.cos(this.lastAngleDir - this.#initAngleTreasure)
    const targetZ = this.distFromCenter * Math.sin(this.lastAngleDir - this.#initAngleTreasure)

    this.#instance.position.x = targetX
    this.#instance.position.z = targetZ
    this.#instance.position.y = settings.position.y

    const startY = settings.position.y
    const endY = this.#controls.target.y

    this.instance.lookAt(this.#controls.target.x, startY, this.#controls.target.z)

    const obj = { val: startY }
    gsap.to(obj, {
      val: endY,
      duration: 3,
      ease: 'power2.out',
      onUpdate: () => {
        this.instance.lookAt(this.#controls.target.x, obj.val, this.#controls.target.z)
      },
      onComplete: () => {
        CinematicManager.end()
        this.#controls.enabled = true
      },
    })
  }

  cameraFollow = (angleDir) => {
    if (this.resetCam) return
    const targetX = -this.distFromCenter * Math.cos(angleDir - this.initAngle)
    const targetZ = this.distFromCenter * Math.sin(angleDir - this.initAngle)

    // this.controlTargetX = lerp(this.controlTargetX, targetX, 0.01)
    // this.controlTargetZ = lerp(this.controlTargetZ, targetZ, 0.01)

    this.followX = lerp(this.followX, targetX, 0.1)
    this.followZ = lerp(this.followZ, targetZ, 0.1)

    this.#instance.position.x = this.followX
    this.#instance.position.z = this.followZ
    this.#instance.position.y = this.#settings.exploreTouch.position.y
    this.instance.lookAt(this.#controls.target.x, this.#controls.target.y, this.#controls.target.z)
    // console.log(angleDir, this.#controls, this.#controls.getDistance())
  }

  resetCameraFollow = (angleDir) => {
    this.resetCam = true

    const targetX = -this.distFromCenter * Math.cos(angleDir - this.initAngle)
    const targetZ = this.distFromCenter * Math.sin(angleDir - this.initAngle)

    gsap.to(this.instance.position, {
      x: targetX,
      y: this.#settings.exploreTouch.position.y,
      z: targetZ,
      duration: 1,
      onUpdate: () => {
        this.instance.lookAt(this.#controls.target.x, this.#controls.target.y, this.#controls.target.z)
        this.followX = targetX
        this.followZ = targetZ
      },
      onComplete: () => {
        this.resetCam = false
      },
    })
  }

  /**
   * Resize
   */

  /**
   * Resize
   */
  resize({ width, height }) {
    this.#instance.aspect = width / height
    this.#instance.updateProjectionMatrix()
  }

  /**
   * Debug
   */
  _showDebug() {
    if (!this.#debugContainer) return

    const _this = this
    function updateCamera() {
      _this.#instance.updateProjectionMatrix()
    }

    const props = {
      frustum: { min: this.#instance.near, max: this.#instance.far },
    }

    this._debug = this.#debugContainer.addFolder({ title: 'Orbit' })
    this._debug.addInput(props, 'frustum', { min: 0.01, max: 5000, step: 1 }).on('change', () => {
      this.#instance.near = props.frustum.min
      this.#instance.far = props.frustum.max
      updateCamera()
    })
    this._debug.addInput(this.#instance, 'fov', { min: 1, max: 180 }).on('change', updateCamera)
    this._debug.addInput(this.#instance, 'zoom').on('change', updateCamera)
    this._debug.addButton({ title: 'Save position' }).on('click', () => {
      localStorage.setItem('camera-orbit-position', JSON.stringify(this.#instance.position))
      localStorage.setItem('camera-orbit-target', JSON.stringify(this.#controls.target))
    })
    this._debug.addButton({ title: 'Reset position' }).on('click', () => {
      localStorage.removeItem('camera-orbit-position')
      localStorage.removeItem('camera-orbit-target')

      this.#instance.position.copy(DEFAULT_POSITION)
      this.#controls.target.set(0, 0, 0)
      this.#controls.update()
    })
  }

  _hideDebug() {
    this._debug?.dispose()
  }
}

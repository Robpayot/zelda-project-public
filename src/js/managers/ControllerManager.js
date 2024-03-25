import { Vector2 } from 'three'
import { isTouch } from '../utils/isTouch'
import { gsap } from 'gsap'
import { clamp, degToRad, lerp, radToDeg, randInt } from 'three/src/math/MathUtils'
import ModeManager from './ModeManager'
import GameManager from './GameManager'
import {
  CAMERA_FOLLOW,
  DARK_LINK,
  EVENT_HIT,
  EXPLORE_MESSAGE,
  HOOK_PUT_AWAY,
  MODE,
  START_TOUCH,
  TOOGLE_HOOK,
} from '../utils/constants'
import { EventBusSingleton } from 'light-event-bus'
import { getDistance } from '../utils/math'
import SoundManager, { SOUNDS_CONST } from './SoundManager'
import { throttle } from '../utils/throttle'
import { BOAT_MODE } from '../components/Boat'
import UIManager from './UIManager'
import CinematicManager from './CinematicManager'
import { GLOBALS } from '../utils/globals'

export const MAX_VELOCITY = 0.025
export const MAX_VELOCITY_CRANE = 0.01
export const MAX_VELOCITY_GAME = 0.03 // 0.03

const GRAVITY = 0.6
const GRAVITY_GAME = 1

class ControllerManager {
  #mouse = new Vector2(0, 0)
  #joystick = new Vector2(0, 0)
  #boat = {
    dir: new Vector2(0, 0),
    angleDir: 0,
    velocity: 0,
    velocityP: 0, // percent
    turnForce: 0,
    up: 0,
    speedTextureOffset: 42,
  }
  #isTouch
  #width
  #height
  #deltaAngle = 0
  #lerpTurn = 0.05
  #targetUp = 0
  #up = 0
  #touchStart = { x: 0, y: 0 }
  #doubleJump = false
  #boatMode = BOAT_MODE.SAIL
  maxBoatSpeed = 1

  constructor() {
    this._handleResize()

    // window.addEventListener('mousemove', this._handleMousemove)
    window.addEventListener('resize', this._handleResize)
    window.addEventListener('keydown', this._handleKeydown)
    window.addEventListener('keyup', this._handleKeyup)
    EventBusSingleton.subscribe(EVENT_HIT, this._eventHit)

    this._initKonami()

    this.throttleTurn = throttle(this._turnBoatSound, 3500)

    // Touch joystick
    if (this.#isTouch) {
      this.stickEl = document.querySelector('[data-joystick-stick]')
      this.joystickEl = document.querySelector('[data-joystick]')
      this.jumpBtnEl = document.querySelector('[data-jump-button]')
      this.putAwayBtnEl = document.querySelector('[data-put-away-button]')
      this.joystickElLeft = document.querySelector('[data-joystick-left]')
      this.joystickElRight = document.querySelector('[data-joystick-right]')

      this.stickElRect = this.stickEl.getBoundingClientRect()

      this.stickEl.addEventListener('touchstart', this._stickTouchStart, { passive: true })
      this.stickEl.addEventListener('touchmove', this._stickTouchMove, { passive: true })
      document.body.addEventListener('touchend', this._stickTouchEnd, { passive: true })

      this.jumpBtnEl.addEventListener('touchstart', this._clickJumpButton, { passive: true })
      this.putAwayBtnEl.addEventListener('touchstart', this._clickPutAwayButton, { passive: true })
      this.joystickElLeft.addEventListener('touchstart', this._stickLeft, { passive: true })
      this.joystickElRight.addEventListener('touchstart', this._stickRight, { passive: true })
      this.joystickElLeft.addEventListener('touchend', this._stickLeftEnd, { passive: true })
      this.joystickElRight.addEventListener('touchend', this._stickRightEnd, { passive: true })

      this.joystickEl.classList.add('is-visible')
      this.jumpBtnEl.parentNode.classList.add('is-visible')
    }
  }

  get mouse() {
    return this.#mouse
  }

  get joystick() {
    return this.#joystick
  }

  get boat() {
    return this.#boat
  }

  get deltaAngle() {
    return this.#deltaAngle
  }

  get boatMode() {
    return this.#boatMode
  }

  _initKonami() {
    const pattern = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'b',
      'a',
    ]
    let current = 0

    const keyHandler = (event) => {
      // If the key isn't in the pattern, or isn't the current key in the pattern, reset
      if (pattern.indexOf(event.key) < 0 || event.key !== pattern[current]) {
        current = 0
        return
      }

      // Update how much of the pattern is complete
      current++

      // If complete, alert and reset
      if (pattern.length === current) {
        current = 0
        if (ModeManager.state === MODE.DEFAULT || ModeManager.state === MODE.EXPLORE) {
          EventBusSingleton.publish(DARK_LINK)
          console.log(
            '%cDark Link unlocked',
            "color: black; font-family: 'Roboto'; font-size: 36px; text-shadow: 0 0 5px rgb(255 255 255 / 0.7)"
          )
        } else {
          this.#doubleJump = true
          console.log(
            '%cDouble Jump unlocked',
            "color: white; font-family: 'Roboto'; font-size: 36px; text-shadow: 0 0 5px rgb(0 0 0 / 0.7);"
          )
        }
      }
    }

    document.addEventListener('keydown', keyHandler, false)
  }

  _stickTouchStart = (e) => {
    if (CinematicManager.isPlaying) return
    this._handleResize()
    this.canStickTouch = true
    if (ModeManager.state === MODE.EXPLORE) {
      EventBusSingleton.publish(START_TOUCH, this.#deltaAngle)
    }
  }

  _stickTouchMove = (e) => {
    if (!this.canStickTouch || this.stopped || CinematicManager.isPlaying) return
    const x = e.touches[0].pageX - this.stickElRect.left - this.stickEl.offsetWidth / 2
    const y = e.touches[0].pageY - this.stickElRect.top - this.stickEl.offsetWidth / 2

    let dist = getDistance(0, 0, x, y)

    // calculate angle rotation
    const rota = Math.atan2(0 - x, 0 - y)

    if (ModeManager.state === MODE.EXPLORE) {
      this.#joystick.x = -clamp(radToDeg(rota), -90, 90) / 90
      this.throttleTurn()
    } else {
      this.#joystick.x = -clamp(radToDeg(rota), -40, 40) / 40
      this.throttleTurn()
    }

    dist = Math.min(this.joystickEl.offsetWidth / 2, dist)

    const getX = dist * Math.cos(-rota - Math.PI / 2)
    const getY = dist * Math.sin(-rota - Math.PI / 2)

    this.stickEl.style.transform = `translate(${getX}px, ${getY}px)`
    this.stickX = getX
    this.stickY = getY

    if (dist > this.joystickEl.offsetWidth / 4) {
      this.#joystick.y = 1
    } else {
      this.#joystick.y = 0
    }
  }

  _stickTouchEnd = (e) => {
    if (e.touches.length > 1 || this.jumped === true || CinematicManager.isPlaying) return // if touching elsewhere

    if (this.#boatMode === BOAT_MODE.HOOK && this.putAway) {
      // if put away hook
      this.putAway = false
      EventBusSingleton.publish(HOOK_PUT_AWAY, false)
      return
    }
    this.#joystick.y = 0
    this.#joystick.x = 0

    if (this.stickX !== null && this.stickX !== undefined) {
      gsap.to(this, {
        stickX: 0,
        stickY: 0,
        duration: 0.3,
        onUpdate: () => {
          this.stickEl.style.transform = `translate(${this.stickX}px, ${this.stickY}px)`
        },
        onComplete: () => {
          this.canStickTouch = false
        },
      })
    }
  }

  _stickLeft = () => {
    if (CinematicManager.isPlaying) return
    this.#joystick.x = -1
    this.throttleTurn()
  }

  _stickRight = () => {
    if (CinematicManager.isPlaying) return
    this.#joystick.x = 1
    this.throttleTurn()
  }

  _stickLeftEnd = () => {
    if (CinematicManager.isPlaying) return
    this.#joystick.x = 0
  }

  _stickRightEnd = () => {
    if (CinematicManager.isPlaying) return
    this.#joystick.x = 0
  }

  _clickJumpButton = () => {
    if (CinematicManager.isPlaying) return
    if (this.#up === 0) {
      if (this.#boat.velocityP > 0.5) {
        this.#targetUp = 35
      } else {
        this.#targetUp = 15
      }
      this.jumped = true

      setTimeout(() => {
        this.jumped = false
      }, 1000)
    }
  }

  _clickPutAwayButton = () => {
    if (CinematicManager.isPlaying) return
    if (this.#boatMode === BOAT_MODE.HOOK) {
      this.putAway = true
      EventBusSingleton.publish(HOOK_PUT_AWAY, true)
      return
    }
  }

  _handleMousemove = (e) => {
    if (CinematicManager.isPlaying) return
    let eventX = this.#isTouch ? e.touches[0].pageX : e.clientX
    let eventY = this.#isTouch ? e.touches[0].pageY : e.clientY
    const x = eventX / this.#width
    const y = 1 - eventY / this.#height

    this.#mouse.x = gsap.utils.clamp(0, 1, x)
    this.#mouse.y = gsap.utils.clamp(0, 1, y)
  }

  _handleKeydown = (e) => {
    if (this.putAway || CinematicManager.isPlaying) return
    switch (e.keyCode) {
      case 37:
      case 65: // a
      case 81: // q
        // left
        this.#joystick.x = -1
        this.throttleTurn()
        break
      case 38:
      case 87: // w
      case 90: // z
        // up
        this.#joystick.y = 1
        break
      case 39:
      case 68: // d
        // right
        this.#joystick.x = 1
        this.throttleTurn()
        break
      case 40:
      case 83: // s
        // down
        this.#joystick.y = -1
        break
      case 32:
        // spacebar
        if (this.#boatMode === BOAT_MODE.HOOK) {
          this.putAway = true
          EventBusSingleton.publish(HOOK_PUT_AWAY, true)
          return
        }
        if (this.#doubleJump) {
          if (!this.jumpOnce) {
            if (this.#up === 0) {
              this.jumpOnce = true
              this.jumpTwice = false
              if (this.#boat.velocityP > 0.5) {
                this.#targetUp = 35
              } else {
                this.#targetUp = 15
              }
            }
          } else if (!this.jumpTwice) {
            if (this.#boat.velocityP > 0.5) {
              this.#targetUp = 35
            } else {
              this.#targetUp = 15
            }
            this.jumpTwice = true
            this.jumpOnce = false
          }
        } else {
          if (this.#up === 0) {
            if (this.#boat.velocityP > 0.5) {
              this.#targetUp = 35
            } else {
              this.#targetUp = 15
            }
          }
        }

        break
      case 69:
        // E
        UIManager.screenshotEl.classList.add('visible')
        UIManager.snap = true
        break
      case 70:
        // F
        EventBusSingleton.publish(TOOGLE_HOOK)

        break
    }
  }

  _handleKeyup = (e) => {
    if (CinematicManager.isPlaying) return
    switch (e.keyCode) {
      case 37:
      case 65:
      case 81:
      case 39:
      case 68:
        // left
        this.#joystick.x = 0
        break
      case 38:
      case 87:
      case 90:
      case 40:
      case 83:
        // up
        this.#joystick.y = 0
        break
      case 32:
        // space bar
        this.putAway = false
        if (this.#boatMode === BOAT_MODE.HOOK) {
          EventBusSingleton.publish(HOOK_PUT_AWAY, false)
          return
        }
        break
    }
  }

  _turnBoatSound = () => {
    const rd = randInt(0, 1)
    SoundManager.play(SOUNDS_CONST[`TURN_BOAT_${0}`])
  }

  _handleResize = () => {
    this.#width = window.innerWidth
    this.#height = window.innerHeight
    this.#isTouch = isTouch()
    if (this.#isTouch && this.stickEl) {
      this.stickElRect = this.stickEl.getBoundingClientRect()
    }
  }

  _eventHit = () => {
    this.hit = true

    clearTimeout(this.hitTimeout)

    this.hitTimeout = setTimeout(() => {
      this.hit = false
    }, 1000)
  }

  // Public

  startGame() {
    this.#boat.velocity = MAX_VELOCITY_GAME
  }

  update = ({ time, delta }) => {
    if (ModeManager.state === MODE.EXPLORE) {
      this._updateExplore(delta)
    } else if (ModeManager.state === MODE.GAME_STARTED) {
      this._updateGame(delta)
    }
  }

  stop() {
    this.stopped = true
  }

  allow() {
    this.stopped = false
  }

  updateBoatMode(boatMode) {
    this.#boatMode = boatMode
    clearTimeout(this.timeoutMsg)
    if (boatMode === BOAT_MODE.HOOK) {
      gsap.to(this, { maxBoatSpeed: 0.6, duration: 3 })

      if (this.#isTouch) {
        this.putAwayBtnEl.parentNode.classList.add('is-visible')
      }

      SoundManager.play(SOUNDS_CONST.OPEN)

      this.timeoutMsg = setTimeout(() => {
        EventBusSingleton.publish(EXPLORE_MESSAGE, { message: 'Use this on a glowing light!', time: 1500 })
      }, 2000)
    } else {
      SoundManager.play(SOUNDS_CONST.OPEN)
      gsap.to(this, { maxBoatSpeed: 1, duration: 0.8 })
      if (this.#isTouch) {
        this.putAwayBtnEl.parentNode.classList.remove('is-visible')
      }
    }
  }

  _updateExplore(delta) {
    const d = delta ? delta / 16 : 1
    let speed = 1.3 * this.maxBoatSpeed
    if (GLOBALS.triforce) {
      speed *= 1.5
    }
    // Jump
    this.#up = Math.max(0, lerp(this.#up, this.#targetUp, 0.05 * speed * d))
    this.#targetUp -= GRAVITY * speed * d
    this.#boat.up = this.#up

    // Turn
    if (!this.stopped) {
      if (this.#isTouch) {
        if (this.#joystick.x > 0.1) {
          this.#boat.angleDir -= 0.016 * speed * d * this.#joystick.x
        } else if (this.#joystick.x < -0.1) {
          this.#boat.angleDir -= 0.016 * speed * d * this.#joystick.x
        }

        if (this.#joystick.x !== 0) {
          EventBusSingleton.publish(CAMERA_FOLLOW, this.#deltaAngle)
        }
      } else {
        if (this.#joystick.x === 1) {
          this.#boat.angleDir -= 0.016 * speed * d
        }
        if (this.#joystick.x === -1) {
          this.#boat.angleDir += 0.016 * speed * d
        }
      }

      this.#boat.turnForce = this.#deltaAngle - this.#boat.angleDir
      this.#deltaAngle = lerp(this.#deltaAngle, this.#boat.angleDir, this.#lerpTurn * speed * d)
    }

    // console.log(this.stopped)
    let maxVelocity = MAX_VELOCITY * this.maxBoatSpeed
    maxVelocity *= speed

    if (!this.stopped) {
      // Accelerate/Decelerate
      if (this.hit) {
        this.#boat.velocity -= 0.001 * speed * d
      } else if (this.#joystick.y === 1) {
        if (!this.cantMoveY) {
          this.#boat.velocity += 0.0001 * speed * d
        }
      } else if (this.#joystick.y === -1) {
        this.#boat.velocity -= 0.0003 * speed * d
      } else {
        if (!this.cantMoveY) {
          this.#boat.velocity -= 0.00015 * speed * d
        }
      }

      this.#boat.velocity = clamp(this.#boat.velocity, 0, maxVelocity)
      this.#boat.velocityP = this.#boat.velocity / maxVelocity
    } else {
      this.#boat.velocity = -0.002 * speed

      this.#boat.velocity = clamp(this.#boat.velocity, -1, maxVelocity)
      this.#boat.velocityP = this.#boat.velocity / maxVelocity

      if (!this.cantMoveY) {
        EventBusSingleton.publish(EXPLORE_MESSAGE, { message: 'Too close!' })
        setTimeout(() => {
          this.cantMoveY = false
          this.stopped = false
        }, 500)
        this.cantMoveY = true
      }
    }
  }

  _updateGame(delta) {
    const d = delta ? delta / 16 : 1
    // Jump
    this.#up = Math.max(0, lerp(this.#up, this.#targetUp, 0.05 * GameManager.speed))
    this.#targetUp -= GRAVITY_GAME * GameManager.speed
    this.#boat.up = this.#up

    if (this.#joystick.x === 1) {
      this.#boat.angleDir -= 0.028 * GameManager.speed * d
    }
    if (this.#joystick.x === -1) {
      this.#boat.angleDir += 0.028 * GameManager.speed * d
    }

    // console.log(degToRad(GameManager.maxRota), this.#boat.angleDir)

    this.#boat.angleDir = clamp(this.#boat.angleDir, degToRad(-GameManager.maxRota), degToRad(GameManager.maxRota))
    this.#boat.turnForce = this.#deltaAngle - this.#boat.angleDir
    this.#deltaAngle = lerp(this.#deltaAngle, this.#boat.angleDir, this.#lerpTurn * GameManager.speed * d)

    // Accelerate/Decelerate
    if (this.hit) {
      this.#boat.velocity -= 0.001
    } else {
      this.#boat.velocity += 0.0003 * GameManager.speed * d
    }
    const max = MAX_VELOCITY_GAME * GameManager.speed // * d
    // console.log(max)
    this.#boat.velocity = clamp(this.#boat.velocity, 0, max)
    this.#boat.velocityP = Math.min(this.#boat.velocity / max, 1)
  }

  reset() {
    this.#mouse = new Vector2(0, 0)
    this.#joystick = new Vector2(0, 0)
    this.#boat = {
      dir: new Vector2(0, 0),
      angleDir: 0,
      velocity: 0,
      velocityP: 0, // percent
      turnForce: 0,
      up: 0,
      speedTextureOffset: 42,
    }
  }
}

export default new ControllerManager()

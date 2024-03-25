import { randInt } from 'three/src/math/MathUtils'
import GridManager from './GridManager'
import { REPEAT_OCEAN, SCALE_OCEAN } from '../components/Ocean'
import { MeshBasicMaterial, Object3D } from 'three'

import { EventBusSingleton } from 'light-event-bus'
import { getDistance } from '../utils/math'
import Rupees from '../components/Entitites/Rupees'
import Barrels from '../components/Entitites/Barrels'
import { EVENT_HIT, EVENT_SCORE, INIT_GAME, MODE, START_GAME } from '../utils/constants'
import ControllerManager from './ControllerManager'
import BarrelRupees from '../components/Entitites/BarrelRupees'

import DATA from '../data/game_levels.json'
import DATA_RUPEES from '../data/rupees_score.json'
import Ship from '../components/Entitites/Ship'
import Walls from '../components/Entitites/Walls'
import LoaderManager from './LoaderManager'
import UIManager from './UIManager'
import ModeManager from './ModeManager'
import ShipGrey from '../components/Entitites/ShipGrey'
import html2canvas from 'html2canvas'
import SoundManager, { SOUNDS_CONST } from './SoundManager'
import Settings from '../utils/Settings'
import { base64toBlob } from '../utils/base64ToBlobjs'
import gsap from 'gsap'

// Entities
// 0: Rupees
// 1: Barrels
// 2: Barrels with rupee
// 3: Grey ship
// 4: Gold ship

const NB_LINES = 10
let zIncr = 100
const NB_LINES_WALLS = 8

class GameManager {
  #life = 3
  #score = 0
  #rangeX = 1
  #rangeXMarge = 0.2
  #maxRota = 40
  #objects = [] // current visible objects
  #rupees
  #barrels
  #barrelRupees
  #shipsGrey
  #ships
  #coefOffset
  #walls
  canHit = true
  #level = 0
  #speed = 1
  lastLine = 0
  lastWallLine = 0
  objectPerLines = []
  #tower
  #parent
  constructor() {
    EventBusSingleton.subscribe(INIT_GAME, this.initGame)
    EventBusSingleton.subscribe(START_GAME, this.startGame)

    this.gameEl = document.body.querySelector('[data-game]')
    this.gameElEndScreenshot = document.body.querySelector('.game__end__screenshot')
    this.gameElEndScore = document.body.querySelector('[data-game-end-score]')
    this.gameElEndBest = document.body.querySelector('[data-game-end-best]')
    this.gameElEndBest = document.body.querySelector('[data-game-end-best]')
    this.gameElShareX = document.body.querySelector('[data-game-end-share-x]')
    this.gameElShareFb = document.body.querySelector('[data-game-end-share-fb]')
    this.gameElRetry = document.body.querySelector('[data-game-end-retry]')
    this.gameElEndImage = document.body.querySelector('[data-game-end-img]')
    this.gameElEndDl = document.body.querySelector('[data-game-end-dl]')
    this.rupeeListEl = document.body.querySelector('[data-hud-rupee-list]')
    this.rupeeListElRows = document.body.querySelectorAll('.hud__rupee-list__row')

    this.gameElRetry.addEventListener('click', this.startGame)
    this.gameElShareX.addEventListener('click', this._shareX)
    this.gameElEndDl.addEventListener('click', this._dlScreenshot)
    this.gameElShareFb.addEventListener('click', this._shareFb)

    if (!Settings.touch) {
      this.gameElRetry.addEventListener('mouseenter', this._hoverSound)
      this.gameElShareX.addEventListener('mouseenter', this._hoverSound)
      this.gameElEndDl.addEventListener('mouseenter', this._hoverSound)
      this.gameElShareFb.addEventListener('mouseenter', this._hoverSound)
    }

    this.createRupeeList()
  }

  get life() {
    return this.#life
  }

  get score() {
    return this.#score
  }

  get rangeX() {
    return this.#rangeX
  }

  get maxRota() {
    return this.#maxRota
  }

  get objects() {
    return this.#objects
  }

  get speed() {
    return this.#speed
  }

  createRupeeList() {
    // this.rupeeListEl

    this.rupeeListElRows.forEach((el, index) => {
      let number = DATA_RUPEES[index]
      const str = number.toString() // convert to array
      const arr = str.split('')
      for (let i = 0; i < arr.length; i++) {
        const span = document.createElement('span')
        span.classList.add('rupees__number')
        span.classList.add(`i${arr[i]}`)

        el.appendChild(span)
      }
    })
  }

  init(scene) {
    this.#parent = new Object3D()
    scene.add(this.#parent)

    this.#coefOffset = SCALE_OCEAN / REPEAT_OCEAN

    this._createWalls()
    this.#rupees = this._createRupees()
    this.#barrels = this._createBarrels()
    this.#barrelRupees = this._createBarrelRupees()
    this.#shipsGrey = this._createShipsGrey()
    this.#ships = this._createShips()
    this._initObjects()
    this.#tower = this._createTower()

    this.#parent.visible = false
  }

  initGame = () => {
    GridManager.reset()
    ControllerManager.reset()
    this.#parent.visible = true
  }

  startGame = () => {
    this.paused = false
    if (this.lastBlobUrl) {
      URL.revokeObjectURL(this.lastBlobUrl)
    }
    this.#life = 3
    UIManager.reset()
    this.#score = 0
    this.gameEl.classList.remove('end')
    let time = this.startOnce ? 500 : 0
    clearTimeout(this.timeoutStart)
    this.timeoutStart = setTimeout(() => {
      ControllerManager.startGame()
      ModeManager.set(MODE.GAME_STARTED)

      // prevent double event listened
      if (this.subHit && typeof this.subHit.unsubscribe === 'function') {
        this.subHit = null
      }
      if (this.subScore && typeof this.subScore.unsubscribe === 'function') {
        this.subScore = null
      }

      this.subHit = EventBusSingleton.subscribe(EVENT_HIT, this.eventHit)
      this.subScore = EventBusSingleton.subscribe(EVENT_SCORE, this.eventScore)
    }, time)

    this.startOnce = true

    SoundManager.play(SOUNDS_CONST.CLOSE)
  }

  resetGame = (fullReset) => {
    if (!fullReset) {
      this.gameEl.classList.add('end')
      ModeManager.set(MODE.GAME)
    }

    this.paused = false

    this.gameElEndScore.innerHTML = this.score

    if (parseInt(this.gameElEndBest.innerHTML) < this.score) {
      window.localStorage.setItem('best', this.score)
      this.gameElEndBest.innerHTML = this.score
    } else {
      const best = window.localStorage.getItem('best')

      if (best) {
        this.gameElEndBest.innerHTML = best
      }
    }

    if (!fullReset) {
      this.setSnap()
    }

    setTimeout(() => {
      this.subHit?.unsubscribe()
      this.subScore?.unsubscribe()
    }, 300)

    if (fullReset) {
      this.#parent.visible = false
    }
    this.#level = 0
    GridManager.reset()
    ControllerManager.reset()

    this.#objects.forEach((object) => {
      object.canVisible = false
      object.visible = false
      object.collision = true
      switch (object.name) {
        case 'rupee':
          this.#rupees.free(object)
          break
        case 'barrel':
          this.#barrels.free(object)
          break
        case 'barrelRupee':
          this.#barrelRupees.free(object)
          break
        case 'ship_grey':
          this.#shipsGrey.free(object)
          break
        case 'ship':
          this.#ships.free(object)
          break
      }
    })
    this.#objects = []

    this.lastLine = this.lastWallLine = 0
    this.objectPerLines = []
    this._initObjects()

    // TODO: reset walls

    this.#walls.availLeft.forEach((wall, i) => {
      // reset pos
      wall.position.z = -i * this.#walls.resetZ
      wall.initPos.z = wall.position.z
    })

    this.#walls.availRight.forEach((wall, i) => {
      // reset pos
      wall.position.z = -i * this.#walls.resetZ
      wall.initPos.z = wall.position.z
    })
  }

  pause = () => {
    this.paused = true
  }

  unpause = () => {
    this.paused = false
  }

  _hoverSound = () => {
    SoundManager.play(SOUNDS_CONST.HOVER)
  }

  _dlScreenshot = () => {
    const blob = base64toBlob(this.gameElEndImage.src)
    const blobUrl = URL.createObjectURL(blob)

    this.gameElEndDl.href = blobUrl
    this.lastBlobUrl = blobUrl
    SoundManager.play(SOUNDS_CONST.SMALL_CLICK)
  }

  capture() {
    html2canvas(this.gameElEndScreenshot).then((canvas) => {
      // Convert the captured content to a data URL
      let screenshotDataUrl = canvas.toDataURL('image/png')

      // Create an image element to display the screenshot
      this.gameElEndImage.src = screenshotDataUrl
    })
  }

  setSnap() {
    setTimeout(() => {
      this.snap = true
      this.capture()
    }, 1100)
  }

  _createWalls() {
    this.#walls = new Walls(this.#parent, this.rangeX + 0.3)
    const wallObject = new Object3D()

    for (let i = 0; i < NB_LINES_WALLS; i++) {
      const wall = this.#walls.add(i, -1)
      wallObject.add(wall)
    }

    for (let i = 0; i < NB_LINES_WALLS; i++) {
      const wall = this.#walls.add(i, 1)
      wallObject.add(wall)
    }

    this.#parent.add(wallObject)

    this.wallObject = wallObject
  }

  _createRupees() {
    const rupees = new Rupees(this.#parent)

    for (let i = 0; i < NB_LINES + 1; i++) {
      const rupeeMesh = rupees.add(this.#rangeX - this.#rangeXMarge, zIncr)
      this.#parent.add(rupeeMesh)
    }

    return rupees
  }

  _createBarrels() {
    const barrels = new Barrels(this.#parent)

    for (let i = 0; i < NB_LINES + 1; i++) {
      const barrelMesh = barrels.add(this.#rangeX, this.#rangeXMarge, zIncr)
      this.#parent.add(barrelMesh)
    }

    return barrels
  }

  _createBarrelRupees() {
    const barrelRupees = new BarrelRupees(this.#parent, this.#rupees, this.#barrels)

    for (let i = 0; i < NB_LINES + 1; i++) {
      const barrelMesh = barrelRupees.add(this.#rangeX, zIncr)
      this.#parent.add(barrelMesh)
    }

    return barrelRupees
  }

  _createShips() {
    const ships = new Ship(this.#parent)

    for (let i = 0; i < NB_LINES + 1; i++) {
      const shipMesh = ships.add(this.#rangeX, this.#rangeXMarge, zIncr)
      this.#parent.add(shipMesh)
    }

    return ships
  }

  _createShipsGrey() {
    const ships = new ShipGrey(this.#parent, MODE.GAME)

    for (let i = 0; i < NB_LINES + 1; i++) {
      const shipMesh = ships.add(this.#rangeX, this.#rangeXMarge, zIncr)
      this.#parent.add(shipMesh)
    }

    return ships
  }

  _createTower() {
    const gltf = LoaderManager.get('tower').gltf
    const towerMesh = gltf.scene.getObjectByName('mesh-0').clone()
    const s = 30
    towerMesh.scale.set(s, s, s)

    towerMesh.material = new MeshBasicMaterial({ color: 'black' })

    towerMesh.position.z = -SCALE_OCEAN / 2 + 50

    this.#parent.add(towerMesh)

    return towerMesh
  }

  _initObjects() {
    const { types, nbPerLine } = DATA[this.#level]

    // remove duplicates
    const possibleTypes = types.filter((item, index) => types.indexOf(item) === index)

    for (let i = 0; i < NB_LINES; i++) {
      let type = types[randInt(0, types.length - 1)]
      if (i === 0) {
        type = 0
      }
      const mesh = this._addAvailMesh({ type, i })
      const oldSlotX = mesh.slotX

      if (nbPerLine >= 2) {
        // get other possible types
        const index = possibleTypes.indexOf(type)
        let otherTypesArr = [...possibleTypes]
        otherTypesArr.splice(index, 1)

        const otherType = otherTypesArr[randInt(0, otherTypesArr.length - 1)]

        // get other possible slotX
        const arrSlotX = ['0', '1', '2']
        const indexSlotX = arrSlotX.indexOf(oldSlotX.toString())
        arrSlotX.splice(indexSlotX, 1)

        const slotX = arrSlotX[randInt(0, arrSlotX.length - 1)]

        this._addAvailMesh({ type: otherType, i, slotX })

        if (nbPerLine >= 3) {
          // get other possible types
          const indexO = otherTypesArr.indexOf(otherType)
          let otherTypesArrO = [...otherTypesArr]
          otherTypesArrO.splice(indexO, 1)

          const otherTypeO = otherTypesArrO[randInt(0, otherTypesArrO.length - 1)]

          // get other possible slotX
          const indexSlotXO = arrSlotX.indexOf(slotX.toString())
          arrSlotX.splice(indexSlotXO, 1)

          const slotXO = arrSlotX[randInt(0, arrSlotX.length - 1)]

          this._addAvailMesh({ type: otherTypeO, i, slotX: slotXO })
        }
      }

      this.objectPerLines.push(nbPerLine)
    }
  }

  _addAvailMesh({ type, i, z, slotX }) {
    const { rupeesMat } = DATA[this.#level]

    let mesh
    switch (type) {
      case 0:
        mesh = this.#rupees.getAvail({ i, z, slotX, mat: rupeesMat[randInt(0, rupeesMat.length - 1)] })
        break
      case 1:
        mesh = this.#barrels.getAvail({ i, z, slotX })
        break
      case 2:
        mesh = this.#barrelRupees.getAvail({ i, z, slotX, mat: rupeesMat[randInt(0, rupeesMat.length - 1)] })
        // clear rupee scored state
        mesh.rupeeScored = false
        mesh.children[0].visible = true
        break
      case 3:
        mesh = this.#shipsGrey.getAvail({ i, z, slotX })
        break
      case 4:
        mesh = this.#ships.getAvail({ i, z, slotX })
        break
    }

    if (mesh) {
      mesh.collision = false

      const initScale = mesh.scale.x
      const obj = { value: 0 }

      const tl = gsap.timeline()
      tl.add(() => {
        mesh.canVisible = true
        mesh.visible = true
      }, 0.2)
      tl.to(obj, {
        value: initScale,
        duration: 1,
        onUpdate: () => {
          const s = obj.value
          mesh.scale.set(s, s, s)
        },
      })
      this.#objects.push(mesh)
    }

    return mesh
  }
  // Add new line of objects
  _resetLine() {
    this.#speed = DATA[this.#level].speed
    const nbLine = this.objectPerLines[0]

    this.objectPerLines.shift()

    // reset old objects
    const lastLineObjects = this.#objects.slice(0, nbLine)

    lastLineObjects.forEach((object) => {
      object.visible = false
      object.canVisible = false
      object.collision = true
      switch (object.name) {
        case 'rupee':
          this.#rupees.free(object)
          break
        case 'barrel':
          this.#barrels.free(object)
          break
        case 'barrelRupee':
          this.#barrelRupees.free(object)
          break
        case 'ship':
          this.#ships.free(object)
          break
        case 'ship_grey':
          this.#shipsGrey.free(object)
          break
      }
      this.#objects.splice(0, 1)
    })

    // add new line of objects
    const { types, nbPerLine } = DATA[this.#level]

    this.objectPerLines.push(nbPerLine)

    // remove duplicates
    const possibleTypes = types.filter((item, index) => types.indexOf(item) === index)

    // add new at the end
    const type = types[randInt(0, types.length - 1)]
    const z = -NB_LINES * zIncr - GridManager.offsetUV.y * this.#coefOffset + zIncr
    const newMesh = this._addAvailMesh({ type, z })

    const oldSlotX = newMesh.slotX

    if (nbPerLine >= 2) {
      // get other possible types
      const index = possibleTypes.indexOf(type)
      let otherTypesArr = [...possibleTypes]
      otherTypesArr.splice(index, 1)

      const otherType = otherTypesArr[randInt(0, otherTypesArr.length - 1)]

      // get other possible slotX
      const arrSlotX = ['0', '1', '2']
      const indexSlotX = arrSlotX.indexOf(oldSlotX.toString())
      arrSlotX.splice(indexSlotX, 1)

      const slotX = arrSlotX[randInt(0, arrSlotX.length - 1)]

      this._addAvailMesh({ type: otherType, z, slotX })

      if (nbPerLine >= 3) {
        // get other possible types
        const indexO = otherTypesArr.indexOf(otherType)
        let otherTypesArrO = [...otherTypesArr]
        otherTypesArrO.splice(indexO, 1)

        const otherTypeO = otherTypesArrO[randInt(0, otherTypesArrO.length - 1)]

        // get other possible slotX
        const indexSlotXO = arrSlotX.indexOf(slotX.toString())
        arrSlotX.splice(indexSlotXO, 1)

        const slotXO = arrSlotX[randInt(0, arrSlotX.length - 1)]

        this._addAvailMesh({ type: otherTypeO, z, slotX: slotXO })
      }
    }
  }

  _collision(object, dist, i) {
    if (object.collision) return
    switch (object.name) {
      case 'rupee':
        EventBusSingleton.publish(EVENT_SCORE, object.score)
        // to fix remove from shadowMap in WebGLApp
        object.canVisible = false
        object.visible = false

        object.collision = true

        break
      case 'barrel':
        // 0 --> 18 --> 14 with margin
        // 0 --> object.hitbox
        // if up > 14 and dist === 0 bon
        if (object.hitbox - dist > ControllerManager.boat.up * 1.3) {
          if (!this.justHit) {
            EventBusSingleton.publish(EVENT_HIT)
            object.canVisible = false
            object.visible = false
          }

          object.collision = true
        }
        break
      case 'barrelRupee':
        if (object.hitbox - dist > ControllerManager.boat.up * 1.3) {
          if (!this.justHit) {
            EventBusSingleton.publish(EVENT_HIT)
            object.canVisible = false
            object.visible = false
          }

          object.collision = true
        } else {
          if (!object.rupeeScored) {
            EventBusSingleton.publish(EVENT_SCORE, object.score)
            object.rupeeScored = true
            object.children[0].visible = false
          }
        }

        break
      case 'ship':
      case 'ship_grey':
        if (!this.justHit) {
          EventBusSingleton.publish(EVENT_HIT)
          object.canVisible = false
          object.visible = false
        }

        object.collision = true
        break
    }
  }

  _shareX = () => {
    SoundManager.play(SOUNDS_CONST.SMALL_CLICK)
    // Encode the text you want to pre-fill in the tweet
    const textToTweet = encodeURIComponent(
      `I just scored ${this.#score} in the Rupee's game :) ${window.location.href} #WindWakerJS #threejs`
    )

    // Create the Twitter Web Intent URL
    const twitterIntentUrl = `https://x.com/intent/tweet?text=${textToTweet}`

    // Open a new window or tab with the Twitter Web Intent
    // Open a new small pop-up window for the Twitter Web Intent
    const width = Math.min(window.innerWidth * 0.5, 700)
    const height = Math.min(window.innerHeight * 0.5, 500)
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2
    const options = `width=${width},height=${height},left=${left},top=${top}`

    window.open(twitterIntentUrl, 'Twitter Share', options)
  }

  _shareFb = () => {
    SoundManager.play(SOUNDS_CONST.SMALL_CLICK)
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`

    const width = Math.min(window.innerWidth * 0.5, 700)
    const height = Math.min(window.innerHeight * 0.5, 500)
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2

    const options = `width=${width},height=${height},left=${left},top=${top}`

    window.open(facebookShareUrl, 'sharer', options)
  }

  // EVENTS

  eventHit = () => {
    if (this.justHit) return
    this.justHit = true

    SoundManager.play(SOUNDS_CONST.HURT)

    setTimeout(() => {
      this.justHit = false
    }, 2000)
    // console.log('hit', val)
    this.#life -= 1
    UIManager.updateHearts(MODE.GAME)

    if (this.#life === 0) {
      this.resetGame()
    }
  }

  eventScore = (val) => {
    this.#score += val
    UIManager.updateScores(MODE.GAME)
    if (val > 100) {
      SoundManager.play(SOUNDS_CONST.RUPEE_3)
    } else if (val >= 50) {
      SoundManager.play(SOUNDS_CONST.RUPEE_2)
    } else if (val >= 10) {
      SoundManager.play(SOUNDS_CONST.RUPEE_1)
    } else {
      SoundManager.play(SOUNDS_CONST.RUPEE_0)
    }
  }

  /**
   * Update
   */
  update({ time, delta }) {
    if (this.paused) return
    // GAME
    // console.log(GridManager.offsetUV)

    // if (this.#life <= 0) return

    const playerX = GridManager.offsetUV.x * this.#coefOffset
    const playerZ = GridManager.offsetUV.y * this.#coefOffset

    for (let i = 0; i < this.#objects.length; i++) {
      const object = this.#objects[i]
      object.position.x = object.initPos.x - playerX
      object.position.z = object.initPos.z + playerZ

      if (object.name === 'rupee') {
        object.rotation.y += (delta / 16) * 0.02
      } else if (object.name === 'barrelRupee') {
        object.children[0].rotation.y += (delta / 16) * 0.02
      }

      if (object.position.z > -100) {
        // check distance
        const dist = getDistance(0, 0, object.position.z, object.position.x)
        if (dist < object.hitbox) {
          this._collision(object, dist, i)
        }
      }
    }

    const newLine = Math.ceil(playerZ / zIncr)
    if (this.lastLine < newLine && this.lastLine > 1) {
      this._resetLine()
    }
    this.lastLine = newLine

    this.#level = Math.ceil(playerZ / (zIncr * NB_LINES))

    this.#level = Math.min(this.#level, DATA.length - 1)

    // update walls pos X
    for (let i = 0; i < this.#walls.availLeft.length; i++) {
      const wall = this.#walls.availLeft[i]
      wall.position.x = wall.initPos.x - playerX
      wall.position.z = wall.initPos.z + playerZ
    }

    for (let i = 0; i < this.#walls.availRight.length; i++) {
      const wall = this.#walls.availRight[i]
      wall.position.x = wall.initPos.x - playerX
      wall.position.z = wall.initPos.z + playerZ
    }

    const newWallLine = Math.ceil(playerZ / this.#walls.resetZ)
    if (this.lastWallLine < newWallLine && this.lastWallLine > 1) {
      const z =
        -NB_LINES_WALLS * this.#walls.resetZ - GridManager.offsetUV.y * this.#coefOffset + this.#walls.resetZ * 2
      this.#walls.reset(z, -1)
      this.#walls.reset(z, 1)
    }
    this.lastWallLine = newWallLine

    // tower
    this.#tower.position.x = -playerX
  }
}

export default new GameManager()

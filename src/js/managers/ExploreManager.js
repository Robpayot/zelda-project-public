import { Color, Object3D, Vector2 } from 'three'
import Winds from '../components/Entitites/Winds'
import { EventBusSingleton } from 'light-event-bus'
import { EVENT_HIT, EVENT_SCORE, MODE, START_EXPLORE } from '../utils/constants'
import Waves from '../components/Entitites/Waves'
import { sortPoints } from '../utils/three'
import { REPEAT_OCEAN, SCALE_OCEAN } from '../components/Ocean'
import GridManager from './GridManager'
import EnvManager from './EnvManager'
import Stars from '../components/Entitites/Stars'
import Rupees from '../components/Entitites/Rupees'
import { getDistance } from '../utils/math'
import Barrels from '../components/Entitites/Barrels'
import { clamp, degToRad, randFloat, randInt } from 'three/src/math/MathUtils'
import ControllerManager from './ControllerManager'
import UIManager from './UIManager'
import BarrelRupees from '../components/Entitites/BarrelRupees'
import Mirador from '../components/Entitites/Mirador'
import ShipGrey from '../components/Entitites/ShipGrey'
import DATA from '../data/explore_levels.json'
import Islands from '../components/Islands'
import Settings from '../utils/Settings'
import SoundManager, { SOUNDS_CONST } from './SoundManager'

// Entities
// 0: Rupees
// 1: Barrels
// 2: Barrels with rupee
// 3: Mirador
// 4: Grey ship

const NB_ENTITIES = 30
const NB_WINDS = 3
class ExploreManager {
  #winds
  #parent
  #waves
  #coefOffset
  #stars
  // entities
  #entities = []
  #entityRange = 1400
  #entityRangeMin = 1300
  #rupees
  #barrels
  #barrelRupees
  #life = 3
  #score = 0
  #miradors
  #shipsGrey
  #level = 0
  #islands
  constructor() {
    EventBusSingleton.subscribe(START_EXPLORE, this.start)

    this.islandsEl = document.querySelector('[data-explore-islands]')
    this.tooCloseEl = document.querySelector('[data-explore-to-close]')
  }

  get life() {
    return this.#life
  }

  get score() {
    return this.#score
  }

  init(scene, camera) {
    this.camera = camera
    this.#parent = new Object3D()
    scene.add(this.#parent)

    // environement
    this.#winds = []

    for (let i = 0; i < NB_WINDS; i++) {
      const wind = new Winds(i)
      this.#parent.add(wind.mesh)
      this.#winds.push(wind)
    }

    this.#waves = new Waves()
    this.#parent.add(this.#waves.mesh)

    this.#stars = new Stars()
    this.#parent.add(this.#stars.mesh)

    this.#coefOffset = SCALE_OCEAN / REPEAT_OCEAN

    // entities
    this.#rupees = this._createRupees()
    this.#barrels = this._createBarrels()
    this.#barrelRupees = this._createBarrelRupees()
    this.#miradors = this._createMirador()
    this.#shipsGrey = this._createShipsGrey()
    // Rooms
    this.#islands = this._createIslandsDetail()

    this.islandDist = 1470 * this.#islands.farRadius
    this.showDetailIsland = 0.4

    this._initEntities()

    this.#parent.visible = false
  }

  start = () => {
    this.#parent.visible = true

    for (let i = 0; i < NB_WINDS; i++) {
      setTimeout(() => {
        this.#winds[i].anim()
      }, 1000 * i)
    }

    this.subHit = EventBusSingleton.subscribe(EVENT_HIT, this.eventHit)
    this.subScore = EventBusSingleton.subscribe(EVENT_SCORE, this.eventScore)
  }

  reset(fromMode) {
    this.subHit?.unsubscribe()
    this.subScore?.unsubscribe()
    this.#parent.visible = false
    for (let i = 0; i < NB_WINDS; i++) {
      this.#winds[i].kill()
    }

    if (!fromMode) {
      GridManager.reset()
      ControllerManager.reset()
      this.#level = 0

      this.#entities.forEach((object) => {
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
          case 'mirador':
            this.#miradors.free(object)
            break
          case 'ship_grey':
            this.#shipsGrey.free(object)
            break
        }
      })
      this.#entities = []

      setTimeout(() => {
        this._initEntities()

        this.#life = 3
        UIManager.reset(MODE.EXPLORE)
        this.#score = 0
      }, 300)
    }
  }

  _createRupees() {
    const rupees = new Rupees(this.#parent, MODE.EXPLORE)

    for (let i = 0; i < 10; i++) {
      const mesh = rupees.add(0, 0)
      this.#parent.add(mesh)
    }

    return rupees
  }

  _createBarrels() {
    const barrels = new Barrels(this.#parent, MODE.EXPLORE)

    for (let i = 0; i < 10; i++) {
      const mesh = barrels.add(0, 0)
      this.#parent.add(mesh)
    }

    return barrels
  }

  _createBarrelRupees() {
    const barrelRupees = new BarrelRupees(this.#parent, this.#rupees, this.#barrels, MODE.EXPLORE)

    for (let i = 0; i < 10; i++) {
      const mesh = barrelRupees.add(0, 0)
      this.#parent.add(mesh)
    }

    return barrelRupees
  }

  _createMirador() {
    const miradors = new Mirador(this.#parent, MODE.EXPLORE)

    for (let i = 0; i < 3; i++) {
      const mesh = miradors.add(0, 0)
      this.#parent.add(mesh)
    }

    return miradors
  }

  _createShipsGrey() {
    const ships = new ShipGrey(this.#parent, MODE.EXPLORE)

    for (let i = 0; i < 10; i++) {
      const mesh = ships.add(0, 0)
      this.#parent.add(mesh)
    }

    return ships
  }

  _createIslandsDetail() {
    const islands = new Islands(this.#parent)
    return islands
  }

  _initEntities() {
    for (let i = 0; i < NB_ENTITIES; i++) {
      this._addEntity()
    }
  }

  _freeEntity(object, i) {
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
      case 'mirador':
        this.#miradors.free(object)
        break
      case 'ship_grey':
        this.#shipsGrey.free(object)
        break
    }

    this.#entities.splice(i, 1) // remove from entities

    setTimeout(() => {
      this._addEntity(true)
    }, 0)
  }

  _addEntity(addInFront) {
    const playerX = GridManager.offsetUV.x * this.#coefOffset
    const playerZ = GridManager.offsetUV.y * this.#coefOffset

    const { types, rupeesMat } = DATA[Math.ceil(this.#level)]

    const type = types[randInt(0, types.length - 1)]

    let mesh

    // get random coordinate from min distance entityRange radius

    let angle = Math.random() * 2 * Math.PI // Random angle in radians
    if (addInFront) {
      const playerDir = -ControllerManager.boat.angleDir + degToRad(-90)
      const marginAngle = degToRad(90)
      angle = randFloat(playerDir - marginAngle, playerDir + marginAngle)
    }
    let radius = Math.random() * (this.#entityRange - this.#entityRangeMin) + this.#entityRangeMin // Random radius within the specified range
    // radius = this.#entityRangeMin
    // Calculate the coordinates
    let x = radius * Math.cos(angle)
    let y = radius * Math.sin(angle)

    let gridPos = new Vector2(playerX + x, -playerZ + y)

    for (let i = 0; i < this.#islands.islands.length; i++) {
      const { island } = this.#islands.islands[i]

      if (island) {
        const dist = getDistance(gridPos.y, gridPos.x, -island.initPos.z, -island.initPos.x)

        if (dist / this.islandDist < this.showDetailIsland) {
          // put in behind link (not too far)

          // console.log('trop près!!!!')
          const playerDir = ControllerManager.boat.angleDir - degToRad(-90)
          const marginAngle = degToRad(45)
          angle = randFloat(playerDir - marginAngle, playerDir + marginAngle)
          let radius = randFloat(700, 900) // Random radius within the specified range
          // radius = this.#entityRangeMin
          // Calculate the coordinates
          x = radius * Math.cos(angle)
          y = radius * Math.sin(angle)

          gridPos = new Vector2(playerX + x, -playerZ + y)
        }
      }
    }

    switch (type) {
      case 0:
        mesh = this.#rupees.getAvail({ mode: MODE.EXPLORE, mat: rupeesMat[randInt(0, rupeesMat.length - 1)], gridPos })
        break
      case 1:
        mesh = this.#barrels.getAvail({ mode: MODE.EXPLORE, gridPos })
        break
      case 2:
        mesh = this.#barrelRupees.getAvail({
          mode: MODE.EXPLORE,
          mat: rupeesMat[randInt(0, rupeesMat.length - 1)],
          gridPos,
        })
        // clear rupee scored state
        if (mesh) {
          mesh.rupeeScored = false
          mesh.children[0].visible = true
        }
        break
      case 3:
        mesh = this.#miradors.getAvail({ mode: MODE.EXPLORE, gridPos })
        break
      case 4:
        mesh = this.#shipsGrey.getAvail({ mode: MODE.EXPLORE, gridPos })
        break
    }

    if (mesh) {
      mesh.canVisible = true
      mesh.visible = true
      mesh.collision = false
      this.#entities.push(mesh)
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

        this._freeEntity(object, i)

        break
      case 'barrel':
        if (object.hitbox - dist > ControllerManager.boat.up * 1.15) {
          if (!this.justHit) {
            EventBusSingleton.publish(EVENT_HIT)
            object.canVisible = false
            object.visible = false
          }

          object.collision = true
          this._freeEntity(object, i)
        }
        break
      case 'barrelRupee':
        if (object.hitbox - dist > ControllerManager.boat.up * 1.15) {
          if (!this.justHit) {
            EventBusSingleton.publish(EVENT_HIT)
            object.canVisible = false
            object.visible = false
          }

          object.collision = true
          this._freeEntity(object, i)
        } else {
          if (!object.rupeeScored) {
            EventBusSingleton.publish(EVENT_SCORE, object.score)
            object.rupeeScored = true
            object.children[0].visible = false
          }
        }
        break
      case 'mirador':
        if (!this.justHit) {
          EventBusSingleton.publish(EVENT_HIT, { object })
          object.collision = true
        }
        break
      case 'ship_grey':
        if (!this.justHit) {
          EventBusSingleton.publish(EVENT_HIT, { object })
          object.collision = true
        }
        break
    }
  }

  // EVENTS

  eventHit = ({ object } = {}) => {
    if (this.justHit) return
    this.justHit = true

    SoundManager.play(SOUNDS_CONST.HURT)

    setTimeout(() => {
      this.justHit = false
      if (object) object.collision = false
    }, 2000)
    this.#life -= 1
    UIManager.updateHearts(MODE.EXPLORE)

    if (this.#life === 0) {
      // see waht we do
      this.reset()
      setTimeout(() => {
        this.start()
      }, 300)
    }
  }

  eventScore = (val) => {
    this.#score += val
    UIManager.updateScores(MODE.EXPLORE)
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

  update({ time, delta }) {
    const playerX = GridManager.offsetUV.x * this.#coefOffset
    const playerZ = GridManager.offsetUV.y * this.#coefOffset

    this.#level += ControllerManager.boat.velocity * 0.03
    this.#level = Math.min(this.#level, DATA.length - 1)

    // waves
    if (EnvManager.settingsOcean.alphaWaves > 0) {
      sortPoints(this.#waves.mesh, this.camera)
      this.#waves.material.uniforms.uTime.value += (delta / 16) * 0.1
      this.#waves.material.uniforms.globalOpacity.value = EnvManager.settingsOcean.alphaWaves

      this.#waves.mesh.position.x = this.#waves.mesh.initPos.x - playerX
      this.#waves.mesh.position.z = this.#waves.mesh.initPos.z + playerZ
    }

    // stars
    if (EnvManager.settings.alphaStars > 0) {
      this.#stars.material.uniforms.uTime.value += (delta / 16) * 0.1
      this.#stars.material.uniforms.globalOpacity.value = EnvManager.settings.alphaStars
    }

    // Entities
    for (let i = 0; i < this.#entities.length; i++) {
      const object = this.#entities[i]
      object.position.x = object.initPos.x - playerX
      object.position.z = object.initPos.z + playerZ

      const dist = getDistance(0, 0, object.position.z, object.position.x)

      if (object.name === 'rupee') {
        object.rotation.y += (delta / 16) * 0.02
      } else if (object.name === 'barrelRupee') {
        object.children[0].rotation.y += (delta / 16) * 0.02
      } else if (object.name === 'ship_grey') {
        if (dist < object.hitboxTarget) {
          this.#shipsGrey.targetPlayer(object, playerX, playerZ)
        }
      }

      if (dist < object.hitbox) {
        this._collision(object, dist, i)
      } else if (dist > this.#entityRange + 10) {
        this._freeEntity(object, i)
      }
    }

    let stopBoat = false
    let forceYStrength = -1

    for (let i = 0; i < this.#islands.islands.length; i++) {
      const { lod, island } = this.#islands.islands[i]

      if (island) {
        const dist = getDistance(playerZ, -playerX, -island.initPos.z, -island.initPos.x)

        let s = this.#islands.LODScale - (dist / this.islandDist - this.showDetailIsland) * this.#islands.LODScale
        s = clamp(s, this.#islands.LODScale * this.showDetailIsland, this.#islands.LODScale)
        lod.scale.set(s, s, s)

        if (dist / this.islandDist < this.showDetailIsland) {
          island.visible = true
          lod.visible = false
          forceYStrength = i

          for (let y = 0; y < island.collisions.length; y++) {
            const collision = island.collisions[y]
            const collDist = getDistance(playerZ, -playerX, -collision.worldPos.z, -collision.worldPos.x)

            if (collDist < collision.radius) {
              stopBoat = true
            }
          }
        } else {
          island.visible = false
          lod.visible = true
        }

        island.position.x = island.initPos.x - playerX
        island.position.z = island.initPos.z + playerZ
      }

      lod.position.x = lod.initPos.x - playerX / this.#islands.LODRatio
      lod.position.z = lod.initPos.z + playerZ / this.#islands.LODRatio
    }

    if (stopBoat) {
      ControllerManager.stop()
    }

    if (forceYStrength > -1) {
      this._getCloseIsland(forceYStrength)
    } else {
      this._leaveIsland()
    }

    for (let i = 0; i < this.#rupees.materials.length; i++) {
      const mat = this.#rupees.materials[i]
      mat.uniforms.ambientColor.value = new Color(EnvManager.settings.ambientLight)
    }
  }

  _getCloseIsland(index) {
    if (this.closeIsland) return
    this.closeIsland = true
    EnvManager.forceYStrength()
    SoundManager.startMusic(SOUNDS_CONST[`MUSIC_ISLAND_${index}`])

    this.islandsEl.children[index].classList.add('active')

    if (Settings.touch) {
      this.hideIslandsTimeout = setTimeout(() => {
        for (let i = 0; i < this.islandsEl.children.length; i++) {
          const el = this.islandsEl.children[i]
          el.classList.remove('active')
        }
      }, 5000)
    }
  }

  _leaveIsland() {
    if (!this.closeIsland) return
    this.closeIsland = false
    EnvManager.removeForceYStrength()
    SoundManager.startMusic(SOUNDS_CONST.MUSIC_SEA)

    for (let i = 0; i < this.islandsEl.children.length; i++) {
      const el = this.islandsEl.children[i]
      el.classList.remove('active')
    }
  }
}

export default new ExploreManager()

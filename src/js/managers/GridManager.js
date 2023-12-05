import { Vector2 } from 'three'
// Modules
import Debugger from '@/js/managers/Debugger'

import ControllerManager from './ControllerManager'
import { clamp, degToRad } from 'three/src/math/MathUtils'
import ModeManager from './ModeManager'
import GameManager from './GameManager'
import { MODE } from '../utils/constants'

const OFFSET_ANGLE = degToRad(90)

class GridManager {
  #offsetUV = new Vector2(0, 0)
  #settings = {
    uvPos: new Vector2(0.5, 0.5),
    uvOffset: 0,
  }
  constructor() {}

  get offsetUV() {
    return this.#offsetUV
  }

  set offsetUV(val) {
    this.#offsetUV = val
  }

  init(scene) {
    // this._createDebugFolder()
  }

  /**
   * Update
   */
  update({ time, delta }) {
    if (ModeManager.state === MODE.GAME_STARTED && GameManager.paused) {
      return
    }
    let moveX = Math.cos(ControllerManager.boat.angleDir + OFFSET_ANGLE) * ControllerManager.boat.velocity * 1.2
    let moveY = Math.sin(ControllerManager.boat.angleDir + OFFSET_ANGLE) * ControllerManager.boat.velocity * 1.2

    if (ModeManager.state === MODE.GAME || ModeManager.state === MODE.GAME_STARTED) {
      this.#offsetUV.x = clamp(this.#offsetUV.x + moveX, -GameManager.rangeX, GameManager.rangeX)
    } else {
      this.#offsetUV.x += moveX
    }

    this.#offsetUV.y += moveY
  }

  /**
   * Debug
   */
  _createDebugFolder() {
    if (!Debugger) return

    const settingsChangedHandler = () => {
      this.rupeeMesh.material.uniforms.uvPos.value = new Vector2(
        this.#settings.uvPos.x + this.#settings.uvOffset,
        this.#settings.uvPos.y
      )
      this.rupeeMesh.position.x = (this.#settings.uvPos.x - 0.5) * 3000
      this.rupeeMesh.position.z = -(this.#settings.uvPos.y - 0.5) * 3000
    }

    const debugFolder = Debugger.addFolder({ title: `Grid`, expanded: true })

    // debugFolder.addInput(this.#settings, 'uvPos', { step: 0.01, min: 0, max: 1 }).on('change', settingsChangedHandler)
    // debugFolder
    //   .addInput(this.#settings, 'uvOffset', { step: 0.0001 })
    //   .on('change', settingsChangedHandler)

    const btn = debugFolder.addButton({
      title: 'Copy settings',
      label: 'copy', // optional
    })

    btn.on('click', () => {
      navigator.clipboard.writeText(JSON.stringify(this.#settings))
      console.log('copied to clipboard', this.#settings)
    })
    return debugFolder
  }

  reset() {
    this.#offsetUV = new Vector2(0, 0)
  }
}

export default new GridManager()

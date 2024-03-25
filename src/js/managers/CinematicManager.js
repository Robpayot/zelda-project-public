import { START_CAMERA_TREASURE_FOUND } from '../utils/constants'
import { EventBusSingleton } from 'light-event-bus'
import SoundManager, { SOUNDS_CONST } from './SoundManager'

class CinematicManager {
  #isPlaying = false

  constructor() {}

  get isPlaying() {
    return this.#isPlaying
  }

  set isPlaying(val) {
    this.#isPlaying = val
  }

  play(name, options) {
    if (name === 'treasure_found') {
      this.#isPlaying = true
      EventBusSingleton.publish(START_CAMERA_TREASURE_FOUND, options.cameraAngle)
      SoundManager.play(SOUNDS_CONST.TREASURE_LOOKING)
    }
    // this._createDebugFolder()
  }

  end() {
    this.#isPlaying = false
  }
}

export default new CinematicManager()

import { MODE } from '../utils/constants'
import EnvManager from './EnvManager'

class ModeManager {
  #state = MODE.DEFAULT
  #cameraManager
  constructor() {}

  get state() {
    return this.#state
  }

  set(state) {
    this.#state = state

    EnvManager.updateSettings(state)
    this.#cameraManager.updateMode(state)
  }

  addCamera(cameraManager) {
    this.#cameraManager = cameraManager
  }
}

export default new ModeManager()

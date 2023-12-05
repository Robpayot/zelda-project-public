// Test import of a JavaScript module
import WebGLApp from './WebGLApp'
import LoaderManager from './managers/LoaderManager'
import Settings from './utils/Settings'
import config from './views/config'
import gsap from 'gsap'
import { CustomEase } from './utils/CustomEase'
import { EventBusSingleton } from 'light-event-bus'
import { CHOOSE_SETTINGS, MODE } from './utils/constants'
import query from './utils/query'
import UIManager from './managers/UIManager'
// Custom GSAP
gsap.registerPlugin(CustomEase)

CustomEase.create('bounce.out', '0.22, 1.7, 0.36, 1')
CustomEase.create('bounce.in', '0.43, 0.00, 0.79, -0.28')

export const ASSETS = [...config.resources]
;(async () => {
  // HTML
  const canvas = document.querySelector('.scene')
  const settingsBtns = document.querySelectorAll('.settings__button')
  const loading = document.querySelector('[data-loading]')

  let settingsInitiated = false

  // scene
  // Preload assets before initiating the scene
  await LoaderManager.load(ASSETS)
  const tier = await Settings.init()

  settingsInitiated = true

  loading.classList.remove('visible')

  const divReco = document.createElement('div')
  divReco.classList.add('settings__reco')
  divReco.innerHTML = '(recommended)'

  switch (tier) {
    case 3:
      settingsBtns[0].appendChild(divReco)
      settingsBtns[0].classList.add('is-reco')
      break
    case 1:
    case 2:
      settingsBtns[1].appendChild(divReco)
      settingsBtns[1].classList.add('is-reco')
      break
    case 0:
      settingsBtns[2].appendChild(divReco)
      settingsBtns[2].classList.add('is-reco')
      break
  }

  const chooseQuality = async (quality) => {
    if (settingsInitiated) {
      Settings.choose(quality)
      new WebGLApp({ canvas, isDevelopment: import.meta.env.MODE === 'development' })

      if (query('game')) {
        UIManager._modeBtnClick({ target: null, forceMode: MODE.GAME })
      } else if (query('explore')) {
        UIManager._modeBtnClick({ target: null, forceMode: MODE.EXPLORE })
      }
    }
  }

  // Choose quality
  EventBusSingleton.subscribe(CHOOSE_SETTINGS, chooseQuality)
})()

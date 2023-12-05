import query from './query'
import GPU from './gpu'
import { isTouch } from './isTouch'

class Settings {
  tier
  dpr
  castShadows
  textureSize
  antialias
  heightMap
  touch

  async init() {
    const gpu = new GPU()
    this.tier = gpu.tier

    this.touch = isTouch()
    if (this.touch) {
      document.body.classList.add('is-touch')
    }

    const ua = window.navigator.userAgent
    this.isSocial = false
    if (ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1 || ua.indexOf('Instagram') > -1) {
      this.isSocial = true
      document.body.classList.add('is-social')
    }

    // Object.freeze(this)

    console.log('–––––')
    console.log('[Settings]', gpu)
    console.log('–––––')

    return this.tier
  }

  choose({ quality }) {
    switch (quality) {
      case 'low':
        if (this.tier >= 2) {
          this.dpr = getDPR(2)
        } else {
          this.dpr = getDPR(0)
        }
        this.textureSize = 1024
        this.castShadows = false
        this.antialias = false
        this.heightMap = true
        break
      case 'medium':
        if (this.tier >= 2) {
          this.dpr = getDPR(2)
        } else {
          this.dpr = getDPR(1)
        }
        this.textureSize = 1024
        this.castShadows = false
        this.antialias = true
        this.heightMap = true
        break
      case 'high':
        this.dpr = getDPR(2)
        this.textureSize = 2048
        this.castShadows = true
        this.antialias = true
        this.heightMap = true
        break
    }
  }
}

function getDPR(tier) {
  if (query('dpr')) return parseInt(query('dpr'), 10)

  switch (tier) {
    case 0:
      return 1
    case 1:
      return Math.min(1.25, window.devicePixelRatio || 1)
    case 2:
      return Math.min(2, window.devicePixelRatio || 1)
    case 3:
      return Math.min(2, window.devicePixelRatio || 1)
  }

  return window.devicePixelRatio || 1
}

export default new Settings()

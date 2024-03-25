import { Howl } from 'howler'

export const SOUNDS_CONST = {
  MUSIC_TITLE: 'MUSIC_TITLE',
  MUSIC_SEA: 'MUSIC_SEA',
  MUSIC_ISLAND_0: 'MUSIC_ISLAND_0',
  MUSIC_ISLAND_1: 'MUSIC_ISLAND_1',
  MUSIC_ISLAND_2: 'MUSIC_ISLAND_2',
  MUSIC_ISLAND_3: 'MUSIC_ISLAND_3',
  MUSIC_ISLAND_4: 'MUSIC_ISLAND_4',
  MUSIC_ISLAND_5: 'MUSIC_ISLAND_5',
  MUSIC_DAWN: 'MUSIC_DAWN',
  OPEN: 'OPEN',
  CLOSE: 'CLOSE',
  HOVER: 'HOVER',
  MODE_SELECT: 'MODE_SELECT',
  PICTURE: 'PICTURE',
  RUPEE_0: 'RUPEE_0',
  RUPEE_1: 'RUPEE_1',
  RUPEE_2: 'RUPEE_2',
  RUPEE_3: 'RUPEE_3',
  HURT: 'HURT',
  SMALL_CLICK: 'SMALL_CLICK',
  TURN_BOAT_0: 'TURN_BOAT_0',
  TURN_BOAT_1: 'TURN_BOAT_1',
  DROP_WATER: 'DROP_WATER',
  SEAGULL: 'SEAGULL',
  TREASURE_LOOKING: 'TREASURE_LOOKING',
  TREASURE_FOUND: 'TREASURE_FOUND',
}

const SOUNDS = [
  {
    name: SOUNDS_CONST.MUSIC_TITLE,
    loop: true,
    src: './sounds/music_title.mp3',
  },
  {
    name: SOUNDS_CONST.MUSIC_SEA,
    loop: true,
    src: './sounds/sea.mp3',
  },
  {
    name: SOUNDS_CONST.MUSIC_ISLAND_0,
    loop: true,
    src: './sounds/island_0.mp3',
  },
  {
    name: SOUNDS_CONST.MUSIC_ISLAND_1,
    loop: true,
    src: './sounds/island_1.mp3',
  },
  {
    name: SOUNDS_CONST.MUSIC_ISLAND_2,
    loop: true,
    src: './sounds/island_2.mp3',
  },
  {
    name: SOUNDS_CONST.MUSIC_ISLAND_3,
    loop: true,
    src: './sounds/island_3.mp3',
  },
  {
    name: SOUNDS_CONST.MUSIC_ISLAND_4,
    loop: true,
    src: './sounds/island_4.mp3',
  },
  {
    name: SOUNDS_CONST.MUSIC_ISLAND_5,
    loop: true,
    src: './sounds/island_5.mp3',
  },
  {
    name: SOUNDS_CONST.MUSIC_DAWN,
    src: './sounds/dawn.mp3',
  },
  {
    name: SOUNDS_CONST.OPEN,
    src: './sounds/open.mp3',
  },
  {
    name: SOUNDS_CONST.CLOSE,
    src: './sounds/close.mp3',
  },
  {
    name: SOUNDS_CONST.HOVER,
    src: './sounds/hover.mp3',
    volume: 0.45,
  },
  {
    name: SOUNDS_CONST.MODE_SELECT,
    src: './sounds/select.mp3',
  },
  {
    name: SOUNDS_CONST.PICTURE,
    src: './sounds/camera.mp3',
  },
  {
    name: SOUNDS_CONST.RUPEE_0,
    src: './sounds/rupee.mp3',
  },
  {
    name: SOUNDS_CONST.RUPEE_1,
    src: './sounds/rupee2.mp3',
  },
  {
    name: SOUNDS_CONST.RUPEE_2,
    src: './sounds/rupee3.mp3',
  },
  {
    name: SOUNDS_CONST.RUPEE_3,
    src: './sounds/rupee4.mp3',
  },
  {
    name: SOUNDS_CONST.HURT,
    src: './sounds/link_hurt.mp3',
  },
  {
    name: SOUNDS_CONST.SMALL_CLICK,
    src: './sounds/small_click.mp3',
  },
  {
    name: SOUNDS_CONST.TURN_BOAT_0,
    src: './sounds/turn_boat.mp3',
    volume: 0.2,
  },
  {
    name: SOUNDS_CONST.TURN_BOAT_1,
    src: './sounds/turn_boat2.mp3',
    volume: 0.2,
  },
  {
    name: SOUNDS_CONST.DROP_WATER,
    src: './sounds/drop_water.mp3',
  },
  {
    name: SOUNDS_CONST.SEAGULL,
    src: './sounds/seagull.mp3',
  },
  {
    name: SOUNDS_CONST.TREASURE_LOOKING,
    src: './sounds/open_seabox.mp3',
  },
  {
    name: SOUNDS_CONST.TREASURE_FOUND,
    src: './sounds/open_seabox_end.mp3',
  },
]

const DURATION_FADE = 750

class SoundManager {
  #items = {}
  #initiated = false
  constuctor() {}

  initSounds() {
    if (this.#initiated) return
    SOUNDS.forEach((sound) => {
      const { loop, volume, src, name } = sound

      const initVolume = volume || 1

      const howl = new Howl({
        src: [src],
        loop,
        volume: initVolume,
      })

      howl.initVolume = initVolume

      this.#items[name] = howl
    })

    this.#initiated = true
  }

  play(key) {
    this.#items[key]?.play()
  }

  pause(key) {
    this.#items[key]?.pause()
  }

  fadeIn(key, start = 0) {
    if (this.cut) return
    const el = this.#items[key]
    el?.fade(start, el.initVolume, DURATION_FADE)
  }

  fadeOut(key, val = 0, pauseAfter) {
    if (this.cut) return
    const el = this.#items[key]
    el?.fade(el.initVolume, val, DURATION_FADE)

    if (pauseAfter) {
      el.once('fade', () => {
        el.pause()
      })
    }
  }

  fadeInAll() {
    Object.values(this.#items).forEach((el) => {
      el.fade(0, el.initVolume, 500)
    })
  }

  fadeOutAll() {
    Object.values(this.#items).forEach((el) => {
      el.fade(el.initVolume, 0, 500)
    })
  }

  startMusic(key) {
    if (this.seaPlaying === key) {
      this.fadeIn(key)
    } else {
      if (this.seaPlaying) {
        this.fadeOut(this.seaPlaying, 0, true)
        // this.pause(this.seaPlaying)
      }
      this.seaPlaying = key
      this.play(key)
      this.fadeIn(key)
    }
  }

  lowMusic() {
    if (this.seaPlaying) {
      this.fadeOut(this.seaPlaying, 0.3)
    }
  }

  upMusic() {
    if (this.seaPlaying) {
      this.fadeIn(this.seaPlaying, 0.3)
    }
  }
}

export default new SoundManager()

// EVENT BUS
export const EVENT_SCORE = 'EVENT_SCORE'
export const EVENT_HIT = 'EVENT_HIT'
export const INIT_GAME = 'INIT_GAME'
export const START_GAME = 'START_GAME'
export const INIT_EXPLORE = 'INIT_EXPLORE'
export const START_EXPLORE = 'START_EXPLORE'
export const START_CAMERA_LINK = 'START_CAMERA_LINK'
export const END_CAMERA_LINK = 'END_CAMERA_LINK'
export const CUSTOM_LINK = 'CUSTOM_LINK'
export const DARK_LINK = 'DARK_LINK'
export const CHOOSE_SETTINGS = 'CHOOSE_SETTINGS'
export const CAMERA_FOLLOW = 'CAMERA_FOLLOW'
export const START_TOUCH = 'START_TOUCH'
export const HOOK_PUT_AWAY = 'HOOK_PUT_AWAY'
export const START_CAMERA_TREASURE_FOUND = 'START_CAMERA_TREASURE_FOUND'
export const SHOW_TREASURE = 'SHOW_TREASURE'
export const CLOSE_TREASURE = 'CLOSE_TREASURE'
export const TRIFORCE_FOUND = 'TRIFORCE_FOUND'
export const EXPLORE_MESSAGE = 'EXPLORE_MESSAGE'
export const TOOGLE_HOOK = 'TOOGLE_HOOK'

// MODES
export const MODE = {
  DEFAULT: 'default',
  GAME: 'game',
  GAME_STARTED: 'game_started',
  EXPLORE: 'explore',
}

// export const DEBUG = import.meta.env.MODE === "development"
export const DEBUG = false

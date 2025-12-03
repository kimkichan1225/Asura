/**
 * Config.js
 * 전역 설정 관리 모듈
 */

export const Config = {
  // 네트워크 설정
  NETWORK: {
    SERVER_URL: window.location.origin,
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 1000,
    TIMEOUT: 5000
  },

  // 게임 설정
  GAME: {
    DEFAULT_ROUND_TIME: 180, // 초
    MAX_PLAYERS: 8,
    MIN_PLAYERS: 2,
    RESPAWN_TIME: 5 // 초
  },

  // UI 설정
  UI: {
    ANIMATION_DURATION: 300, // ms
    POPUP_FADE_DURATION: 200, // ms
    LOADING_DELAY: 500 // ms
  },

  // 로컬 스토리지 키
  STORAGE_KEYS: {
    PLAYER_NAME: 'asura_player_name',
    SELECTED_CHARACTER: 'asura_selected_character',
    SOUND_ENABLED: 'asura_sound_enabled',
    MUSIC_VOLUME: 'asura_music_volume',
    SFX_VOLUME: 'asura_sfx_volume'
  },

  // 캐릭터 설정
  CHARACTERS: {
    DEFAULT_CHARACTER: 'BlueSoldier_Female',
    BASE_PATH: './resources/New Character/'
  },

  // 맵 설정
  MAPS: {
    DEFAULT_MAP: 'city',
    MAP_LIST: [
      { id: 'city', name: '도시', preview: './resources/CityMap.png' },
      { id: 'island', name: '섬', preview: './resources/IslandMap.png' },
      { id: 'billiard', name: '당구대', preview: './resources/BilliardMap.png' }
    ]
  },

  // 라운드 시간 옵션 (초)
  ROUND_TIME_OPTIONS: [60, 90, 120, 150, 180]
};

/**
 * 설정 값 가져오기
 */
export function getConfig(path) {
  const keys = path.split('.');
  let value = Config;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Config key not found: ${path}`);
      return null;
    }
  }

  return value;
}

/**
 * 설정 값 설정하기
 */
export function setConfig(path, newValue) {
  const keys = path.split('.');
  let obj = Config;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) {
      obj[keys[i]] = {};
    }
    obj = obj[keys[i]];
  }

  obj[keys[keys.length - 1]] = newValue;
}

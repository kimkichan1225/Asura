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
    BASE_PATH: './resources/New Character/',
    CHARACTER_LIST: [
      { id: 'BlueSoldier_Female', name: '용병', image: './resources/character/BlueSoldier_Female.png', model: './resources/New Character/BlueSoldier_Female.glb' },
      { id: 'Casual_Male', name: '학생', image: './resources/character/Casual_Male.png', model: './resources/New Character/Casual_Male.glb' },
      { id: 'Casual2_Female', name: '래퍼', image: './resources/character/Casual2_Female.png', model: './resources/New Character/Casual2_Female.glb' },
      { id: 'Casual3_Female', name: '백수', image: './resources/character/Casual3_Female.png', model: './resources/New Character/Casual3_Female.glb' },
      { id: 'Chef_Hat', name: '요리사', image: './resources/character/Chef_Hat.png', model: './resources/New Character/Chef_Hat.glb' },
      { id: 'Cowboy_Female', name: '총잡이', image: './resources/character/Cowboy_Female.png', model: './resources/New Character/Cowboy_Female.glb' },
      { id: 'Doctor_Female_Young', name: '의사', image: './resources/character/Doctor_Female_Young.png', model: './resources/New Character/Doctor_Female_Young.glb' },
      { id: 'Goblin_Female', name: '고블린', image: './resources/character/Goblin_Female.png', model: './resources/New Character/Goblin_Female.glb' },
      { id: 'Goblin_Male', name: '대머리 고블린', image: './resources/character/Goblin_Male.png', model: './resources/New Character/Goblin_Male.glb' },
      { id: 'Kimono_Female', name: '관장', image: './resources/character/Kimono_Female.png', model: './resources/New Character/Kimono_Female.glb' },
      { id: 'Knight_Golden_Male', name: '황금기사', image: './resources/character/Knight_Golden_Male.png', model: './resources/New Character/Knight_Golden_Male.glb' },
      { id: 'Knight_Male', name: '흑기사', image: './resources/character/Knight_Male.png', model: './resources/New Character/Knight_Male.glb' },
      { id: 'Ninja_Male', name: '닌자', image: './resources/character/Ninja_Male.png', model: './resources/New Character/Ninja_Male.glb' },
      { id: 'Ninja_Sand', name: '사막닌자', image: './resources/character/Ninja_Sand.png', model: './resources/New Character/Ninja_Sand.glb' },
      { id: 'Viking_Male', name: '폭주족', image: './resources/character/Viking_Male.png', model: './resources/New Character/Viking_Male.glb' },
      { id: 'OldClassy_Male', name: '신사', image: './resources/character/OldClassy_Male.png', model: './resources/New Character/OldClassy_Male.glb' },
      { id: 'Pirate_Male', name: '해적', image: './resources/character/Pirate_Male.png', model: './resources/New Character/Pirate_Male.glb' },
      { id: 'Pug', name: '개', image: './resources/character/Pug.png', model: './resources/New Character/Pug.glb' },
      { id: 'Soldier_Male', name: '군인', image: './resources/character/Soldier_Male.png', model: './resources/New Character/Soldier_Male.glb' },
      { id: 'Elf', name: '마법사', image: './resources/character/Elf.png', model: './resources/New Character/Elf.glb' },
      { id: 'Suit_Male', name: '킹스맨', image: './resources/character/Suit_Male.png', model: './resources/New Character/Suit_Male.glb' },
      { id: 'VikingHelmet', name: '바이킹', image: './resources/character/VikingHelmet.png', model: './resources/New Character/VikingHelmet.glb' },
      { id: 'Wizard', name: '대마법사', image: './resources/character/Wizard.png', model: './resources/New Character/Wizard.glb' },
      { id: 'Worker_Female', name: '노동자', image: './resources/character/Worker_Female.png', model: './resources/New Character/Worker_Female.glb' },
      { id: 'Zombie_Male', name: '좀비', image: './resources/character/Zombie_Male.png', model: './resources/New Character/Zombie_Male.glb' },
      { id: 'Cow', name: '소', image: './resources/character/Cow.png', model: './resources/New Character/Cow.glb' }
    ]
  },

  // 맵 설정
  MAPS: {
    DEFAULT_MAP: 'city',
    MAP_LIST: [
      { id: 'city', name: '도시', preview: './resources/CityMap.png', model: './resources/Map/CityMap.glb' },
      { id: 'island', name: '섬', preview: './resources/IslandMap.png', model: './resources/Map/IslandMap.glb' },
      { id: 'billiard', name: '당구대', preview: './resources/BilliardMap.png', model: './resources/Map/BilliardMap.glb' }
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

/**
 * main.js
 * 애플리케이션 메인 진입점
 */

import { MenuUI } from './ui/MenuUI.js';
import { PopupUI } from './ui/PopupUI.js';
import { CharacterSelectUI } from './ui/CharacterSelectUI.js';
import { WaitingRoomUI } from './ui/WaitingRoomUI.js';
import { SocketManager } from './network/SocketManager.js';
import { RoomManager } from './network/RoomManager.js';
import { EventEmitter } from './utils/EventEmitter.js';
import { Logger } from './utils/Logger.js';
import { Config } from './utils/Config.js';
import { Storage } from './utils/Storage.js';

/**
 * 메인 애플리케이션 클래스
 */
class AsuraGame extends EventEmitter {
  constructor() {
    super();

    this.logger = new Logger('AsuraGame');
    this.logger.info('Initializing Asura Game...');

    // 모듈 초기화
    this.ui = {
      menu: null,
      popup: null,
      characterSelect: null,
      waitingRoom: null
    };

    this.network = {
      socket: null,
      room: null
    };

    this.state = {
      playerName: Storage.get(Config.STORAGE_KEYS.PLAYER_NAME, 'Player'),
      selectedCharacter: Storage.get(Config.STORAGE_KEYS.SELECTED_CHARACTER, Config.CHARACTERS.DEFAULT_CHARACTER),
      inRoom: false,
      currentRoom: null
    };

    this.init();
  }

  /**
   * 초기화
   */
  async init() {
    try {
      // UI 초기화
      this.initUI();

      // 네트워크 초기화
      await this.initNetwork();

      this.logger.info('Asura Game initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize:', error);
      this.showError('초기화 실패', error.message);
    }
  }

  /**
   * UI 초기화
   */
  initUI() {
    this.logger.debug('Initializing UI modules...');

    // 메뉴 UI
    this.ui.menu = new MenuUI();
    this.ui.menu
      .onCreateRoom(() => this.handleCreateRoom())
      .onJoinRoom(() => this.handleJoinRoom())
      .onSettings(() => this.handleSettings());

    // 팝업 UI
    this.ui.popup = new PopupUI();

    // 캐릭터 선택 UI
    this.ui.characterSelect = new CharacterSelectUI();
    this.ui.characterSelect.create();
    this.ui.characterSelect.onSelect((data) => {
      this.handleCharacterSelected(data);
    });

    // 대기방 UI
    this.ui.waitingRoom = new WaitingRoomUI();
    this.ui.waitingRoom.create();
    this.ui.waitingRoom
      .onReady(() => this.handleReady())
      .onStartGame(() => this.handleStartGame())
      .onChangeCharacter(() => this.handleChangeCharacter())
      .onChangeMap(() => this.handleChangeMap())
      .onChangeRoundTime(() => this.handleChangeRoundTime())
      .onChangeMaxPlayers(() => this.handleChangeMaxPlayers())
      .onLeaveRoom(() => this.handleLeaveRoom());

    this.logger.debug('UI modules initialized');
  }

  /**
   * 네트워크 초기화
   */
  async initNetwork() {
    this.logger.debug('Initializing network modules...');

    try {
      // 소켓 매니저
      this.network.socket = new SocketManager();
      await this.network.socket.connect(Config.NETWORK.SERVER_URL);

      // 룸 매니저
      this.network.room = new RoomManager(this.network.socket);
      this.network.room
        .on('RoomCreated', (data) => this.onRoomCreated(data))
        .on('RoomJoined', (data) => this.onRoomJoined(data))
        .on('RoomLeft', (data) => this.onRoomLeft(data))
        .on('RoomUpdated', (data) => this.onRoomUpdated(data))
        .on('Error', (error) => this.onNetworkError(error));

      // 캐릭터 선택 완료 이벤트
      this.network.socket.on('characterSelected', (data) => {
        this.onCharacterSelectedConfirmed(data);
      });

      this.logger.debug('Network modules initialized');
    } catch (error) {
      this.logger.error('Network initialization failed:', error);
      throw error;
    }
  }

  /**
   * 방 생성 처리
   */
  handleCreateRoom() {
    this.logger.info('Create room button clicked');

    // 맵 옵션 생성
    const mapOptions = Config.MAPS.MAP_LIST.map(map => `
      <div class="map-option" data-map="${map.id}">
        <img src="${map.preview}" alt="${map.name}">
        <div class="map-name">${map.name}</div>
      </div>
    `).join('');

    // 라운드 시간 옵션 생성
    const roundTimeOptions = Config.ROUND_TIME_OPTIONS.map(time => `
      <button type="button" class="time-option ${time === 180 ? 'selected' : ''}" data-time="${time}">
        ${time}초
      </button>
    `).join('');

    // 방 생성 팝업 생성
    this.ui.popup.createPopup('createRoomPopup', {
      title: '방 생성',
      content: `
        <div class="form-group">
          <label>방 이름:</label>
          <input type="text" id="roomNameInput" placeholder="방 이름을 입력하세요" maxlength="20" value="">
        </div>

        <div class="form-group">
          <label>맵 선택:</label>
          <div class="map-selection" id="mapSelection">
            ${mapOptions}
          </div>
        </div>

        <div class="form-group">
          <label>라운드 시간:</label>
          <div class="time-selection" id="timeSelection">
            ${roundTimeOptions}
          </div>
        </div>

        <div class="form-group">
          <label>최대 인원:</label>
          <select id="maxPlayersInput">
            <option value="2">2명</option>
            <option value="3">3명</option>
            <option value="4" selected>4명</option>
            <option value="5">5명</option>
            <option value="6">6명</option>
            <option value="7">7명</option>
            <option value="8">8명</option>
          </select>
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" id="privateRoomCheck">
            비밀방 만들기
          </label>
        </div>

        <div class="form-group" id="passwordGroup" style="display: none;">
          <label>비밀번호:</label>
          <input type="password" id="roomPasswordInput" placeholder="비밀번호 (4자리 이상)" maxlength="12">
        </div>
      `,
      buttons: [
        {
          text: '생성',
          className: 'popup-button primary',
          callback: () => this.createRoom()
        },
        {
          text: '취소',
          className: 'popup-button'
        }
      ]
    });

    this.ui.popup.open('createRoomPopup');

    // 이벤트 리스너 등록
    setTimeout(() => {
      // 맵 선택
      const mapOptions = document.querySelectorAll('.map-option');
      mapOptions.forEach((option, index) => {
        if (index === 0) option.classList.add('selected');
        option.addEventListener('click', () => {
          mapOptions.forEach(opt => opt.classList.remove('selected'));
          option.classList.add('selected');
        });
      });

      // 라운드 시간 선택
      const timeOptions = document.querySelectorAll('.time-option');
      timeOptions.forEach(option => {
        option.addEventListener('click', () => {
          timeOptions.forEach(opt => opt.classList.remove('selected'));
          option.classList.add('selected');
        });
      });

      // 비밀방 체크박스
      const privateCheck = document.getElementById('privateRoomCheck');
      const passwordGroup = document.getElementById('passwordGroup');
      privateCheck.addEventListener('change', (e) => {
        passwordGroup.style.display = e.target.checked ? 'block' : 'none';
      });
    }, 100);
  }

  /**
   * 방 참가 처리
   */
  handleJoinRoom() {
    this.logger.info('Join room button clicked');

    // 방 참가 팝업 생성
    this.ui.popup.createPopup('joinRoomPopup', {
      title: '방 참가',
      content: `
        <div id="roomListContainer">
          <div class="room-list-header">
            <h3>공개 방 목록</h3>
            <button id="refreshRoomListBtn" class="icon-button">🔄</button>
          </div>
          <div id="roomList" class="room-list">
            <div class="empty-message">방 목록을 불러오는 중...</div>
          </div>
        </div>

        <div class="divider">또는</div>

        <div class="form-group">
          <label>방 코드로 참가:</label>
          <div class="code-input-group">
            <input type="text" id="roomCodeInput" placeholder="6자리 방 코드" maxlength="6">
            <button id="quickJoinBtn" class="icon-button">→</button>
          </div>
        </div>

        <div class="form-group" id="passwordInputGroup" style="display: none;">
          <label>비밀번호:</label>
          <input type="password" id="joinPasswordInput" placeholder="비밀번호 입력">
        </div>
      `,
      buttons: [
        {
          text: '참가',
          className: 'popup-button primary',
          callback: () => this.joinRoom()
        },
        {
          text: '취소',
          className: 'popup-button'
        }
      ]
    });

    this.ui.popup.open('joinRoomPopup');

    // 이벤트 리스너 등록
    setTimeout(() => {
      // 방 목록 업데이트 리스너
      this.network.room.on('RoomListUpdated', (rooms) => {
        this.updateRoomList(rooms);
      });

      // 방 목록 즉시 요청
      this.network.room.requestRoomList();

      // 새로고침 버튼
      const refreshBtn = document.getElementById('refreshRoomListBtn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          this.network.room.requestRoomList();
        });
      }

      // 빠른 참가 버튼
      const quickJoinBtn = document.getElementById('quickJoinBtn');
      const roomCodeInput = document.getElementById('roomCodeInput');
      if (quickJoinBtn && roomCodeInput) {
        quickJoinBtn.addEventListener('click', () => {
          const code = roomCodeInput.value.trim();
          if (code) {
            this.joinRoomByCode(code);
          }
        });

        // Enter 키로 빠른 참가
        roomCodeInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            const code = roomCodeInput.value.trim();
            if (code) {
              this.joinRoomByCode(code);
            }
          }
        });
      }
    }, 100);
  }

  /**
   * 방 목록 업데이트
   */
  updateRoomList(rooms) {
    const roomListContainer = document.getElementById('roomList');
    if (!roomListContainer) return;

    if (rooms.length === 0) {
      roomListContainer.innerHTML = '<div class="empty-message">현재 공개된 방이 없습니다.</div>';
      return;
    }

    roomListContainer.innerHTML = rooms.map(room => `
      <div class="room-item" data-room-id="${room.id}">
        <div class="room-info">
          <div class="room-name">${room.name}</div>
          <div class="room-details">
            <span class="room-map">📍 ${this.getMapName(room.map)}</span>
            <span class="room-players">👥 ${room.currentPlayers}/${room.maxPlayers}</span>
            <span class="room-status ${room.gameState}">${this.getGameStateText(room.gameState)}</span>
          </div>
        </div>
        <button class="join-room-btn" data-room-id="${room.id}">
          참가
        </button>
      </div>
    `).join('');

    // 참가 버튼 이벤트
    const joinButtons = roomListContainer.querySelectorAll('.join-room-btn');
    joinButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const roomId = btn.dataset.roomId;
        this.joinRoomByCode(roomId);
      });
    });
  }

  /**
   * 맵 이름 가져오기
   */
  getMapName(mapId) {
    const map = Config.MAPS.MAP_LIST.find(m => m.id === mapId);
    return map ? map.name : mapId;
  }

  /**
   * 게임 상태 텍스트
   */
  getGameStateText(state) {
    const states = {
      waiting: '대기중',
      starting: '시작중',
      playing: '게임중',
      ended: '종료'
    };
    return states[state] || state;
  }

  /**
   * 코드로 방 참가
   */
  async joinRoomByCode(roomCode) {
    this.logger.info('Joining room by code:', roomCode);

    try {
      await this.network.room.joinRoom(roomCode);
      this.ui.popup.close('joinRoomPopup');
      // onRoomJoined에서 캐릭터 선택 창을 열 것임
    } catch (error) {
      this.logger.error('Failed to join room by code:', error);
      this.showError('방 참가 실패', error.message);
    }
  }

  /**
   * 설정 처리
   */
  handleSettings() {
    this.logger.info('Settings button clicked');

    // 설정 팝업 생성
    this.ui.popup.createPopup('settingsPopup', {
      title: '설정',
      content: `
        <div class="form-group">
          <label>플레이어 이름:</label>
          <input type="text" id="playerNameInput" value="${this.state.playerName}" maxlength="12">
        </div>
        <div class="form-group">
          <label>음악 볼륨:</label>
          <input type="range" id="musicVolumeInput" min="0" max="100" value="${Storage.get(Config.STORAGE_KEYS.MUSIC_VOLUME, 50)}">
          <span id="musicVolumeValue">50%</span>
        </div>
        <div class="form-group">
          <label>효과음 볼륨:</label>
          <input type="range" id="sfxVolumeInput" min="0" max="100" value="${Storage.get(Config.STORAGE_KEYS.SFX_VOLUME, 50)}">
          <span id="sfxVolumeValue">50%</span>
        </div>
      `,
      buttons: [
        {
          text: '저장',
          className: 'popup-button primary',
          callback: () => this.saveSettings()
        },
        {
          text: '취소',
          className: 'popup-button'
        }
      ]
    });

    this.ui.popup.open('settingsPopup');

    // 볼륨 슬라이더 이벤트
    setTimeout(() => {
      const musicVolume = document.getElementById('musicVolumeInput');
      const musicValue = document.getElementById('musicVolumeValue');
      const sfxVolume = document.getElementById('sfxVolumeInput');
      const sfxValue = document.getElementById('sfxVolumeValue');

      if (musicVolume && musicValue) {
        musicVolume.addEventListener('input', (e) => {
          musicValue.textContent = e.target.value + '%';
        });
      }

      if (sfxVolume && sfxValue) {
        sfxVolume.addEventListener('input', (e) => {
          sfxValue.textContent = e.target.value + '%';
        });
      }
    }, 100);
  }

  /**
   * 방 생성
   */
  async createRoom() {
    const roomName = document.getElementById('roomNameInput')?.value.trim();
    const maxPlayers = parseInt(document.getElementById('maxPlayersInput')?.value) || 4;
    const isPrivate = document.getElementById('privateRoomCheck')?.checked || false;
    const password = isPrivate ? document.getElementById('roomPasswordInput')?.value.trim() : null;

    // 선택된 맵
    const selectedMap = document.querySelector('.map-option.selected')?.dataset.map || Config.MAPS.DEFAULT_MAP;

    // 선택된 라운드 시간
    const selectedTime = parseInt(document.querySelector('.time-option.selected')?.dataset.time) || 180;

    if (!roomName) {
      this.showError('오류', '방 이름을 입력해주세요.');
      return;
    }

    if (isPrivate && (!password || password.length < 4)) {
      this.showError('오류', '비밀번호는 4자리 이상 입력해주세요.');
      return;
    }

    try {
      this.logger.info('Creating room:', {
        roomName,
        maxPlayers,
        map: selectedMap,
        roundTime: selectedTime,
        hasPassword: !!password
      });

      await this.network.room.createRoom({
        name: roomName,
        maxPlayers: maxPlayers,
        password: password || null,
        map: selectedMap,
        roundTime: selectedTime
      });

      this.ui.popup.close('createRoomPopup');

      // 캐릭터 선택 창 열기
      this.ui.characterSelect.open();

    } catch (error) {
      this.logger.error('Failed to create room:', error);
      this.showError('방 생성 실패', error.message);
    }
  }

  /**
   * 캐릭터 선택 완료 처리
   */
  async handleCharacterSelected(data) {
    this.logger.info('Character selected:', data);

    // 캐릭터와 닉네임 저장
    this.state.selectedCharacter = data.character;
    this.state.playerName = data.nickname;

    Storage.set(Config.STORAGE_KEYS.SELECTED_CHARACTER, data.character);
    Storage.set(Config.STORAGE_KEYS.PLAYER_NAME, data.nickname);

    // 서버에 캐릭터 선택 전송
    try {
      await this.network.socket.emit('selectCharacter', {
        character: data.character,
        nickname: data.nickname
      });

      this.logger.info('Character selection sent to server');
    } catch (error) {
      this.logger.error('Failed to send character selection:', error);
      this.showError('오류', '캐릭터 선택을 전송하지 못했습니다.');
    }
  }

  /**
   * 캐릭터 선택 확인 처리 (서버로부터)
   */
  onCharacterSelectedConfirmed(data) {
    this.logger.info('Character selection confirmed by server:', data);
    this.logger.debug('Current state:', {
      inRoom: this.state.inRoom,
      hasCurrentRoom: !!this.state.currentRoom
    });

    // 캐릭터 선택 창 닫기
    this.ui.characterSelect.close();

    // 방에 있다면 대기실 표시
    if (this.state.inRoom && this.state.currentRoom) {
      this.logger.info('Opening waiting room...');
      this.showWaitingRoom(this.state.currentRoom);
    } else {
      this.logger.warn('Cannot show waiting room - not in room or no current room data');
    }
  }

  /**
   * 방 참가
   */
  async joinRoom() {
    const roomCode = document.getElementById('roomCodeInput')?.value.trim();

    if (!roomCode) {
      this.showError('오류', '방 코드를 입력해주세요.');
      return;
    }

    try {
      this.logger.info('Joining room:', roomCode);

      await this.network.room.joinRoom(roomCode);

      this.ui.popup.close('joinRoomPopup');

      // onRoomJoined에서 캐릭터 선택 창을 열 것임
    } catch (error) {
      this.logger.error('Failed to join room:', error);
      this.showError('방 참가 실패', error.message);
    }
  }

  /**
   * 설정 저장
   */
  saveSettings() {
    const playerName = document.getElementById('playerNameInput')?.value.trim();
    const musicVolume = parseInt(document.getElementById('musicVolumeInput')?.value) || 50;
    const sfxVolume = parseInt(document.getElementById('sfxVolumeInput')?.value) || 50;

    if (playerName) {
      this.state.playerName = playerName;
      Storage.set(Config.STORAGE_KEYS.PLAYER_NAME, playerName);
    }

    Storage.set(Config.STORAGE_KEYS.MUSIC_VOLUME, musicVolume);
    Storage.set(Config.STORAGE_KEYS.SFX_VOLUME, sfxVolume);

    this.logger.info('Settings saved:', { playerName, musicVolume, sfxVolume });
    this.ui.popup.close('settingsPopup');
  }

  /**
   * 방 생성 완료 이벤트
   */
  onRoomCreated(data) {
    this.logger.info('Room created:', data);
    this.state.inRoom = true;
    this.state.currentRoom = data.room;

    // 캐릭터 선택 창이 이미 열려있으므로 대기실은 캐릭터 선택 후에 표시
    // showWaitingRoom은 onCharacterSelectedConfirmed에서 호출됨
  }

  /**
   * 방 참가 완료 이벤트
   */
  onRoomJoined(data) {
    this.logger.info('Room joined:', data);
    this.state.inRoom = true;
    this.state.currentRoom = data.room;

    // 캐릭터 선택 창 열기
    this.ui.characterSelect.open();
  }

  /**
   * 방 업데이트 이벤트
   */
  onRoomUpdated(data) {
    this.logger.info('Room updated:', data);
    this.state.currentRoom = data.room;

    // 대기실 UI 업데이트
    if (this.state.inRoom && this.network.socket.id) {
      this.ui.waitingRoom.update(data.room, this.network.socket.id);
    }
  }

  /**
   * 방 나가기 이벤트
   */
  onRoomLeft(data) {
    this.logger.info('Room left:', data);
    this.state.inRoom = false;
    this.state.currentRoom = null;

    // 대기실 닫기
    this.ui.waitingRoom.close();

    // 메인 메뉴 표시
    this.ui.menu.show();
  }

  /**
   * 대기실 표시
   */
  showWaitingRoom(roomData) {
    // 메뉴 숨기기
    this.ui.menu.hide();

    // 대기실 업데이트 및 열기
    this.ui.waitingRoom.update(roomData, this.network.socket.id);
    this.ui.waitingRoom.open();
  }

  /**
   * 준비 버튼 처리
   */
  async handleReady() {
    try {
      await this.network.socket.emit('toggleReady');
      this.logger.info('Ready status toggled');
    } catch (error) {
      this.logger.error('Failed to toggle ready:', error);
      this.showError('오류', '준비 상태를 변경하지 못했습니다.');
    }
  }

  /**
   * 게임 시작 처리
   */
  async handleStartGame() {
    try {
      await this.network.socket.emit('startGame');
      this.logger.info('Game start requested');
    } catch (error) {
      this.logger.error('Failed to start game:', error);
      this.showError('오류', '게임을 시작하지 못했습니다.');
    }
  }

  /**
   * 캐릭터 변경 처리
   */
  handleChangeCharacter() {
    this.logger.info('Change character button clicked');
    this.ui.characterSelect.open();
  }

  /**
   * 맵 변경 처리
   */
  handleChangeMap() {
    this.logger.info('Change map button clicked');

    // 맵 선택 팝업 생성
    const mapOptions = Config.MAPS.MAP_LIST.map(map => `
      <div class="map-option ${map.id === this.state.currentRoom.map ? 'selected' : ''}" data-map="${map.id}">
        <img src="${map.preview}" alt="${map.name}">
        <div class="map-name">${map.name}</div>
      </div>
    `).join('');

    this.ui.popup.createPopup('changeMapPopup', {
      title: '맵 변경',
      content: `
        <div class="map-selection" id="mapSelectionChange">
          ${mapOptions}
        </div>
      `,
      buttons: [
        {
          text: '변경',
          className: 'popup-button primary',
          callback: () => this.confirmMapChange()
        },
        {
          text: '취소',
          className: 'popup-button'
        }
      ]
    });

    this.ui.popup.open('changeMapPopup');

    // 맵 선택 이벤트
    setTimeout(() => {
      const mapOptions = document.querySelectorAll('#mapSelectionChange .map-option');
      mapOptions.forEach(option => {
        option.addEventListener('click', () => {
          mapOptions.forEach(opt => opt.classList.remove('selected'));
          option.classList.add('selected');
        });
      });
    }, 100);
  }

  /**
   * 맵 변경 확인
   */
  async confirmMapChange() {
    const selectedMap = document.querySelector('#mapSelectionChange .map-option.selected')?.dataset.map;

    if (!selectedMap) {
      this.showError('오류', '맵을 선택해주세요.');
      return;
    }

    try {
      await this.network.socket.emit('changeMap', { map: selectedMap });
      this.logger.info('Map change requested:', selectedMap);
      this.ui.popup.close('changeMapPopup');
    } catch (error) {
      this.logger.error('Failed to change map:', error);
      this.showError('오류', '맵을 변경하지 못했습니다.');
    }
  }

  /**
   * 라운드 시간 변경 처리
   */
  handleChangeRoundTime() {
    this.logger.info('Change round time button clicked');

    // 라운드 시간 옵션 생성
    const roundTimeOptions = Config.ROUND_TIME_OPTIONS.map(time => `
      <button type="button" class="time-option ${time === this.state.currentRoom.roundTime ? 'selected' : ''}" data-time="${time}">
        ${time}초
      </button>
    `).join('');

    this.ui.popup.createPopup('changeRoundTimePopup', {
      title: '라운드 시간 변경',
      content: `
        <div class="time-selection" id="timeSelectionChange">
          ${roundTimeOptions}
        </div>
      `,
      buttons: [
        {
          text: '변경',
          className: 'popup-button primary',
          callback: () => this.confirmRoundTimeChange()
        },
        {
          text: '취소',
          className: 'popup-button'
        }
      ]
    });

    this.ui.popup.open('changeRoundTimePopup');

    // 시간 선택 이벤트
    setTimeout(() => {
      const timeOptions = document.querySelectorAll('#timeSelectionChange .time-option');
      timeOptions.forEach(option => {
        option.addEventListener('click', () => {
          timeOptions.forEach(opt => opt.classList.remove('selected'));
          option.classList.add('selected');
        });
      });
    }, 100);
  }

  /**
   * 라운드 시간 변경 확인
   */
  async confirmRoundTimeChange() {
    const selectedTime = parseInt(document.querySelector('#timeSelectionChange .time-option.selected')?.dataset.time);

    if (!selectedTime) {
      this.showError('오류', '라운드 시간을 선택해주세요.');
      return;
    }

    try {
      await this.network.socket.emit('changeRoundTime', { roundTime: selectedTime });
      this.logger.info('Round time change requested:', selectedTime);
      this.ui.popup.close('changeRoundTimePopup');
    } catch (error) {
      this.logger.error('Failed to change round time:', error);
      this.showError('오류', '라운드 시간을 변경하지 못했습니다.');
    }
  }

  /**
   * 최대 인원 변경 처리
   */
  handleChangeMaxPlayers() {
    this.logger.info('Change max players button clicked');

    // 최대 인원 옵션 생성
    const maxPlayersOptions = [2, 3, 4, 5, 6, 7, 8].map(num => `
      <button type="button" class="time-option ${num === this.state.currentRoom.maxPlayers ? 'selected' : ''}" data-players="${num}">
        ${num}명
      </button>
    `).join('');

    this.ui.popup.createPopup('changeMaxPlayersPopup', {
      title: '최대 인원 변경',
      content: `
        <div class="time-selection" id="maxPlayersSelectionChange">
          ${maxPlayersOptions}
        </div>
      `,
      buttons: [
        {
          text: '변경',
          className: 'popup-button primary',
          callback: () => this.confirmMaxPlayersChange()
        },
        {
          text: '취소',
          className: 'popup-button'
        }
      ]
    });

    this.ui.popup.open('changeMaxPlayersPopup');

    // 인원 선택 이벤트
    setTimeout(() => {
      const playerOptions = document.querySelectorAll('#maxPlayersSelectionChange .time-option');
      playerOptions.forEach(option => {
        option.addEventListener('click', () => {
          playerOptions.forEach(opt => opt.classList.remove('selected'));
          option.classList.add('selected');
        });
      });
    }, 100);
  }

  /**
   * 최대 인원 변경 확인
   */
  async confirmMaxPlayersChange() {
    const selectedPlayers = parseInt(document.querySelector('#maxPlayersSelectionChange .time-option.selected')?.dataset.players);

    if (!selectedPlayers) {
      this.showError('오류', '최대 인원을 선택해주세요.');
      return;
    }

    // 현재 플레이어 수보다 작은 값은 선택할 수 없음
    if (selectedPlayers < this.state.currentRoom.currentPlayers) {
      this.showError('오류', `현재 플레이어 수(${this.state.currentRoom.currentPlayers}명)보다 작은 값은 선택할 수 없습니다.`);
      return;
    }

    try {
      await this.network.socket.emit('changeMaxPlayers', { maxPlayers: selectedPlayers });
      this.logger.info('Max players change requested:', selectedPlayers);
      this.ui.popup.close('changeMaxPlayersPopup');
    } catch (error) {
      this.logger.error('Failed to change max players:', error);
      this.showError('오류', '최대 인원을 변경하지 못했습니다.');
    }
  }

  /**
   * 방 나가기 처리
   */
  async handleLeaveRoom() {
    this.logger.info('Leave room button clicked');
    try {
      this.network.room.leaveRoom();
      this.logger.info('Leave room request sent');
    } catch (error) {
      this.logger.error('Failed to leave room:', error);
      this.showError('오류', '방을 나가지 못했습니다.');
    }
  }

  /**
   * 네트워크 오류 이벤트
   */
  onNetworkError(error) {
    this.logger.error('Network error:', error);
    this.showError('네트워크 오류', error.message || '연결에 문제가 발생했습니다.');
  }

  /**
   * 에러 표시
   */
  showError(title, message) {
    this.ui.popup.createPopup('errorPopup', {
      title: title,
      content: `<p class="error-message">${message}</p>`,
      buttons: [
        {
          text: '확인',
          className: 'popup-button primary'
        }
      ]
    });

    this.ui.popup.open('errorPopup');
  }
}

// 애플리케이션 시작
window.addEventListener('DOMContentLoaded', () => {
  window.asuraGame = new AsuraGame();
});

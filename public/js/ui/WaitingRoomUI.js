/**
 * WaitingRoomUI.js
 * 대기방 UI 모듈
 */

export class WaitingRoomUI {
  constructor() {
    this.roomData = null;
    this.isHost = false;
    this.callbacks = {
      onReady: null,
      onStartGame: null,
      onChangeCharacter: null,
      onChangeMap: null,
      onChangeRoundTime: null,
      onChangeMaxPlayers: null,
      onLeaveRoom: null
    };
  }

  /**
   * 대기방 생성
   */
  create() {
    const waitingRoom = document.createElement('div');
    waitingRoom.id = 'waitingRoom';
    waitingRoom.className = 'waiting-room-container';
    waitingRoom.style.display = 'none';

    waitingRoom.innerHTML = `
      <div class="waiting-room-header">
        <div class="room-title-section">
          <h2 id="roomNameDisplay">방 이름</h2>
          <div class="room-code-display">
            <span>방 코드:</span>
            <span id="roomCodeDisplay" class="room-code">------</span>
            <button id="copyRoomCodeBtn" class="copy-btn" title="복사">📋</button>
          </div>
        </div>
        <button id="leaveRoomBtn" class="leave-room-btn">나가기</button>
      </div>

      <div class="waiting-room-content">
        <!-- 왼쪽: 플레이어 슬롯 -->
        <div class="players-section">
          <h3>플레이어 (0/4)</h3>
          <div id="playerSlots" class="player-slots-grid">
            <!-- 플레이어 슬롯이 동적으로 추가됨 -->
          </div>
        </div>

        <!-- 오른쪽: 맵 미리보기 및 설정 -->
        <div class="room-settings-section">
          <div class="map-preview-container">
            <h3>선택된 맵</h3>
            <div class="map-preview" id="currentMapPreview">
              <img id="mapPreviewImage" src="" alt="맵 미리보기">
              <div class="map-preview-name" id="mapPreviewName">도시</div>
            </div>
            <button id="changeMapBtn" class="change-map-btn" style="display: none;">
              맵 변경
            </button>
          </div>

          <div class="room-info-section">
            <div class="info-item">
              <span class="info-label">라운드 시간:</span>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="info-value" id="roundTimeDisplay">180초</span>
                <button id="changeRoundTimeBtn" class="change-setting-btn" style="display: none;">변경</button>
              </div>
            </div>
            <div class="info-item">
              <span class="info-label">최대 인원:</span>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="info-value" id="maxPlayersDisplay">4명</span>
                <button id="changeMaxPlayersBtn" class="change-setting-btn" style="display: none;">변경</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="waiting-room-footer">
        <button id="changeCharacterBtn" class="footer-btn">캐릭터 변경</button>
        <button id="readyBtn" class="footer-btn ready-btn">준비</button>
        <button id="startGameBtn" class="footer-btn start-btn" style="display: none;">게임 시작</button>
      </div>
    `;

    document.body.appendChild(waitingRoom);
    this.attachEventListeners();

    return waitingRoom;
  }

  /**
   * 이벤트 리스너 연결
   */
  attachEventListeners() {
    // 준비 버튼
    const readyBtn = document.getElementById('readyBtn');
    if (readyBtn) {
      readyBtn.addEventListener('click', () => {
        if (this.callbacks.onReady) {
          this.callbacks.onReady();
        }
      });
    }

    // 게임 시작 버튼
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (this.callbacks.onStartGame) {
          this.callbacks.onStartGame();
        }
      });
    }

    // 캐릭터 변경 버튼
    const changeCharBtn = document.getElementById('changeCharacterBtn');
    if (changeCharBtn) {
      changeCharBtn.addEventListener('click', () => {
        if (this.callbacks.onChangeCharacter) {
          this.callbacks.onChangeCharacter();
        }
      });
    }

    // 맵 변경 버튼
    const changeMapBtn = document.getElementById('changeMapBtn');
    if (changeMapBtn) {
      changeMapBtn.addEventListener('click', () => {
        if (this.callbacks.onChangeMap) {
          this.callbacks.onChangeMap();
        }
      });
    }

    // 라운드 시간 변경 버튼
    const changeRoundTimeBtn = document.getElementById('changeRoundTimeBtn');
    if (changeRoundTimeBtn) {
      changeRoundTimeBtn.addEventListener('click', () => {
        if (this.callbacks.onChangeRoundTime) {
          this.callbacks.onChangeRoundTime();
        }
      });
    }

    // 최대 인원 변경 버튼
    const changeMaxPlayersBtn = document.getElementById('changeMaxPlayersBtn');
    if (changeMaxPlayersBtn) {
      changeMaxPlayersBtn.addEventListener('click', () => {
        if (this.callbacks.onChangeMaxPlayers) {
          this.callbacks.onChangeMaxPlayers();
        }
      });
    }

    // 방 나가기 버튼
    const leaveBtn = document.getElementById('leaveRoomBtn');
    if (leaveBtn) {
      leaveBtn.addEventListener('click', () => {
        if (this.callbacks.onLeaveRoom) {
          this.callbacks.onLeaveRoom();
        }
      });
    }

    // 방 코드 복사 버튼
    const copyBtn = document.getElementById('copyRoomCodeBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const roomCode = document.getElementById('roomCodeDisplay')?.textContent;
        if (roomCode) {
          navigator.clipboard.writeText(roomCode).then(() => {
            copyBtn.textContent = '✓';
            setTimeout(() => {
              copyBtn.textContent = '📋';
            }, 2000);
          });
        }
      });
    }
  }

  /**
   * 대기방 업데이트
   */
  update(roomData, myPlayerId) {
    console.log('[WaitingRoomUI] update() called with:', {
      myPlayerId,
      roomPlayers: roomData?.players,
      playerCount: roomData?.players?.length
    });

    this.roomData = roomData;
    this.isHost = roomData.hostId === myPlayerId;

    // 방 정보 업데이트
    this.updateRoomInfo();

    // 플레이어 슬롯 업데이트
    this.updatePlayerSlots(myPlayerId);

    // 맵 미리보기 업데이트
    this.updateMapPreview();

    // 버튼 상태 업데이트
    this.updateButtonStates(myPlayerId);

    console.log('[WaitingRoomUI] update() completed');
  }

  /**
   * 방 정보 업데이트
   */
  updateRoomInfo() {
    const roomNameEl = document.getElementById('roomNameDisplay');
    const roomCodeEl = document.getElementById('roomCodeDisplay');
    const roundTimeEl = document.getElementById('roundTimeDisplay');
    const maxPlayersEl = document.getElementById('maxPlayersDisplay');

    if (roomNameEl) roomNameEl.textContent = this.roomData.name;
    if (roomCodeEl) roomCodeEl.textContent = this.roomData.id;
    if (roundTimeEl) roundTimeEl.textContent = `${this.roomData.roundTime}초`;
    if (maxPlayersEl) maxPlayersEl.textContent = `${this.roomData.maxPlayers}명`;
  }

  /**
   * 플레이어 슬롯 업데이트
   */
  updatePlayerSlots(myPlayerId) {
    console.log('[WaitingRoomUI] updatePlayerSlots() called');
    const slotsContainer = document.getElementById('playerSlots');
    if (!slotsContainer) {
      console.error('[WaitingRoomUI] playerSlots container not found');
      return;
    }

    const players = this.roomData.players || [];
    const maxPlayers = this.roomData.maxPlayers;

    console.log('[WaitingRoomUI] Updating player slots:', {
      playerCount: players.length,
      maxPlayers,
      playerIds: players.map(p => p.id)
    });

    // 제목 업데이트
    const titleEl = document.querySelector('.players-section h3');
    if (titleEl) {
      titleEl.textContent = `플레이어 (${players.length}/${maxPlayers})`;
    }

    // 슬롯 생성
    slotsContainer.innerHTML = '';

    for (let i = 0; i < maxPlayers; i++) {
      const player = players[i];
      const slot = document.createElement('div');
      slot.className = 'player-slot';

      if (player) {
        // 플레이어 있음
        const isMe = player.id === myPlayerId;
        const isHost = player.id === this.roomData.hostId;

        slot.innerHTML = `
          <div class="player-slot-content">
            <div class="player-avatar">
              <img src="./resources/character/${player.character}.png" alt="${player.name}">
            </div>
            <div class="player-info">
              <div class="player-name">${player.name}${isMe ? ' (나)' : ''}</div>
              ${isHost ? '<div class="host-badge">방장</div>' : ''}
              <div class="player-status ${player.ready ? 'ready' : 'not-ready'}">
                ${player.ready ? '✓ 준비완료' : '대기중'}
              </div>
            </div>
          </div>
        `;

        if (isMe) {
          slot.classList.add('my-slot');
        }
      } else {
        // 빈 슬롯
        slot.classList.add('empty-slot');
        slot.innerHTML = `
          <div class="empty-slot-content">
            <div class="empty-icon">👤</div>
            <div class="empty-text">빈 자리</div>
          </div>
        `;
      }

      slotsContainer.appendChild(slot);
    }
  }

  /**
   * 맵 미리보기 업데이트
   */
  updateMapPreview() {
    const mapImageEl = document.getElementById('mapPreviewImage');
    const mapNameEl = document.getElementById('mapPreviewName');

    if (!this.roomData) return;

    // Config에서 맵 정보 가져오기
    const mapInfo = this.getMapInfo(this.roomData.map);

    if (mapImageEl) {
      mapImageEl.src = mapInfo.preview;
      mapImageEl.alt = mapInfo.name;
    }

    if (mapNameEl) {
      mapNameEl.textContent = mapInfo.name;
    }
  }

  /**
   * 버튼 상태 업데이트
   */
  updateButtonStates(myPlayerId) {
    const readyBtn = document.getElementById('readyBtn');
    const startBtn = document.getElementById('startGameBtn');
    const changeMapBtn = document.getElementById('changeMapBtn');

    const myPlayer = this.roomData.players?.find(p => p.id === myPlayerId);

    // 준비 버튼
    if (readyBtn) {
      if (this.isHost) {
        readyBtn.style.display = 'none';
      } else {
        readyBtn.style.display = 'block';
        if (myPlayer?.ready) {
          readyBtn.textContent = '준비 취소';
          readyBtn.classList.add('ready-active');
        } else {
          readyBtn.textContent = '준비';
          readyBtn.classList.remove('ready-active');
        }
      }
    }

    // 게임 시작 버튼 (방장만)
    if (startBtn) {
      if (this.isHost) {
        startBtn.style.display = 'block';

        // 모든 플레이어가 준비되었는지 확인
        const allReady = this.roomData.players?.every(p =>
          p.id === this.roomData.hostId || p.ready
        ) && this.roomData.players.length >= 2;

        startBtn.disabled = !allReady;
        startBtn.textContent = allReady ? '게임 시작' : '플레이어 준비 대기중';
      } else {
        startBtn.style.display = 'none';
      }
    }

    // 맵 변경 버튼 (방장만)
    if (changeMapBtn) {
      changeMapBtn.style.display = this.isHost ? 'block' : 'none';
    }

    // 라운드 시간 변경 버튼 (방장만)
    const changeRoundTimeBtn = document.getElementById('changeRoundTimeBtn');
    if (changeRoundTimeBtn) {
      changeRoundTimeBtn.style.display = this.isHost ? 'inline-block' : 'none';
    }

    // 최대 인원 변경 버튼 (방장만)
    const changeMaxPlayersBtn = document.getElementById('changeMaxPlayersBtn');
    if (changeMaxPlayersBtn) {
      changeMaxPlayersBtn.style.display = this.isHost ? 'inline-block' : 'none';
    }
  }

  /**
   * 맵 정보 가져오기
   */
  getMapInfo(mapId) {
    const maps = {
      'city': { name: '도시', preview: './resources/CityMap.png' },
      'island': { name: '섬', preview: './resources/IslandMap.png' },
      'billiard': { name: '당구대', preview: './resources/BilliardMap.png' }
    };

    return maps[mapId] || maps['city'];
  }

  /**
   * 대기방 열기
   */
  open() {
    const waitingRoom = document.getElementById('waitingRoom');
    if (waitingRoom) {
      waitingRoom.style.display = 'flex';
    }
  }

  /**
   * 대기방 닫기
   */
  close() {
    const waitingRoom = document.getElementById('waitingRoom');
    if (waitingRoom) {
      waitingRoom.style.display = 'none';
    }
  }

  /**
   * 콜백 등록
   */
  onReady(callback) {
    this.callbacks.onReady = callback;
    return this;
  }

  onStartGame(callback) {
    this.callbacks.onStartGame = callback;
    return this;
  }

  onChangeCharacter(callback) {
    this.callbacks.onChangeCharacter = callback;
    return this;
  }

  onChangeMap(callback) {
    this.callbacks.onChangeMap = callback;
    return this;
  }

  onChangeRoundTime(callback) {
    this.callbacks.onChangeRoundTime = callback;
    return this;
  }

  onChangeMaxPlayers(callback) {
    this.callbacks.onChangeMaxPlayers = callback;
    return this;
  }

  onLeaveRoom(callback) {
    this.callbacks.onLeaveRoom = callback;
    return this;
  }
}

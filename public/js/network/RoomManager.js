/**
 * RoomManager.js
 * 방 생성, 참가, 관리 모듈
 */

export class RoomManager {
  constructor(socketManager) {
    this.socket = socketManager;
    this.currentRoom = null;
    this.roomList = [];
    this.callbacks = {
      onRoomCreated: null,
      onRoomJoined: null,
      onRoomLeft: null,
      onRoomUpdated: null,
      onRoomListUpdated: null,
      onPlayerJoined: null,
      onPlayerLeft: null,
      onError: null
    };

    this.setupSocketListeners();
  }

  /**
   * 소켓 이벤트 리스너 설정
   */
  setupSocketListeners() {
    this.socket.on('roomCreated', (data) => {
      this.currentRoom = data.room;
      if (this.callbacks.onRoomCreated) {
        this.callbacks.onRoomCreated(data);
      }
    });

    this.socket.on('roomJoined', (data) => {
      this.currentRoom = data.room;
      if (this.callbacks.onRoomJoined) {
        this.callbacks.onRoomJoined(data);
      }
    });

    this.socket.on('roomLeft', (data) => {
      this.currentRoom = null;
      if (this.callbacks.onRoomLeft) {
        this.callbacks.onRoomLeft(data);
      }
    });

    this.socket.on('roomUpdate', (data) => {
      this.currentRoom = data.room;
      if (this.callbacks.onRoomUpdated) {
        this.callbacks.onRoomUpdated(data);
      }
    });

    this.socket.on('roomListUpdate', (rooms) => {
      this.roomList = rooms;
      if (this.callbacks.onRoomListUpdated) {
        this.callbacks.onRoomListUpdated(rooms);
      }
    });

    this.socket.on('playerJoined', (data) => {
      if (this.callbacks.onPlayerJoined) {
        this.callbacks.onPlayerJoined(data);
      }
    });

    this.socket.on('playerLeft', (data) => {
      if (this.callbacks.onPlayerLeft) {
        this.callbacks.onPlayerLeft(data);
      }
    });

    this.socket.on('roomError', (error) => {
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });
  }

  /**
   * 방 생성
   */
  async createRoom(config) {
    try {
      const response = await this.socket.emitWithAck('createRoom', config);

      // 성공 시 콜백 호출
      if (response.success && response.room) {
        this.currentRoom = response.room;
        if (this.callbacks.onRoomCreated) {
          this.callbacks.onRoomCreated(response);
        }
      } else if (!response.success) {
        throw new Error(response.error || '방 생성 실패');
      }

      return response;
    } catch (error) {
      console.error('Failed to create room:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * 방 참가
   */
  async joinRoom(roomId, password = null) {
    try {
      const response = await this.socket.emitWithAck('joinRoom', {
        roomId,
        password
      });

      // 성공 시 콜백 호출
      if (response.success && response.room) {
        this.currentRoom = response.room;
        if (this.callbacks.onRoomJoined) {
          this.callbacks.onRoomJoined(response);
        }
      } else if (!response.success) {
        throw new Error(response.error || '방 참가 실패');
      }

      return response;
    } catch (error) {
      // 비밀번호 에러는 예상된 동작이므로 로그 출력 안함
      if (!error.message || (!error.message.includes('비밀번호') && error.message !== '비밀번호가 틀렸습니다.')) {
        console.error('Failed to join room:', error);
      }
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * 방 나가기
   */
  leaveRoom() {
    if (this.socket && this.socket.isConnected()) {
      this.socket.emit('leaveRoom');
    }
    this.currentRoom = null;
  }

  /**
   * 방 목록 요청
   */
  requestRoomList() {
    this.socket.emit('getRoomList');
  }

  /**
   * 현재 방 정보 가져오기
   */
  getCurrentRoom() {
    return this.currentRoom;
  }

  /**
   * 방 목록 가져오기
   */
  getRoomList() {
    return this.roomList;
  }

  /**
   * 콜백 등록
   */
  on(event, callback) {
    if (this.callbacks.hasOwnProperty('on' + event.charAt(0).toUpperCase() + event.slice(1))) {
      this.callbacks['on' + event.charAt(0).toUpperCase() + event.slice(1)] = callback;
    }
    return this;
  }
}

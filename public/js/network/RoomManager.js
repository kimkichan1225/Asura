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
      console.log('[RoomManager] Received roomLeft event:', data);
      this.currentRoom = null;
      if (this.callbacks.onRoomLeft) {
        console.log('[RoomManager] Calling onRoomLeft callback');
        this.callbacks.onRoomLeft(data);
      }
    });

    this.socket.on('roomUpdate', (data) => {
      console.log('[RoomManager] Received roomUpdate event:', data);
      this.currentRoom = data.room;
      if (this.callbacks.onRoomUpdated) {
        console.log('[RoomManager] Calling onRoomUpdated callback');
        this.callbacks.onRoomUpdated(data);
      } else {
        console.warn('[RoomManager] No onRoomUpdated callback registered');
      }
    });

    this.socket.on('roomListUpdate', (rooms) => {
      console.log('[RoomManager] Received roomListUpdate event:', rooms);
      this.roomList = rooms;
      if (this.callbacks.onRoomListUpdated) {
        console.log('[RoomManager] Calling onRoomListUpdated callback with', rooms.length, 'rooms');
        this.callbacks.onRoomListUpdated(rooms);
      } else {
        console.warn('[RoomManager] No onRoomListUpdated callback registered');
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
      console.error('Failed to join room:', error);
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
    console.log('[RoomManager] Leaving room...');
    if (this.socket && this.socket.isConnected()) {
      this.socket.emit('leaveRoom');
      console.log('[RoomManager] Leave room event emitted');
    } else {
      console.warn('[RoomManager] Socket not connected, cannot leave room');
    }
    this.currentRoom = null;
  }

  /**
   * 방 목록 요청
   */
  requestRoomList() {
    console.log('[RoomManager] Requesting room list...');
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

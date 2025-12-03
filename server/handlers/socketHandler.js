/**
 * socketHandler.js
 * Socket.io 이벤트 핸들러
 */

const Player = require('../modules/Player');

class SocketHandler {
  constructor(io, roomManager) {
    this.io = io;
    this.roomManager = roomManager;
    this.players = new Map();
  }

  /**
   * 소켓 연결 처리
   */
  handleConnection(socket) {
    console.log(`[Socket] Player connected: ${socket.id}`);

    // 새 플레이어 생성
    const player = new Player(socket.id);
    this.players.set(socket.id, player);

    // 이벤트 리스너 등록
    this.registerEventListeners(socket);

    // 연결 정보 전송
    socket.emit('connected', {
      playerId: socket.id,
      serverTime: Date.now()
    });
  }

  /**
   * 이벤트 리스너 등록
   */
  registerEventListeners(socket) {
    // 방 생성
    socket.on('createRoom', (config, callback) => {
      this.handleCreateRoom(socket, config, callback);
    });

    // 방 참가
    socket.on('joinRoom', (data, callback) => {
      this.handleJoinRoom(socket, data, callback);
    });

    // 방 나가기
    socket.on('leaveRoom', () => {
      this.handleLeaveRoom(socket);
    });

    // 방 목록 요청
    socket.on('getRoomList', () => {
      this.handleGetRoomList(socket);
    });

    // 캐릭터 선택
    socket.on('selectCharacter', (data) => {
      this.handleSelectCharacter(socket, data);
    });

    // 준비 토글
    socket.on('toggleReady', () => {
      this.handleToggleReady(socket);
    });

    // 맵 변경
    socket.on('changeMap', (data) => {
      this.handleChangeMap(socket, data);
    });

    // 게임 시작
    socket.on('startGame', () => {
      this.handleStartGame(socket);
    });

    // 플레이어 위치 업데이트
    socket.on('updatePosition', (data) => {
      this.handleUpdatePosition(socket, data);
    });

    // 채팅 메시지
    socket.on('chatMessage', (message) => {
      this.handleChatMessage(socket, message);
    });

    // 연결 해제
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  /**
   * 방 생성 처리
   */
  handleCreateRoom(socket, config, callback) {
    try {
      const player = this.players.get(socket.id);
      if (!player) {
        throw new Error('플레이어를 찾을 수 없습니다.');
      }

      // 이미 방에 있는지 확인
      if (player.roomId) {
        throw new Error('이미 방에 있습니다.');
      }

      // 방 생성
      const room = this.roomManager.createRoom({
        ...config,
        hostId: socket.id
      });

      // 플레이어를 방에 추가 (방장은 자동으로 ready)
      room.addPlayer(player);
      player.joinRoom(room.id);
      player.setReady(true);

      // 소켓을 방에 추가
      socket.join(room.id);

      console.log(`[Room] Player ${socket.id} created room ${room.id}`);

      // 응답 - 클라이언트는 캐릭터 선택 후 방 데이터를 받음
      if (callback) {
        callback({
          success: true,
          room: room.toJSON()
        });
      }

      // 방 목록 업데이트 브로드캐스트
      this.broadcastRoomList();

    } catch (error) {
      console.error('[Room] Create room error:', error.message);
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * 방 참가 처리
   */
  handleJoinRoom(socket, data, callback) {
    try {
      const player = this.players.get(socket.id);
      if (!player) {
        throw new Error('플레이어를 찾을 수 없습니다.');
      }

      const room = this.roomManager.getRoom(data.roomId);
      if (!room) {
        throw new Error('방을 찾을 수 없습니다.');
      }

      // 비밀번호 확인
      if (room.isPrivate && !room.checkPassword(data.password)) {
        throw new Error('비밀번호가 틀렸습니다.');
      }

      // 방에 추가
      room.addPlayer(player);
      player.joinRoom(room.id);
      socket.join(room.id);

      console.log(`[Room] Player ${socket.id} joined room ${room.id}`);

      // 응답
      if (callback) {
        callback({
          success: true,
          room: room.toJSON()
        });
      }

      // 방 안의 다른 플레이어들에게 알림
      socket.to(room.id).emit('playerJoined', {
        player: player.toLobbyJSON()
      });

      // 방 목록 업데이트
      this.broadcastRoomList();

    } catch (error) {
      console.error('[Room] Join room error:', error.message);
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * 방 나가기 처리
   */
  handleLeaveRoom(socket) {
    const player = this.players.get(socket.id);
    if (!player || !player.roomId) return;

    const room = this.roomManager.getRoom(player.roomId);
    if (!room) return;

    const roomId = room.id;

    // 방에서 플레이어 제거
    room.removePlayer(socket.id);
    player.leaveRoom();
    socket.leave(roomId);

    console.log(`[Room] Player ${socket.id} left room ${roomId}`);

    // 방이 비었으면 삭제
    if (room.isEmpty()) {
      this.roomManager.deleteRoom(roomId);
    } else {
      // 다른 플레이어들에게 알림
      this.io.to(roomId).emit('playerLeft', {
        playerId: socket.id,
        newHostId: room.hostId
      });
    }

    // 방 목록 업데이트
    this.broadcastRoomList();

    // 플레이어에게 확인
    socket.emit('roomLeft', { roomId });
  }

  /**
   * 방 목록 요청 처리
   */
  handleGetRoomList(socket) {
    const rooms = this.roomManager.getPublicRooms();
    socket.emit('roomListUpdate', rooms);
  }

  /**
   * 캐릭터 선택 처리
   */
  handleSelectCharacter(socket, data) {
    const player = this.players.get(socket.id);
    if (!player) return;

    // 캐릭터와 닉네임 설정
    player.setCharacter(data.character);
    player.setName(data.nickname);

    console.log(`[Player] ${socket.id} selected character: ${data.character}, nickname: ${data.nickname}`);

    // 방에 있다면 방 업데이트 전송
    if (player.roomId) {
      const room = this.roomManager.getRoom(player.roomId);
      if (room) {
        this.io.to(room.id).emit('roomUpdate', {
          room: room.toJSON()
        });
      }
    }

    socket.emit('characterSelected', {
      success: true,
      character: data.character,
      nickname: data.nickname
    });
  }

  /**
   * 준비 토글 처리
   */
  handleToggleReady(socket) {
    const player = this.players.get(socket.id);
    if (!player || !player.roomId) return;

    const room = this.roomManager.getRoom(player.roomId);
    if (!room) return;

    // 방장은 준비 불필요
    if (room.isHost(socket.id)) {
      return;
    }

    player.toggleReady();

    console.log(`[Player] ${socket.id} ready status: ${player.ready}`);

    // 방 안의 모든 플레이어에게 업데이트
    this.io.to(room.id).emit('roomUpdate', {
      room: room.toJSON()
    });
  }

  /**
   * 맵 변경 처리
   */
  handleChangeMap(socket, data) {
    const player = this.players.get(socket.id);
    if (!player || !player.roomId) return;

    const room = this.roomManager.getRoom(player.roomId);
    if (!room) return;

    // 방장만 맵 변경 가능
    if (!room.isHost(socket.id)) {
      socket.emit('error', { message: '방장만 맵을 변경할 수 있습니다.' });
      return;
    }

    room.setMap(data.map);

    console.log(`[Room] Map changed to ${data.map} in room ${room.id}`);

    // 방 안의 모든 플레이어에게 업데이트
    this.io.to(room.id).emit('roomUpdate', {
      room: room.toJSON()
    });
  }

  /**
   * 게임 시작 처리
   */
  handleStartGame(socket) {
    const player = this.players.get(socket.id);
    if (!player || !player.roomId) return;

    const room = this.roomManager.getRoom(player.roomId);
    if (!room) return;

    // 방장만 시작 가능
    if (!room.isHost(socket.id)) {
      socket.emit('error', { message: '방장만 게임을 시작할 수 있습니다.' });
      return;
    }

    // 게임 시작 가능 확인
    if (!room.canStartGame()) {
      socket.emit('error', { message: '게임을 시작할 수 없습니다.' });
      return;
    }

    room.setGameState('starting');

    console.log(`[Game] Starting game in room ${room.id}`);

    // 방 안의 모든 플레이어에게 게임 시작 알림
    this.io.to(room.id).emit('gameStarting', {
      countdown: 3,
      map: room.map,
      players: room.getAllPlayers().map(p => p.toJSON())
    });

    // 3초 후 게임 상태를 playing으로 변경
    setTimeout(() => {
      room.setGameState('playing');
      this.io.to(room.id).emit('gameStarted', {
        startTime: Date.now(),
        roundTime: room.roundTime
      });
    }, 3000);
  }

  /**
   * 위치 업데이트 처리
   */
  handleUpdatePosition(socket, data) {
    const player = this.players.get(socket.id);
    if (!player || !player.roomId) return;

    player.updatePosition(data.position);
    if (data.rotation) {
      player.updateRotation(data.rotation);
    }

    // 같은 방의 다른 플레이어들에게 전송
    socket.to(player.roomId).emit('playerMoved', {
      playerId: socket.id,
      position: player.position,
      rotation: player.rotation
    });
  }

  /**
   * 채팅 메시지 처리
   */
  handleChatMessage(socket, message) {
    const player = this.players.get(socket.id);
    if (!player || !player.roomId) return;

    const room = this.roomManager.getRoom(player.roomId);
    if (!room) return;

    // 방 안의 모든 플레이어에게 전송
    this.io.to(room.id).emit('chatMessage', {
      playerId: socket.id,
      playerName: player.name,
      message: message,
      timestamp: Date.now()
    });
  }

  /**
   * 연결 해제 처리
   */
  handleDisconnect(socket) {
    console.log(`[Socket] Player disconnected: ${socket.id}`);

    // 방에서 나가기
    this.handleLeaveRoom(socket);

    // 플레이어 제거
    this.players.delete(socket.id);

    // 빈 방 정리
    this.roomManager.cleanupEmptyRooms();
  }

  /**
   * 방 목록 브로드캐스트
   */
  broadcastRoomList() {
    const rooms = this.roomManager.getPublicRooms();
    this.io.emit('roomListUpdate', rooms);
  }
}

module.exports = SocketHandler;

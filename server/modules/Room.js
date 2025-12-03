/**
 * Room.js
 * 게임 방 관리 클래스
 */

class Room {
  constructor(id, config) {
    this.id = id;
    this.name = config.name;
    this.hostId = config.hostId;
    this.maxPlayers = config.maxPlayers || 8;
    this.password = config.password || null;
    this.isPrivate = !!config.password;
    this.map = config.map || 'map1';
    this.roundTime = config.roundTime || 180;

    this.players = new Map();
    this.gameState = 'waiting'; // waiting, starting, playing, ended
    this.createdAt = Date.now();
  }

  /**
   * 플레이어 추가
   */
  addPlayer(player) {
    if (this.isFull()) {
      throw new Error('방이 가득 찼습니다.');
    }

    if (this.players.has(player.id)) {
      throw new Error('이미 방에 있는 플레이어입니다.');
    }

    this.players.set(player.id, player);
    return true;
  }

  /**
   * 플레이어 제거
   */
  removePlayer(playerId) {
    const removed = this.players.delete(playerId);

    // 방장이 나갔을 때
    if (playerId === this.hostId && this.players.size > 0) {
      // 다음 플레이어를 방장으로 지정
      const nextHost = this.players.values().next().value;
      this.hostId = nextHost.id;
    }

    return removed;
  }

  /**
   * 플레이어 가져오기
   */
  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  /**
   * 모든 플레이어 가져오기
   */
  getAllPlayers() {
    return Array.from(this.players.values());
  }

  /**
   * 플레이어 수
   */
  getPlayerCount() {
    return this.players.size;
  }

  /**
   * 방이 가득 찼는지 확인
   */
  isFull() {
    return this.players.size >= this.maxPlayers;
  }

  /**
   * 방이 비어있는지 확인
   */
  isEmpty() {
    return this.players.size === 0;
  }

  /**
   * 방장 확인
   */
  isHost(playerId) {
    return this.hostId === playerId;
  }

  /**
   * 비밀번호 확인
   */
  checkPassword(password) {
    if (!this.password) return true;
    return this.password === password;
  }

  /**
   * 게임 시작 가능 여부
   */
  canStartGame() {
    return this.players.size >= 2 && this.gameState === 'waiting';
  }

  /**
   * 게임 상태 변경
   */
  setGameState(state) {
    this.gameState = state;
  }

  /**
   * 맵 변경
   */
  setMap(map) {
    if (this.gameState !== 'waiting') {
      throw new Error('게임 중에는 맵을 변경할 수 없습니다.');
    }
    this.map = map;
  }

  /**
   * 방 정보 (클라이언트용)
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      maxPlayers: this.maxPlayers,
      currentPlayers: this.players.size,
      isPrivate: this.isPrivate,
      map: this.map,
      roundTime: this.roundTime,
      gameState: this.gameState,
      players: this.getAllPlayers().map(p => ({
        id: p.id,
        name: p.name,
        character: p.character,
        ready: p.ready
      }))
    };
  }

  /**
   * 공개 방 목록용 정보
   */
  toListJSON() {
    return {
      id: this.id,
      name: this.name,
      currentPlayers: this.players.size,
      maxPlayers: this.maxPlayers,
      map: this.map,
      gameState: this.gameState,
      isPrivate: this.isPrivate
    };
  }
}

module.exports = Room;

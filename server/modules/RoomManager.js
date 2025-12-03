/**
 * RoomManager.js
 * 서버 측 방 관리자
 */

const Room = require('./Room');

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.roomIdCounter = 1;
  }

  /**
   * 방 생성
   */
  createRoom(config) {
    const roomId = this.generateRoomId();
    const room = new Room(roomId, config);
    this.rooms.set(roomId, room);

    console.log(`[RoomManager] Room created: ${roomId} - ${config.name}`);
    return room;
  }

  /**
   * 방 삭제
   */
  deleteRoom(roomId) {
    const deleted = this.rooms.delete(roomId);
    if (deleted) {
      console.log(`[RoomManager] Room deleted: ${roomId}`);
    }
    return deleted;
  }

  /**
   * 방 가져오기
   */
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * 모든 방 가져오기
   */
  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  /**
   * 공개 방 목록 가져오기
   */
  getPublicRooms() {
    return this.getAllRooms()
      .filter(room => !room.isPrivate && room.gameState === 'waiting')
      .map(room => room.toListJSON());
  }

  /**
   * 플레이어의 방 찾기
   */
  findPlayerRoom(playerId) {
    for (const room of this.rooms.values()) {
      if (room.players.has(playerId)) {
        return room;
      }
    }
    return null;
  }

  /**
   * 빈 방 정리
   */
  cleanupEmptyRooms() {
    let cleaned = 0;
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.isEmpty()) {
        this.deleteRoom(roomId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[RoomManager] Cleaned up ${cleaned} empty rooms`);
    }
    return cleaned;
  }

  /**
   * 방 ID 생성
   */
  generateRoomId() {
    // 4자리 숫자 코드 생성
    return String(this.roomIdCounter++).padStart(4, '0');
  }

  /**
   * 방 개수
   */
  getRoomCount() {
    return this.rooms.size;
  }

  /**
   * 전체 플레이어 수
   */
  getTotalPlayerCount() {
    let total = 0;
    for (const room of this.rooms.values()) {
      total += room.getPlayerCount();
    }
    return total;
  }

  /**
   * 통계 정보
   */
  getStats() {
    return {
      totalRooms: this.getRoomCount(),
      totalPlayers: this.getTotalPlayerCount(),
      publicRooms: this.getPublicRooms().length
    };
  }
}

module.exports = RoomManager;

/**
 * Player.js
 * 플레이어 정보 관리 클래스
 */

class Player {
  constructor(socketId, data = {}) {
    this.id = socketId;
    this.name = data.name || 'Player';
    this.character = data.character || 'BlueSoldier_Female';
    this.ready = false;
    this.roomId = null;

    // 게임 내 상태
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.health = 100;
    this.kills = 0;
    this.deaths = 0;

    this.isAlive = true;
    this.joinedAt = Date.now();
  }

  /**
   * 준비 상태 토글
   */
  toggleReady() {
    this.ready = !this.ready;
    return this.ready;
  }

  /**
   * 준비 상태 설정
   */
  setReady(ready) {
    this.ready = ready;
  }

  /**
   * 방 입장
   */
  joinRoom(roomId) {
    this.roomId = roomId;
    this.ready = false;
  }

  /**
   * 방 퇴장
   */
  leaveRoom() {
    this.roomId = null;
    this.ready = false;
  }

  /**
   * 캐릭터 변경
   */
  setCharacter(character) {
    this.character = character;
  }

  /**
   * 이름 변경
   */
  setName(name) {
    this.name = name;
  }

  /**
   * 위치 업데이트
   */
  updatePosition(position) {
    this.position = { ...this.position, ...position };
  }

  /**
   * 회전 업데이트
   */
  updateRotation(rotation) {
    this.rotation = { ...this.rotation, ...rotation };
  }

  /**
   * 체력 설정
   */
  setHealth(health) {
    this.health = Math.max(0, Math.min(100, health));
    this.isAlive = this.health > 0;
    return this.health;
  }

  /**
   * 데미지 받기
   */
  takeDamage(damage) {
    return this.setHealth(this.health - damage);
  }

  /**
   * 회복
   */
  heal(amount) {
    return this.setHealth(this.health + amount);
  }

  /**
   * 킬 추가
   */
  addKill() {
    this.kills++;
  }

  /**
   * 데스 추가
   */
  addDeath() {
    this.deaths++;
  }

  /**
   * 리스폰
   */
  respawn() {
    this.health = 100;
    this.isAlive = true;
    this.position = { x: 0, y: 0, z: 0 };
  }

  /**
   * 게임 상태 초기화
   */
  resetGameState() {
    this.health = 100;
    this.kills = 0;
    this.deaths = 0;
    this.isAlive = true;
    this.ready = false;
  }

  /**
   * 플레이어 정보 (클라이언트용)
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      character: this.character,
      ready: this.ready,
      roomId: this.roomId,
      position: this.position,
      rotation: this.rotation,
      health: this.health,
      kills: this.kills,
      deaths: this.deaths,
      isAlive: this.isAlive
    };
  }

  /**
   * 로비용 간단한 정보
   */
  toLobbyJSON() {
    return {
      id: this.id,
      name: this.name,
      character: this.character,
      ready: this.ready
    };
  }
}

module.exports = Player;

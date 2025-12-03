/**
 * SocketManager.js
 * Socket.io 통신 관리 모듈
 */

export class SocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.eventHandlers = {};
  }

  /**
   * 소켓 연결
   */
  connect(url = '') {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(url);

        this.socket.on('connect', () => {
          this.connected = true;
          console.log('Socket connected:', this.socket.id);
          resolve(this.socket);
        });

        this.socket.on('disconnect', () => {
          this.connected = false;
          console.log('Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          reject(error);
        });

      } catch (error) {
        console.error('Socket initialization error:', error);
        reject(error);
      }
    });
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);

    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  /**
   * 이벤트 리스너 제거
   */
  off(event, handler) {
    if (this.socket) {
      this.socket.off(event, handler);
    }

    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
  }

  /**
   * 이벤트 전송
   */
  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit:', event);
    }
  }

  /**
   * 이벤트 전송 및 응답 대기
   */
  emitWithAck(event, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      this.socket.emit(event, data, (response) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
  }

  /**
   * 소켓 연결 해제
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * 연결 상태 확인
   */
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  /**
   * 소켓 ID 가져오기
   */
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}

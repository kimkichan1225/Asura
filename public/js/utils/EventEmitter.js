/**
 * EventEmitter.js
 * 이벤트 발행/구독 패턴 구현
 */

export class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  /**
   * 일회성 이벤트 리스너 등록
   */
  once(event, listener) {
    const onceWrapper = (...args) => {
      listener.apply(this, args);
      this.off(event, onceWrapper);
    };
    return this.on(event, onceWrapper);
  }

  /**
   * 이벤트 리스너 제거
   */
  off(event, listenerToRemove) {
    if (!this.events[event]) {
      return this;
    }

    this.events[event] = this.events[event].filter(
      listener => listener !== listenerToRemove
    );

    return this;
  }

  /**
   * 이벤트 발행
   */
  emit(event, ...args) {
    if (!this.events[event]) {
      return false;
    }

    this.events[event].forEach(listener => {
      try {
        listener.apply(this, args);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });

    return true;
  }

  /**
   * 모든 이벤트 리스너 제거
   */
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }

  /**
   * 이벤트 리스너 개수 조회
   */
  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }
}

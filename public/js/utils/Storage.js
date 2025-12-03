/**
 * Storage.js
 * 로컬 스토리지 관리 유틸리티
 */

export class Storage {
  /**
   * 값 저장
   */
  static set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  }

  /**
   * 값 가져오기
   */
  static get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return defaultValue;
    }
  }

  /**
   * 값 제거
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
      return false;
    }
  }

  /**
   * 모든 값 제거
   */
  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * 키 존재 여부 확인
   */
  static has(key) {
    return localStorage.getItem(key) !== null;
  }

  /**
   * 모든 키 가져오기
   */
  static keys() {
    return Object.keys(localStorage);
  }

  /**
   * 특정 접두사로 시작하는 모든 키 가져오기
   */
  static keysWithPrefix(prefix) {
    return Object.keys(localStorage).filter(key => key.startsWith(prefix));
  }

  /**
   * 특정 접두사로 시작하는 모든 항목 제거
   */
  static removeWithPrefix(prefix) {
    const keys = this.keysWithPrefix(prefix);
    keys.forEach(key => this.remove(key));
    return keys.length;
  }
}

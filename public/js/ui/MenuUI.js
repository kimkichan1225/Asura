/**
 * MenuUI.js
 * 메인 메뉴 UI 관리 모듈
 */

export class MenuUI {
  constructor() {
    this.elements = {
      menu: document.getElementById('menu'),
      createRoomButton: document.getElementById('createRoomButton'),
      joinRoomButton: document.getElementById('joinRoomButton'),
      settingsButton: document.getElementById('settingsButton')
    };

    this.callbacks = {
      onCreateRoom: null,
      onJoinRoom: null,
      onSettings: null
    };

    this.init();
  }

  /**
   * 초기화
   */
  init() {
    this.attachEventListeners();
  }

  /**
   * 이벤트 리스너 연결
   */
  attachEventListeners() {
    this.elements.createRoomButton.addEventListener('click', () => {
      this.handleButtonClick(this.elements.createRoomButton, () => {
        if (this.callbacks.onCreateRoom) {
          this.callbacks.onCreateRoom();
        }
      });
    });

    this.elements.joinRoomButton.addEventListener('click', () => {
      this.handleButtonClick(this.elements.joinRoomButton, () => {
        if (this.callbacks.onJoinRoom) {
          this.callbacks.onJoinRoom();
        }
      });
    });

    this.elements.settingsButton.addEventListener('click', () => {
      this.handleButtonClick(this.elements.settingsButton, () => {
        if (this.callbacks.onSettings) {
          this.callbacks.onSettings();
        }
      });
    });
  }

  /**
   * 버튼 클릭 처리
   */
  handleButtonClick(button, callback) {
    button.classList.add('loading');

    setTimeout(() => {
      button.classList.remove('loading');
      if (callback) callback();
    }, 500);
  }

  /**
   * 콜백 등록
   */
  onCreateRoom(callback) {
    this.callbacks.onCreateRoom = callback;
    return this;
  }

  onJoinRoom(callback) {
    this.callbacks.onJoinRoom = callback;
    return this;
  }

  onSettings(callback) {
    this.callbacks.onSettings = callback;
    return this;
  }

  /**
   * 메뉴 표시
   */
  show() {
    this.elements.menu.style.display = 'flex';
  }

  /**
   * 메뉴 숨기기
   */
  hide() {
    this.elements.menu.style.display = 'none';
  }

  /**
   * 버튼 활성화/비활성화
   */
  setButtonEnabled(buttonName, enabled) {
    const button = this.elements[buttonName + 'Button'];
    if (button) {
      button.disabled = !enabled;
      button.style.opacity = enabled ? '1' : '0.5';
      button.style.cursor = enabled ? 'pointer' : 'not-allowed';
    }
  }
}

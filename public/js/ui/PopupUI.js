/**
 * PopupUI.js
 * 팝업 UI 관리 모듈 (방 생성, 방 참가, 설정 등)
 */

export class PopupUI {
  constructor() {
    this.popups = {};
    this.currentPopup = null;
  }

  /**
   * 팝업 생성
   */
  createPopup(id, config) {
    // 기존 팝업이 있다면 제거
    if (this.popups[id]) {
      this.remove(id);
    }

    const popup = document.createElement('div');
    popup.id = id;
    popup.className = 'popup-overlay';
    popup.style.display = 'none';

    const content = document.createElement('div');
    content.className = 'popup-content';

    // 타이틀
    if (config.title) {
      const title = document.createElement('h2');
      title.textContent = config.title;
      content.appendChild(title);
    }

    // 컨텐츠
    if (config.content) {
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = config.content;
      content.appendChild(contentDiv);
    }

    // 버튼들
    if (config.buttons) {
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'popup-buttons';

      config.buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.text;
        button.className = btn.className || 'popup-button';
        button.addEventListener('click', () => {
          if (btn.callback) btn.callback();
          if (btn.closeOnClick !== false) this.close(id);
        });
        buttonContainer.appendChild(button);
      });

      content.appendChild(buttonContainer);
    }

    popup.appendChild(content);
    document.body.appendChild(popup);

    this.popups[id] = popup;

    // 오버레이 클릭시 닫기
    popup.addEventListener('click', (e) => {
      if (e.target === popup && config.closeOnOverlay !== false) {
        this.close(id);
      }
    });

    return popup;
  }

  /**
   * 팝업 열기
   */
  open(id) {
    if (this.popups[id]) {
      this.popups[id].style.display = 'flex';
      this.currentPopup = id;
    }
  }

  /**
   * 팝업 닫기
   */
  close(id) {
    if (this.popups[id]) {
      this.popups[id].style.display = 'none';
      if (this.currentPopup === id) {
        this.currentPopup = null;
      }
    }
  }

  /**
   * 모든 팝업 닫기
   */
  closeAll() {
    Object.keys(this.popups).forEach(id => {
      this.close(id);
    });
  }

  /**
   * 팝업 제거
   */
  remove(id) {
    if (this.popups[id]) {
      this.popups[id].remove();
      delete this.popups[id];
    }
  }

  /**
   * 팝업 가져오기
   */
  get(id) {
    return this.popups[id];
  }
}

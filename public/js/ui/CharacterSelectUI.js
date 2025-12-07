/**
 * CharacterSelectUI.js
 * 캐릭터 선택 UI 모듈
 */

import { Config } from '../utils/Config.js';

export class CharacterSelectUI {
  constructor() {
    this.selectedCharacter = null;
    this.characters = Config.CHARACTERS.CHARACTER_LIST;

    this.previewScene = null;
    this.onSelectCallback = null;
  }

  /**
   * 캐릭터 선택 팝업 생성
   */
  create() {
    const popup = document.createElement('div');
    popup.id = 'characterSelectPopup';
    popup.className = 'popup-overlay';
    popup.style.display = 'none';

    popup.innerHTML = `
      <div class="character-select-container">
        <!-- 캐릭터 그리드 -->
        <div class="character-grid-wrapper">
          <h2>캐릭터 선택</h2>
          <div class="character-grid">
            ${this.characters.map(char => `
              <div class="character-card" data-character-id="${char.id}">
                <img src="${char.image}" alt="${char.name}">
                <div class="character-card-name">${char.name}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 미리보기 패널 -->
        <div class="character-preview-panel">
          <div class="preview-3d-container" id="characterPreview3D">
            <canvas id="characterPreviewCanvas"></canvas>
          </div>
          <div class="preview-info">
            <h3 id="previewCharacterName">캐릭터를 선택하세요</h3>
            <div class="nickname-input-container">
              <label>닉네임:</label>
              <input type="text" id="nicknameInput" placeholder="닉네임을 입력하세요" maxlength="12">
            </div>
            <div class="preview-buttons">
              <button class="character-select-btn primary" id="confirmCharacterBtn">선택</button>
              <button class="character-select-btn" id="cancelCharacterBtn">취소</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(popup);
    this.attachEventListeners();
    this.init3DPreview();

    return popup;
  }

  /**
   * 이벤트 리스너 연결
   */
  attachEventListeners() {
    // 캐릭터 카드 클릭
    const characterCards = document.querySelectorAll('.character-card');
    characterCards.forEach(card => {
      card.addEventListener('click', () => {
        const characterId = card.dataset.characterId;
        this.selectCharacter(characterId);
      });
    });

    // 확인 버튼
    const confirmBtn = document.getElementById('confirmCharacterBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.confirm();
      });
    }

    // 취소 버튼
    const cancelBtn = document.getElementById('cancelCharacterBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // Enter 키로 확인
    const nicknameInput = document.getElementById('nicknameInput');
    if (nicknameInput) {
      nicknameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.confirm();
        }
      });
    }
  }

  /**
   * 3D 미리보기 초기화
   */
  init3DPreview() {
    const canvas = document.getElementById('characterPreviewCanvas');
    if (!canvas) return;

    // Three.js 씬 설정
    this.previewScene = {
      scene: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(60, 1, 0.1, 1000),
      renderer: new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }),
      mixer: null,
      currentModel: null,
      controls: null
    };

    const { scene, camera, renderer } = this.previewScene;

    // 렌더러 설정
    renderer.setSize(400, 400);
    renderer.setPixelRatio(window.devicePixelRatio);

    // 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(directionalLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
    frontLight.position.set(0, 1, 2);
    scene.add(frontLight);

    // 카메라 위치
    camera.position.set(0, 1, 2.5);
    camera.lookAt(0, 1, 0);

    // OrbitControls
    this.previewScene.controls = new THREE.OrbitControls(camera, renderer.domElement);
    this.previewScene.controls.enablePan = false;
    this.previewScene.controls.enableZoom = false;
    this.previewScene.controls.enableRotate = true;
    this.previewScene.controls.enableDamping = true;
    this.previewScene.controls.dampingFactor = 0.05;
    this.previewScene.controls.rotateSpeed = 0.5;
    this.previewScene.controls.minPolarAngle = Math.PI / 2;
    this.previewScene.controls.maxPolarAngle = Math.PI / 2;

    // 애니메이션 루프
    this.animate();

    // 첫 번째 캐릭터 자동 선택
    if (this.characters.length > 0) {
      this.selectCharacter(this.characters[0].id);
    }
  }

  /**
   * 애니메이션 루프
   */
  animate() {
    if (!this.previewScene) return;

    requestAnimationFrame(() => this.animate());

    if (this.previewScene.mixer) {
      this.previewScene.mixer.update(0.016);
    }

    if (this.previewScene.controls) {
      this.previewScene.controls.update();
    }

    this.previewScene.renderer.render(this.previewScene.scene, this.previewScene.camera);
  }

  /**
   * 캐릭터 선택
   */
  selectCharacter(characterId) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) return;

    this.selectedCharacter = character;

    // UI 업데이트
    document.querySelectorAll('.character-card').forEach(card => {
      card.classList.remove('selected');
    });

    const selectedCard = document.querySelector(`[data-character-id="${characterId}"]`);
    if (selectedCard) {
      selectedCard.classList.add('selected');
    }

    // 이름 업데이트
    const nameElement = document.getElementById('previewCharacterName');
    if (nameElement) {
      nameElement.textContent = character.name;
    }

    // 3D 모델 로드
    this.load3DModel(character.model || character.glb);
  }

  /**
   * 3D 모델 로드
   */
  load3DModel(glbPath) {
    if (!this.previewScene) return;

    const { scene, currentModel, mixer } = this.previewScene;

    // 이전 모델 제거
    if (currentModel) {
      currentModel.traverse((object) => {
        if (object.isMesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      scene.remove(currentModel);
    }

    if (mixer) {
      mixer.stopAllAction();
    }

    // 새 모델 로드
    const loader = new THREE.GLTFLoader();
    loader.load(
      glbPath,
      (gltf) => {
        this.previewScene.currentModel = gltf.scene;
        scene.add(gltf.scene);

        // 모델 크기 및 위치 조정
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());

        gltf.scene.position.sub(center);
        gltf.scene.scale.set(3.0 / size, 3.0 / size, 3.0 / size);
        gltf.scene.position.y = -1.25;

        // 애니메이션
        if (gltf.animations && gltf.animations.length) {
          this.previewScene.mixer = new THREE.AnimationMixer(gltf.scene);
          const victoryAnim = gltf.animations.find(anim => anim.name.toLowerCase().includes('victory'));
          if (victoryAnim) {
            const action = this.previewScene.mixer.clipAction(victoryAnim);
            action.play();
          }
        }
      },
      undefined,
      (error) => {
        console.error('Failed to load 3D model:', error);
      }
    );
  }

  /**
   * 선택 확인
   */
  confirm() {
    const nickname = document.getElementById('nicknameInput')?.value.trim();

    if (!nickname) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    if (!this.selectedCharacter) {
      alert('캐릭터를 선택해주세요.');
      return;
    }

    if (this.onSelectCallback) {
      this.onSelectCallback({
        character: this.selectedCharacter.id,
        nickname: nickname
      });
    }

    // close()는 서버 응답 후 main.js에서 호출됨
  }

  /**
   * 팝업 열기
   */
  open() {
    const popup = document.getElementById('characterSelectPopup');
    if (popup) {
      popup.style.display = 'flex';
    }

    // 닉네임 입력창에 포커스
    setTimeout(() => {
      const nicknameInput = document.getElementById('nicknameInput');
      if (nicknameInput) {
        nicknameInput.focus();
      }
    }, 100);
  }

  /**
   * 팝업 닫기
   */
  close() {
    const popup = document.getElementById('characterSelectPopup');
    if (popup) {
      popup.style.display = 'none';
    }

    // 3D 리소스 정리
    if (this.previewScene && this.previewScene.currentModel) {
      this.previewScene.scene.remove(this.previewScene.currentModel);
      this.previewScene.currentModel = null;
    }
  }

  /**
   * 선택 콜백 등록
   */
  onSelect(callback) {
    this.onSelectCallback = callback;
    return this;
  }

  /**
   * 정리
   */
  destroy() {
    this.close();
    const popup = document.getElementById('characterSelectPopup');
    if (popup) {
      popup.remove();
    }
  }
}

/**
 * GameScene.js
 * 게임 씬 관리 - 맵과 캐릭터 로드
 */

import { Config } from '../utils/Config.js';
import { PlayerController } from './PlayerController.js';
import { ThirdPersonCamera } from './ThirdPersonCamera.js';

// Three.js는 CDN으로 전역 로드됨
const THREE = window.THREE;
const GLTFLoader = window.THREE.GLTFLoader;

export class GameScene {
  constructor(socket) {
    this.socket = socket; // Socket.io 인스턴스
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.container = null;
    this.gltfLoader = new GLTFLoader();

    this.mapModel = null;
    this.players = new Map(); // playerId -> player object
    this.localPlayer = null; // 로컬 플레이어
    this.playerController = null; // 플레이어 컨트롤러
    this.thirdPersonCamera = null; // 3인칭 카메라
    this.animationId = null;

    // 로딩 상태
    this.totalLoadItems = 0;
    this.loadedItems = 0;

    // 네트워크 이벤트 등록
    this.initNetworkEvents();
  }

  /**
   * 네트워크 이벤트 초기화
   */
  initNetworkEvents() {
    if (!this.socket) return;

    // 다른 플레이어 움직임 수신
    this.socket.on('playerMoved', (data) => {
      this.onPlayerMoved(data);
    });

    console.log('[GameScene] Network events initialized');
  }

  /**
   * 씬 초기화
   */
  init(containerElement) {
    this.container = containerElement;

    // 씬 생성
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // 하늘색 배경

    // 카메라 설정
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // 렌더러 설정
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 조명 추가
    this.addLights();

    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', () => this.onWindowResize());

    console.log('[GameScene] Scene initialized');
  }

  /**
   * 조명 추가
   */
  addLights() {
    // 환경광 (밝기 증가)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    // 방향광 (태양) - 밝기 증가
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // 추가 보조 조명 (뒷면도 밝게)
    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(-10, 10, -10);
    this.scene.add(backLight);
  }

  /**
   * 맵 로드
   */
  async loadMap(mapId) {
    console.log('[GameScene] Loading map:', mapId);

    // 기존 맵 제거
    if (this.mapModel) {
      this.scene.remove(this.mapModel);
      this.mapModel = null;
    }

    // 맵 정보 찾기
    const mapInfo = Config.MAPS.MAP_LIST.find(m => m.id === mapId);
    if (!mapInfo) {
      console.error('[GameScene] Map not found:', mapId);
      return;
    }

    try {
      const gltf = await this.loadGLTF(mapInfo.model);
      this.mapModel = gltf.scene;

      // 그림자 설정
      this.mapModel.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      this.scene.add(this.mapModel);
      this.updateLoadingProgress(`맵 로드 완료: ${mapInfo.name}`);
      console.log('[GameScene] Map loaded:', mapId);
    } catch (error) {
      console.error('[GameScene] Failed to load map:', error);
    }
  }

  /**
   * 플레이어 캐릭터 로드
   */
  async loadPlayer(playerId, characterId, position = { x: 0, y: 0, z: 0 }, isLocal = false) {
    console.log('[GameScene] Loading player:', playerId, characterId, 'isLocal:', isLocal);

    // 이미 로드된 플레이어면 제거
    if (this.players.has(playerId)) {
      this.removePlayer(playerId);
    }

    // 캐릭터 정보 찾기
    const character = Config.CHARACTERS.CHARACTER_LIST.find(c => c.id === characterId);
    if (!character) {
      console.error('[GameScene] Character not found:', characterId);
      return;
    }

    try {
      const gltf = await this.loadGLTF(character.model);
      const playerModel = gltf.scene;

      // 위치 설정
      playerModel.position.set(position.x, position.y, position.z);

      // 그림자 설정
      playerModel.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      // 애니메이션 믹서 설정
      const mixer = gltf.animations.length > 0 ? new THREE.AnimationMixer(playerModel) : null;
      let currentAction = null;

      if (mixer && gltf.animations.length > 0) {
        // Idle 애니메이션 찾기
        const idleClip = gltf.animations.find(clip =>
          clip.name.toLowerCase().includes('idle')
        );

        // Idle 애니메이션이 있으면 재생, 없으면 첫 번째 애니메이션 재생
        const clipToPlay = idleClip || gltf.animations[0];
        currentAction = mixer.clipAction(clipToPlay);
        currentAction.play();

        console.log(`[GameScene] Playing animation: ${clipToPlay.name} for player ${playerId}`);
      }

      // 플레이어 데이터 저장
      const playerData = {
        model: playerModel,
        mixer: mixer,
        characterId: characterId,
        currentAction: currentAction,
        animations: gltf.animations,
        isLocal: isLocal
      };

      this.players.set(playerId, playerData);

      // 로컬 플레이어인 경우 컨트롤러 및 카메라 생성
      if (isLocal) {
        this.localPlayer = playerData;
        this.thirdPersonCamera = new ThirdPersonCamera(this.camera, playerData.model);
        this.playerController = new PlayerController(playerData, this.camera, this.thirdPersonCamera, this.socket);
        console.log('[GameScene] PlayerController and ThirdPersonCamera created for local player');
      }

      this.scene.add(playerModel);
      this.updateLoadingProgress(`플레이어 로드: ${character.name}`);
      console.log('[GameScene] Player loaded:', playerId);
    } catch (error) {
      console.error('[GameScene] Failed to load player:', error);
    }
  }

  /**
   * 플레이어 제거
   */
  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      this.scene.remove(player.model);
      this.players.delete(playerId);
      console.log('[GameScene] Player removed:', playerId);
    }
  }

  /**
   * 로딩 진행률 업데이트
   */
  updateLoadingProgress(text = '로딩 중...') {
    this.loadedItems++;
    const percent = Math.floor((this.loadedItems / this.totalLoadItems) * 100);

    const loadingText = document.getElementById('loadingText');
    const loadingPercent = document.getElementById('loadingPercent');
    const loadingProgress = document.getElementById('loadingProgress');

    if (loadingText) loadingText.textContent = text;
    if (loadingPercent) loadingPercent.textContent = `${percent}%`;
    if (loadingProgress) loadingProgress.style.width = `${percent}%`;

    console.log(`[GameScene] Loading: ${percent}% - ${text}`);
  }

  /**
   * GLTF 파일 로드 (Promise)
   */
  loadGLTF(url) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => resolve(gltf),
        (progress) => {
          // 개별 파일 로딩 진행률은 무시 (전체 아이템 기준으로만 표시)
        },
        (error) => reject(error)
      );
    });
  }

  /**
   * 애니메이션 루프 시작
   */
  startRenderLoop() {
    const clock = new THREE.Clock();

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // 로컬 플레이어 컨트롤러 업데이트
      if (this.playerController) {
        this.playerController.update(delta);
      }

      // 3인칭 카메라 업데이트
      if (this.thirdPersonCamera) {
        this.thirdPersonCamera.update();
      }

      // 원격 플레이어 애니메이션 업데이트 (로컬 플레이어는 컨트롤러에서 처리됨)
      this.players.forEach((player, playerId) => {
        if (!player.isLocal && player.mixer) {
          player.mixer.update(delta);
        }
      });

      this.renderer.render(this.scene, this.camera);
    };

    animate();
    console.log('[GameScene] Render loop started');
  }

  /**
   * 애니메이션 루프 중지
   */
  stopRenderLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      console.log('[GameScene] Render loop stopped');
    }
  }

  /**
   * 다른 플레이어 움직임 수신 처리
   */
  onPlayerMoved(data) {
    const player = this.players.get(data.playerId);
    if (!player || player.isLocal) return; // 로컬 플레이어는 무시

    // 위치 업데이트
    if (data.position) {
      player.model.position.set(data.position.x, data.position.y, data.position.z);
    }

    // 회전 업데이트
    if (data.rotation) {
      player.model.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
    }

    // 애니메이션 업데이트
    if (data.animation && player.animations && player.mixer) {
      // 정확한 이름으로 먼저 찾기
      let clip = player.animations.find(anim => anim.name === data.animation);

      // 없으면 부분 매칭
      if (!clip) {
        clip = player.animations.find(anim =>
          anim.name.toLowerCase().includes(data.animation.toLowerCase())
        );
      }

      if (clip) {
        // 현재 애니메이션과 다르면 변경
        if (!player.currentAction || player.currentAction.getClip().name !== clip.name) {
          if (player.currentAction) {
            player.currentAction.fadeOut(0.3);
          }
          player.currentAction = player.mixer.clipAction(clip);
          player.currentAction.reset().fadeIn(0.3).play();

          console.log(`[GameScene] Remote player ${data.playerId} animation: ${clip.name}`);
        }
      } else {
        console.warn(`[GameScene] Animation not found for remote player: ${data.animation}`);
        console.log('[GameScene] Available animations:', player.animations.map(a => a.name));
      }
    }
  }

  /**
   * 윈도우 리사이즈 처리
   */
  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;

    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  /**
   * 씬 정리
   */
  dispose() {
    this.stopRenderLoop();

    // 플레이어 제거
    this.players.forEach((player, playerId) => {
      this.removePlayer(playerId);
    });

    // 맵 제거
    if (this.mapModel) {
      this.scene.remove(this.mapModel);
      this.mapModel = null;
    }

    // 렌더러 제거
    if (this.renderer) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
      this.renderer = null;
    }

    console.log('[GameScene] Scene disposed');
  }
}

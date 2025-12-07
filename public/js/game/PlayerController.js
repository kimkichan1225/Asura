/**
 * PlayerController.js
 * 플레이어 캐릭터 조작 및 제어
 */

const THREE = window.THREE;

export class PlayerController {
  constructor(player, camera, thirdPersonCamera, socket) {
    this.player = player; // { model, mixer, characterId, currentAction, animations }
    this.camera = camera;
    this.thirdPersonCamera = thirdPersonCamera; // ThirdPersonCamera 인스턴스
    this.socket = socket; // Socket.io 인스턴스

    // 이동 관련
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.speed = 5; // 걷기 속도
    this.runSpeed = 10; // 달리기 속도

    // 네트워크 동기화
    this.lastSyncTime = 0;
    this.syncInterval = 1000 / 30; // 30Hz (초당 30번 전송)

    // 점프 관련
    this.jumpPower = 12;
    this.gravity = -30;
    this.isJumping = false;
    this.velocityY = 0;

    // 대쉬 관련
    this.isDashing = false;
    this.dashDuration = 0.5;
    this.dashTimer = 0;
    this.dashSpeed = 18;
    this.dashDirection = new THREE.Vector3(0, 0, 0);
    this.dashCooldown = 1.0;
    this.dashCooldownTimer = 0;

    // 공격 관련
    this.isAttacking = false;
    this.attackCooldown = 0.5;
    this.attackCooldownTimer = 0;

    // 키 입력 상태
    this.keys = {
      forward: false,  // W
      backward: false, // S
      left: false,     // A
      right: false,    // D
      shift: false,    // Shift (달리기)
      jump: false,     // K (점프)
      attack: false,   // J (공격)
      dash: false      // L (대쉬)
    };

    // 현재 애니메이션 (실제 클립 이름으로 초기화)
    this.currentAnimationName = 'Idle';

    // 초기 애니메이션 클립 이름 설정
    if (this.player.currentAction) {
      this.currentAnimationName = this.player.currentAction.getClip().name;
    }

    // 입력 초기화
    this.initInput();

    console.log('[PlayerController] Initialized with animation:', this.currentAnimationName);
  }

  /**
   * 키보드 입력 초기화
   */
  initInput() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e), false);
    window.addEventListener('keyup', (e) => this.onKeyUp(e), false);
  }

  /**
   * 키 다운 이벤트
   */
  onKeyDown(event) {
    switch (event.code) {
      case 'KeyW':
        this.keys.forward = true;
        break;
      case 'KeyS':
        this.keys.backward = true;
        break;
      case 'KeyA':
        this.keys.left = true;
        break;
      case 'KeyD':
        this.keys.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.shift = true;
        break;
      case 'KeyK':
        // 점프
        if (!this.isJumping && !this.isDashing) {
          this.isJumping = true;
          this.velocityY = this.jumpPower;
          this.setAnimation('Jump');
        }
        break;
      case 'KeyJ':
        // 공격
        if (!this.isAttacking && !this.isJumping && !this.isDashing && this.attackCooldownTimer <= 0) {
          this.playAttackAnimation();
        }
        break;
      case 'KeyL':
        // 대쉬
        if (!this.isJumping && !this.isDashing && this.dashCooldownTimer <= 0) {
          this.startDash();
        }
        break;
    }
  }

  /**
   * 키 업 이벤트
   */
  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
        this.keys.forward = false;
        break;
      case 'KeyS':
        this.keys.backward = false;
        break;
      case 'KeyA':
        this.keys.left = false;
        break;
      case 'KeyD':
        this.keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.shift = false;
        break;
    }
  }

  /**
   * 대쉬 시작
   */
  startDash() {
    // 공격 중일 경우 공격 취소
    if (this.isAttacking) {
      this.isAttacking = false;
      if (this.player.currentAction) {
        this.player.currentAction.fadeOut(0.1);
      }
    }

    this.isDashing = true;
    this.dashTimer = this.dashDuration;

    // 대쉬 방향 계산
    const moveDir = new THREE.Vector3();
    if (this.keys.forward) moveDir.z -= 1;
    if (this.keys.backward) moveDir.z += 1;
    if (this.keys.left) moveDir.x -= 1;
    if (this.keys.right) moveDir.x += 1;

    // 입력이 없으면 현재 바라보는 방향으로 대쉬
    if (moveDir.lengthSq() === 0) {
      this.player.model.getWorldDirection(moveDir);
      moveDir.y = 0;
      moveDir.normalize();
    } else {
      moveDir.normalize();
      // ThirdPersonCamera의 회전 각도 사용
      const rotationAngle = this.thirdPersonCamera ? this.thirdPersonCamera.getRotationAngle() : 0;
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationAngle);
    }

    this.dashDirection.copy(moveDir);
    this.setAnimation('Roll'); // Roll 애니메이션을 대쉬로 사용
    this.dashCooldownTimer = this.dashCooldown;

    console.log('[PlayerController] Dash started');
  }

  /**
   * 공격 애니메이션 재생
   */
  playAttackAnimation() {
    this.isAttacking = true;
    this.attackCooldownTimer = this.attackCooldown;

    // 기본 공격 애니메이션 찾기
    let attackAnim = this.findAnimation(['SwordAttack', 'Attack', 'Punch']);
    if (!attackAnim) {
      attackAnim = 'Idle'; // fallback
    }

    this.setAnimation(attackAnim);

    // 공격 애니메이션이 끝나면 isAttacking을 false로 설정
    const action = this.player.animations.find(clip =>
      clip.name.toLowerCase().includes(attackAnim.toLowerCase())
    );

    if (action && this.player.mixer) {
      const clipAction = this.player.mixer.clipAction(action);
      clipAction.setLoop(THREE.LoopOnce);
      clipAction.clampWhenFinished = true;
      clipAction.timeScale = 1.5;

      const onFinished = (e) => {
        if (e.action === clipAction) {
          this.isAttacking = false;
          const isMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
          const isRunning = isMoving && this.keys.shift;
          this.setAnimation(isMoving ? (isRunning ? 'Run' : 'Walk') : 'Idle');
          this.player.mixer.removeEventListener('finished', onFinished);
        }
      };

      this.player.mixer.addEventListener('finished', onFinished);
    }

    console.log('[PlayerController] Attack: ' + attackAnim);
  }

  /**
   * 애니메이션 찾기
   */
  findAnimation(keywords) {
    for (const keyword of keywords) {
      const found = this.player.animations.find(clip =>
        clip.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (found) return found.name;
    }
    return null;
  }

  /**
   * 애니메이션 설정
   */
  setAnimation(name) {
    // 공격 중에는 다른 애니메이션 재생 방지
    if (this.isAttacking && !name.toLowerCase().includes('attack') && !name.toLowerCase().includes('punch')) {
      return;
    }

    // 같은 애니메이션이면 무시
    if (this.currentAnimationName === name) return;

    // 애니메이션 찾기
    const clip = this.player.animations.find(anim =>
      anim.name.toLowerCase().includes(name.toLowerCase())
    );

    if (!clip) {
      console.warn(`[PlayerController] Animation not found: ${name}`);
      return;
    }

    // 실제 클립 이름 저장 (동기화용)
    this.currentAnimationName = clip.name;

    // 현재 애니메이션 페이드 아웃
    if (this.player.currentAction) {
      this.player.currentAction.fadeOut(0.3);
    }

    // 새 애니메이션 재생
    const newAction = this.player.mixer.clipAction(clip);
    newAction.reset().fadeIn(0.3).play();

    // 점프/대쉬 애니메이션 특수 설정
    if (name === 'Jump') {
      newAction.setLoop(THREE.LoopOnce);
      newAction.clampWhenFinished = true;
    } else if (name === 'Roll') {
      newAction.setLoop(THREE.LoopOnce);
      newAction.clampWhenFinished = true;
      newAction.timeScale = 1.2;
    }

    this.player.currentAction = newAction;

    console.log(`[PlayerController] Animation changed: ${name} (clip: ${clip.name})`);
  }

  /**
   * 업데이트 (매 프레임마다 호출)
   */
  update(timeElapsed) {
    if (!this.player.model || !this.player.mixer) return;

    // 쿨다운 타이머 감소
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= timeElapsed;
    }
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= timeElapsed;
    }

    // 애니메이션 믹서 업데이트
    this.player.mixer.update(timeElapsed);

    // 이동 처리
    let velocity = new THREE.Vector3();

    // 대쉬 중일 때
    if (this.isDashing) {
      this.dashTimer -= timeElapsed;
      velocity.copy(this.dashDirection).multiplyScalar(this.dashSpeed * timeElapsed);

      if (this.dashTimer <= 0) {
        this.isDashing = false;
        const isMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
        const isRunning = isMoving && this.keys.shift;
        this.setAnimation(isMoving ? (isRunning ? 'Run' : 'Walk') : 'Idle');
      }
    }
    // 일반 이동
    else if (!this.isAttacking) {
      const forward = new THREE.Vector3(0, 0, -1);
      const right = new THREE.Vector3(1, 0, 0);

      if (this.keys.forward) velocity.add(forward);
      if (this.keys.backward) velocity.sub(forward);
      if (this.keys.left) velocity.sub(right);
      if (this.keys.right) velocity.add(right);

      // 카메라 방향 기준으로 회전
      if (velocity.lengthSq() > 0) {
        // ThirdPersonCamera의 회전 각도 사용
        const rotationAngle = this.thirdPersonCamera ? this.thirdPersonCamera.getRotationAngle() : 0;
        velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationAngle);

        // 캐릭터 회전
        const moveAngle = Math.atan2(velocity.x, velocity.z);
        const targetQuaternion = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), moveAngle
        );
        this.player.model.quaternion.slerp(targetQuaternion, 0.3);

        // 속도 적용
        const isMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
        const isRunning = isMoving && this.keys.shift;
        const moveSpeed = isRunning ? this.runSpeed : this.speed;
        velocity.normalize().multiplyScalar(moveSpeed * timeElapsed);

        // 애니메이션 설정
        this.setAnimation(isRunning ? 'Run' : 'Walk');
      } else {
        // 정지 상태
        if (!this.isJumping && !this.isAttacking) {
          this.setAnimation('Idle');
        }
      }
    }

    // 중력 및 점프
    this.velocityY += this.gravity * timeElapsed;

    // 위치 업데이트
    this.player.model.position.x += velocity.x;
    this.player.model.position.z += velocity.z;
    this.player.model.position.y += this.velocityY * timeElapsed;

    // 바닥 체크 (임시로 Y = 0을 바닥으로 설정)
    if (this.player.model.position.y <= 0) {
      this.player.model.position.y = 0;
      this.velocityY = 0;
      this.isJumping = false;

      // 점프 애니메이션이 끝났으면 Idle/Walk/Run으로 전환
      if (this.currentAnimationName === 'Jump') {
        const isMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
        const isRunning = isMoving && this.keys.shift;
        this.setAnimation(isMoving ? (isRunning ? 'Run' : 'Walk') : 'Idle');
      }
    }

    // 네트워크 동기화 (30Hz)
    this.syncWithServer(timeElapsed);
  }

  /**
   * 서버와 위치/회전/애니메이션 동기화
   */
  syncWithServer(timeElapsed) {
    if (!this.socket) return;

    this.lastSyncTime += timeElapsed * 1000; // ms로 변환

    if (this.lastSyncTime >= this.syncInterval) {
      this.lastSyncTime = 0;

      // 서버로 위치, 회전, 애니메이션 전송
      this.socket.emit('updatePosition', {
        position: {
          x: this.player.model.position.x,
          y: this.player.model.position.y,
          z: this.player.model.position.z
        },
        rotation: {
          x: this.player.model.rotation.x,
          y: this.player.model.rotation.y,
          z: this.player.model.rotation.z
        },
        animation: this.currentAnimationName
      });
    }
  }

  /**
   * 정리
   */
  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    console.log('[PlayerController] Disposed');
  }
}

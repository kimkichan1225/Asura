/**
 * ThirdPersonCamera.js
 * 3인칭 카메라 컨트롤러
 */

const THREE = window.THREE;

export class ThirdPersonCamera {
  constructor(camera, target) {
    this.camera = camera;
    this.target = target; // 플레이어 모델

    // 카메라 오프셋 설정 (플레이어 뒤쪽 위)
    this.cameraOffset = new THREE.Vector3(0, 15, 10);

    // 카메라 회전 각도 (마우스로 조작 가능)
    this.rotationAngle = 4.715; // 약 270도 (4.715 라디안)

    // 마우스 감도
    this.mouseSensitivity = 0.003;

    // 마우스 입력 상태
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // 카메라가 바라볼 머리 오프셋
    this.headOffset = new THREE.Vector3(0, 2, 0);

    // 마우스 이벤트 바인딩
    this.initMouseControls();

    console.log('[ThirdPersonCamera] Initialized');
  }

  /**
   * 마우스 컨트롤 초기화
   */
  initMouseControls() {
    // 마우스 우클릭으로 카메라 회전
    document.addEventListener('mousedown', (e) => this.onMouseDown(e), false);
    document.addEventListener('mouseup', (e) => this.onMouseUp(e), false);
    document.addEventListener('mousemove', (e) => this.onMouseMove(e), false);

    // 컨텍스트 메뉴 비활성화 (우클릭 메뉴 방지)
    document.addEventListener('contextmenu', (e) => e.preventDefault(), false);
  }

  /**
   * 마우스 다운 이벤트
   */
  onMouseDown(event) {
    // 우클릭 (button === 2)으로 카메라 회전
    if (event.button === 2) {
      this.isMouseDown = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }

  /**
   * 마우스 업 이벤트
   */
  onMouseUp(event) {
    if (event.button === 2) {
      this.isMouseDown = false;
    }
  }

  /**
   * 마우스 이동 이벤트
   */
  onMouseMove(event) {
    if (!this.isMouseDown) return;

    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;

    // 좌우 회전
    this.rotationAngle -= deltaX * this.mouseSensitivity;

    // 각도 정규화 (0 ~ 2π)
    this.rotationAngle = this.rotationAngle % (Math.PI * 2);
    if (this.rotationAngle < 0) {
      this.rotationAngle += Math.PI * 2;
    }

    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  /**
   * 카메라 업데이트
   */
  update() {
    if (!this.target) return;

    // 플레이어 위치
    const targetPosition = this.target.position.clone();

    // 카메라 오프셋을 회전 각도에 맞춰 회전
    const offset = this.cameraOffset.clone();
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationAngle);

    // 카메라 위치 계산
    const cameraPosition = targetPosition.clone().add(offset);
    this.camera.position.copy(cameraPosition);

    // 카메라가 플레이어의 머리 부분을 바라보도록 설정
    const headPosition = targetPosition.clone().add(this.headOffset);
    this.camera.lookAt(headPosition);
  }

  /**
   * 카메라 회전 각도 가져오기 (플레이어 이동 방향 계산에 사용)
   */
  getRotationAngle() {
    return this.rotationAngle;
  }

  /**
   * 타겟 변경
   */
  setTarget(newTarget) {
    this.target = newTarget;
  }

  /**
   * 정리
   */
  dispose() {
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('contextmenu', (e) => e.preventDefault());
    console.log('[ThirdPersonCamera] Disposed');
  }
}

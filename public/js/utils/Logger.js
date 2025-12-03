/**
 * Logger.js
 * 로깅 유틸리티 모듈
 */

export class Logger {
  static LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
  };

  constructor(moduleName = 'App', logLevel = Logger.LOG_LEVELS.DEBUG) {
    this.moduleName = moduleName;
    this.logLevel = logLevel;
  }

  /**
   * 로그 레벨 설정
   */
  setLogLevel(level) {
    this.logLevel = level;
  }

  /**
   * 포맷팅된 메시지 생성
   */
  formatMessage(level, message) {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    return `[${timestamp}] [${level}] [${this.moduleName}] ${message}`;
  }

  /**
   * DEBUG 로그
   */
  debug(...args) {
    if (this.logLevel <= Logger.LOG_LEVELS.DEBUG) {
      console.log(this.formatMessage('DEBUG', ''), ...args);
    }
  }

  /**
   * INFO 로그
   */
  info(...args) {
    if (this.logLevel <= Logger.LOG_LEVELS.INFO) {
      console.info(this.formatMessage('INFO', ''), ...args);
    }
  }

  /**
   * WARN 로그
   */
  warn(...args) {
    if (this.logLevel <= Logger.LOG_LEVELS.WARN) {
      console.warn(this.formatMessage('WARN', ''), ...args);
    }
  }

  /**
   * ERROR 로그
   */
  error(...args) {
    if (this.logLevel <= Logger.LOG_LEVELS.ERROR) {
      console.error(this.formatMessage('ERROR', ''), ...args);
    }
  }

  /**
   * 테이블 로그
   */
  table(data) {
    if (this.logLevel <= Logger.LOG_LEVELS.DEBUG) {
      console.log(this.formatMessage('DEBUG', 'Table data:'));
      console.table(data);
    }
  }

  /**
   * 그룹 로그 시작
   */
  group(label) {
    if (this.logLevel <= Logger.LOG_LEVELS.DEBUG) {
      console.group(this.formatMessage('DEBUG', label));
    }
  }

  /**
   * 그룹 로그 종료
   */
  groupEnd() {
    if (this.logLevel <= Logger.LOG_LEVELS.DEBUG) {
      console.groupEnd();
    }
  }

  /**
   * 성능 측정 시작
   */
  time(label) {
    if (this.logLevel <= Logger.LOG_LEVELS.DEBUG) {
      console.time(`[${this.moduleName}] ${label}`);
    }
  }

  /**
   * 성능 측정 종료
   */
  timeEnd(label) {
    if (this.logLevel <= Logger.LOG_LEVELS.DEBUG) {
      console.timeEnd(`[${this.moduleName}] ${label}`);
    }
  }
}

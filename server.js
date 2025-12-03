/**
 * server.js
 * Asura 게임 서버 메인 파일
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const RoomManager = require('./server/modules/RoomManager');
const SocketHandler = require('./server/handlers/socketHandler');

// Express 앱 생성
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 포트 설정
const PORT = process.env.PORT || 3000;

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 기본 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API 라우트
app.get('/api/stats', (req, res) => {
  const stats = roomManager.getStats();
  res.json({
    success: true,
    data: stats
  });
});

app.get('/api/rooms', (req, res) => {
  const rooms = roomManager.getPublicRooms();
  res.json({
    success: true,
    data: rooms
  });
});

// 방 관리자 초기화
const roomManager = new RoomManager();

// 소켓 핸들러 초기화
const socketHandler = new SocketHandler(io, roomManager);

// Socket.io 연결 처리
io.on('connection', (socket) => {
  socketHandler.handleConnection(socket);
});

// 서버 시작
server.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('   ASURA GAME SERVER');
  console.log('========================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log('========================================');
  console.log('');
});

// 주기적으로 빈 방 정리 (5분마다)
setInterval(() => {
  roomManager.cleanupEmptyRooms();
}, 5 * 60 * 1000);

// 에러 핸들링
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };

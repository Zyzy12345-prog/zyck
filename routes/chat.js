const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

// 所有路由需要认证
router.use(authenticate);

// 聊天室管理
router.post('/rooms', chatController.getOrCreateRoom);
router.get('/rooms', chatController.getUserRooms);
router.get('/rooms/:roomId', chatController.getRoomDetail);
router.put('/rooms/:roomId/close', chatController.closeRoom);

// 消息管理
router.get('/rooms/:roomId/messages', chatController.getRoomMessages);
router.post('/messages', chatController.sendMessage);
router.put('/rooms/:roomId/read', chatController.markAsRead);

module.exports = router;









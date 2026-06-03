const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');
const { authenticate } = require('../middleware/auth');

// 所有路由需要认证
router.use(authenticate);

// 查询通讯记录
router.get('/', communicationController.getCommunicationRecords);

// Mock：系统内“直接联系客户”（电话/短信/邮件/微信/聊天）
router.post('/mock/call', communicationController.mockCall);
router.post('/mock/sms', communicationController.mockSms);
router.post('/mock/email', communicationController.mockEmail);
router.post('/mock/wechat', communicationController.mockWechat);
router.post('/mock/chat', communicationController.mockChat);

module.exports = router;





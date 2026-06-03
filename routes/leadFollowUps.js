const express = require('express');
const router = express.Router();
const leadFollowUpController = require('../controllers/leadFollowUpController');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// 获取线索的跟进记录列表
router.get('/leads/:leadId/follow-ups', leadFollowUpController.getFollowUps);

// 获取线索的跟进统计
router.get('/leads/:leadId/follow-ups/statistics', leadFollowUpController.getFollowUpStatistics);

// 创建跟进记录
router.post('/leads/:leadId/follow-ups', leadFollowUpController.createFollowUp);

// 获取待跟进列表（必须在 :id 之前）
router.get('/follow-ups/pending', leadFollowUpController.getPendingFollowUps);

// 获取单个跟进记录
router.get('/follow-ups/:id', leadFollowUpController.getFollowUp);

// 更新跟进记录
router.put('/follow-ups/:id', leadFollowUpController.updateFollowUp);

// 删除跟进记录
router.delete('/follow-ups/:id', leadFollowUpController.deleteFollowUp);

module.exports = router;




const express = require('express');
const router = express.Router();
const followUpReminderController = require('../controllers/followUpReminderController');
const { authenticate } = require('../middleware/auth');

// 所有路由需要认证
router.use(authenticate);

// 提醒管理
router.post('/reminders', followUpReminderController.createReminder);
router.get('/reminders', followUpReminderController.getUserReminders);
router.get('/reminders/upcoming', followUpReminderController.getUpcomingReminders);
router.get('/reminders/overdue', followUpReminderController.getOverdueReminders);
router.get('/reminders/statistics', followUpReminderController.getReminderStatistics);
router.put('/reminders/:id/read', followUpReminderController.markAsRead);
router.put('/reminders/batch-read', followUpReminderController.batchMarkAsRead);
router.put('/reminders/:id/complete', followUpReminderController.markAsCompleted);
router.delete('/reminders/:id', followUpReminderController.deleteReminder);

// 跟进统计（使用不同的路径避免与 leadFollowUps 冲突）
router.get('/follow-up-statistics', followUpReminderController.getFollowUpStatistics);

module.exports = router;


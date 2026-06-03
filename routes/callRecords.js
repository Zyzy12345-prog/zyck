const express = require('express');
const router = express.Router();
const callRecordController = require('../controllers/callRecordController');
const { authenticate } = require('../middleware/auth');

// 所有路由需要认证
router.use(authenticate);

// 外呼记录管理
router.post('/records', callRecordController.createCallRecord);
router.get('/records', callRecordController.getCallRecords);
router.get('/records/statistics', callRecordController.getCallStatistics);
router.get('/records/ranking', callRecordController.getUserCallRanking);
router.get('/records/:id', callRecordController.getCallRecord);
router.put('/records/:id', callRecordController.updateCallRecord);
router.delete('/records/:id', callRecordController.deleteCallRecord);

module.exports = router;









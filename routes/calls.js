const express = require('express');
const router = express.Router();
const callRecordController = require('../controllers/callRecordController');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// 获取外呼记录列表
router.get('/', callRecordController.getCallRecords);

// 获取统计数据
router.get('/statistics', callRecordController.getCallStatistics);

// 获取单个外呼记录
router.get('/:id', callRecordController.getCallRecord);

// 创建外呼记录
router.post('/', callRecordController.createCallRecord);

// 更新外呼记录
router.put('/:id', callRecordController.updateCallRecord);

// 删除外呼记录
router.delete('/:id', callRecordController.deleteCallRecord);

module.exports = router;

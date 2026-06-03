const express = require('express');
const router = express.Router();
const customerPoolController = require('../controllers/customerPoolController');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// 公海池列表
router.get('/', customerPoolController.getPoolClients);

// 公海池统计
router.get('/statistics', customerPoolController.getPoolStatistics);

// 添加到公海池
router.post('/add', customerPoolController.addToPool);

// 领取客户
router.post('/:id/claim', customerPoolController.claimClient);

// 批量领取
router.post('/batch-claim', customerPoolController.batchClaimClients);

// 更新优先级
router.put('/:id/priority', customerPoolController.updatePriority);

module.exports = router;












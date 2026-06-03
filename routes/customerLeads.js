const express = require('express');
const router = express.Router();
const customerLeadController = require('../controllers/customerLeadController');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// 线索列表和创建
router.get('/', customerLeadController.getLeads);
router.post('/', customerLeadController.createLead);

// 线索统计
router.get('/statistics', customerLeadController.getLeadStatistics);

// 批量操作
router.post('/batch-assign', customerLeadController.batchAssignLeads);
router.post('/batch-update-status', customerLeadController.batchUpdateLeadStatus);

// 单个线索操作
router.get('/:id', customerLeadController.getLead);
router.put('/:id', customerLeadController.updateLead);
router.delete('/:id', customerLeadController.deleteLead);

// 分配和转化
router.post('/:id/assign', customerLeadController.assignLead);
router.post('/:id/convert', customerLeadController.convertLead);

module.exports = router;












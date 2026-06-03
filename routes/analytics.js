// Analytics Routes - 数据分析路由
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// 销售数据分析
router.get('/sales', analyticsController.getSalesAnalytics);

// 客户分析
router.get('/customers', analyticsController.getCustomerAnalytics);

// 跟进效率分析
router.get('/follow-ups', analyticsController.getFollowUpAnalytics);

// 外呼数据分析
router.get('/calls', analyticsController.getCallAnalytics);

module.exports = router;












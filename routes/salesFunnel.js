// Sales Funnel Routes
const express = require('express');
const router = express.Router();
const salesFunnelController = require('../controllers/salesFunnelController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Sales stages
router.get('/stages', salesFunnelController.getSalesStages);

// Opportunities - 特定路由必须在通用路由之前
router.get('/opportunities/by-stage', salesFunnelController.getOpportunitiesByStage);
router.get('/opportunities', salesFunnelController.getOpportunities);
router.post('/opportunities', salesFunnelController.createOpportunity);

// Stage management - 必须在 :id 路由之前
router.put('/opportunities/:id/move-stage', salesFunnelController.moveOpportunityStage);
router.put('/opportunities/:id/mark-won', salesFunnelController.markOpportunityWon);
router.put('/opportunities/:id/mark-lost', salesFunnelController.markOpportunityLost);

// Generic CRUD - 放在最后
router.get('/opportunities/:id', salesFunnelController.getOpportunity);
router.put('/opportunities/:id', salesFunnelController.updateOpportunity);
router.delete('/opportunities/:id', salesFunnelController.deleteOpportunity);

// Statistics
router.get('/statistics', salesFunnelController.getFunnelStatistics);

module.exports = router;



// Client Scoring Routes
const express = require('express');
const router = express.Router();
const clientScoringController = require('../controllers/clientScoringController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Score calculation
router.post('/clients/:clientId/calculate-score', clientScoringController.calculateClientScore);
router.post('/clients/batch-calculate-scores', clientScoringController.batchCalculateScores);
router.get('/clients/:clientId/score', clientScoringController.getClientScore);

// Value analysis
router.post('/clients/:clientId/update-value-analysis', clientScoringController.updateClientValueAnalysis);
router.get('/clients/:clientId/value-analysis', clientScoringController.getClientValueAnalysis);

// Level-based queries
router.get('/clients/level/:level', clientScoringController.getClientsByLevel);
router.get('/clients/level-distribution', clientScoringController.getLevelDistribution);
router.get('/clients/high-value', clientScoringController.getHighValueClients);
router.get('/clients/at-risk', clientScoringController.getAtRiskClients);

module.exports = router;













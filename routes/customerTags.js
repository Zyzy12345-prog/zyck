// Customer Tags Routes
const express = require('express');
const router = express.Router();
const customerTagController = require('../controllers/customerTagController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Tag management
router.get('/tags', customerTagController.getTags);
router.post('/tags', customerTagController.createTag);
router.get('/tags/statistics', customerTagController.getTagStatistics);
router.get('/tags/categories', customerTagController.getTagCategories);
router.get('/search-clients', customerTagController.searchClientsByTags);
router.put('/tags/:id', customerTagController.updateTag);
router.delete('/tags/:id', customerTagController.deleteTag);

// Client-tag relations
router.post('/client-tags', customerTagController.addTagToClient);
router.post('/client-tags/batch', customerTagController.batchAddTagsToClients);
router.delete('/client-tags', customerTagController.removeTagFromClient);
router.get('/clients/:clientId/tags', customerTagController.getClientTags);

module.exports = router;



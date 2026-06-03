const express = require('express');
const router = express.Router();
const leadTagController = require('../controllers/leadTagController');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// 标签管理
router.get('/tags', leadTagController.getTags);
router.get('/tags/categories', leadTagController.getCategories);
router.get('/tags/statistics', leadTagController.getTagStatistics);
router.post('/tags', leadTagController.createTag);
router.put('/tags/:id', leadTagController.updateTag);
router.delete('/tags/:id', leadTagController.deleteTag);

// 线索-标签关联
router.post('/lead-tags', leadTagController.addTagToLead);
router.delete('/lead-tags', leadTagController.removeTagFromLead);
router.post('/lead-tags/batch', leadTagController.batchAddTags);
router.get('/leads/:leadId/tags', leadTagController.getLeadTags);

// 按标签搜索线索
router.get('/leads/search/by-tags', leadTagController.searchLeadsByTags);

module.exports = router;











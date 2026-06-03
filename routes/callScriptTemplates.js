const express = require('express');
const router = express.Router();
const callScriptTemplateController = require('../controllers/callScriptTemplateController');
const { authenticate } = require('../middleware/auth');

// 所有路由需要认证
router.use(authenticate);

// 脚本模板管理
router.post('/templates', callScriptTemplateController.createScriptTemplate);
router.get('/templates', callScriptTemplateController.getScriptTemplates);
router.get('/templates/categories', callScriptTemplateController.getTemplateCategories);
router.get('/templates/:id', callScriptTemplateController.getScriptTemplate);
router.put('/templates/:id', callScriptTemplateController.updateScriptTemplate);
router.delete('/templates/:id', callScriptTemplateController.deleteScriptTemplate);
router.put('/templates/:id/toggle', callScriptTemplateController.toggleScriptTemplate);

module.exports = router;









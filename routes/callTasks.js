const express = require('express');
const router = express.Router();
const callTaskController = require('../controllers/callTaskController');
const { authenticate } = require('../middleware/auth');

// 所有路由需要认证
router.use(authenticate);

// 外呼任务管理
router.post('/tasks', callTaskController.createCallTask);
router.get('/tasks', callTaskController.getCallTasks);
router.get('/tasks/my', callTaskController.getMyCallTasks);
router.get('/tasks/statistics', callTaskController.getTaskStatistics);
router.post('/tasks/batch-assign', callTaskController.batchAssignTasks);
router.get('/tasks/:id', callTaskController.getCallTask);
router.put('/tasks/:id', callTaskController.updateCallTask);
router.delete('/tasks/:id', callTaskController.deleteCallTask);
router.put('/tasks/:id/complete', callTaskController.completeCallTask);
router.put('/tasks/:id/cancel', callTaskController.cancelCallTask);

module.exports = router;









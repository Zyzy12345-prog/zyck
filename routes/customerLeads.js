const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const customerLeadController = require('../controllers/customerLeadController');
const { authenticate } = require('../middleware/auth');

// 配置文件上传
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads', 'temp'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 .xlsx / .xls / .csv 格式'));
    }
  }
});

// 所有路由都需要认证
router.use(authenticate);

// ===== 注意：具体路径必须在 /:id 之前 =====

// 导出
router.get('/export', customerLeadController.exportLeads);

// 模板下载
router.get('/template', customerLeadController.downloadTemplate);

// 导入
router.post('/import', upload.single('file'), customerLeadController.importLeads);

// 线索统计
router.get('/statistics', customerLeadController.getLeadStatistics);

// 评分配置
router.get('/scoring-config', customerLeadController.getScoringConfig);
router.put('/scoring-config', customerLeadController.updateScoringConfig);

// 批量操作
router.post('/batch-assign', customerLeadController.batchAssignLeads);
router.post('/batch-update-status', customerLeadController.batchUpdateLeadStatus);
router.post('/batch-recalculate-scores', customerLeadController.batchRecalculateScores);

// 回收规则
router.get('/reclaim-rules', customerLeadController.getReclaimRules);
router.put('/reclaim-rules', customerLeadController.updateReclaimRules);

// 回收检查
router.get('/reclaim-check', customerLeadController.checkReclaimable);

// 批量回收
router.post('/batch-reclaim', customerLeadController.batchReclaimLeads);

// 线索列表和创建
router.get('/', customerLeadController.getLeads);
router.post('/', customerLeadController.createLead);

// 单个线索操作
router.get('/:id', customerLeadController.getLead);
router.put('/:id', customerLeadController.updateLead);
router.delete('/:id', customerLeadController.deleteLead);

// 分配和转化
router.post('/:id/assign', customerLeadController.assignLead);
router.post('/:id/convert', customerLeadController.convertLead);

// 重算评分
router.post('/:id/recalculate-score', customerLeadController.recalculateScore);

module.exports = router;

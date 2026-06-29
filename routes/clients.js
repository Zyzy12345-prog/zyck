const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateClient } = require('../middleware/validator');
const multer = require('multer');

// 配置文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel文件格式'));
    }
  }
});

// 所有路由都需要认证
router.use(authenticate);

// 获取行业分类树形结构
router.get('/industries/tree', clientController.getIndustries);

// 获取行业分类列表（扁平）
router.get('/industries/list', clientController.getIndustriesList);

// 智能匹配单个行业
router.post('/industries/match', clientController.matchIndustry);

// 批量匹配行业
router.post('/industries/batch-match', clientController.batchMatchIndustries);

// 更新行业关键词（需要admin权限）
router.put('/industries/:id/keywords', authorize('admin'), clientController.updateIndustryKeywords);

// 获取客户列表
router.get('/', clientController.getClients);

// 获取单个客户详情
router.get('/:id', clientController.getClient);

// 创建客户（需要sales及以上权限）
router.post('/', authorize('admin', 'manager', 'sales'), validateClient, clientController.createClient);

// 更新客户（需要sales及以上权限）
router.put('/:id', authorize('admin', 'manager', 'sales'), validateClient, clientController.updateClient);

// 删除客户（需要manager及以上权限）
router.delete('/:id', authorize('admin', 'manager'), clientController.deleteClient);

// 分配客户（需要manager及以上权限）
router.post('/assign', authorize('admin', 'manager'), clientController.assignClient);

// 导入客户（需要manager及以上权限）
router.post('/import', authorize('admin', 'manager'), upload.single('file'), clientController.importClients);

// 导出客户
router.get('/export', clientController.exportClients);

// ==================== 跟进记录路由 ====================

// 获取客户跟进记录列表
router.get('/:clientId/follow-ups', clientController.getFollowUps);

// 创建跟进记录
router.post('/:clientId/follow-ups', authorize('admin', 'manager', 'sales'), clientController.createFollowUp);

// 更新跟进记录
router.put('/follow-ups/:id', authorize('admin', 'manager', 'sales'), clientController.updateFollowUp);

// 删除跟进记录
router.delete('/follow-ups/:id', authorize('admin', 'manager'), clientController.deleteFollowUp);

// ==================== 跟进记录评论路由 ====================

// 获取跟进记录的评论
router.get('/follow-ups/:followUpId/comments', clientController.getFollowUpComments);

// 添加跟进记录评论
router.post('/follow-ups/:followUpId/comments', clientController.createFollowUpComment);

// 删除跟进记录评论
router.delete('/follow-up-comments/:id', clientController.deleteFollowUpComment);

// ==================== 客户文件路由 ====================

// 获取客户文件列表
router.get('/:clientId/files', clientController.getCustomerFiles);

// 上传客户文件
router.post('/:clientId/files', authorize('admin', 'manager', 'sales'), clientController.uploadCustomerFile);

// 下载客户文件
router.get('/files/:id/download', clientController.downloadCustomerFile);

// 删除客户文件
router.delete('/files/:id', authorize('admin', 'manager'), clientController.deleteCustomerFile);

// ==================== 内部讨论路由 ====================

// 获取客户讨论列表
router.get('/:clientId/discussions', clientController.getDiscussions);

// 创建讨论
router.post('/:clientId/discussions', clientController.createDiscussion);

// 删除讨论
router.delete('/discussions/:id', authorize('admin', 'manager'), clientController.deleteDiscussion);

// ==================== 跟进提醒路由 ====================

// 获取待处理的提醒
router.get('/reminders/pending', clientController.getPendingReminders);

// 获取用户的所有提醒
router.get('/reminders/my', clientController.getUserReminders);

// 标记提醒为已发送
router.put('/reminders/:id/sent', clientController.markReminderAsSent);

// 获取日历数据
router.get('/calendar/events', clientController.getCalendarData);

module.exports = router;

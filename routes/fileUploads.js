const express = require('express');
const router = express.Router();
const fileUploadController = require('../controllers/fileUploadController');
const { authenticate } = require('../middleware/auth');

// 所有路由需要认证
router.use(authenticate);

// 上传单个文件
router.post('/upload', fileUploadController.uploadSingle, fileUploadController.handleFileUpload);

// 上传多个文件
router.post('/upload-multiple', fileUploadController.uploadMultiple, fileUploadController.handleFileUpload);

// 获取文件列表
router.get('/', fileUploadController.getFiles);

// 获取单个文件信息
router.get('/:id', fileUploadController.getFile);

// 下载文件
router.get('/:id/download', fileUploadController.downloadFile);

// 删除文件
router.delete('/:id', fileUploadController.deleteFile);

module.exports = router;









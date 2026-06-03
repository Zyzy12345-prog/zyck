const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// 获取用户列表（需要manager及以上权限）
router.get('/', authorize('admin', 'manager'), userController.getUsers);

// 获取单个用户详情（需要manager及以上权限）
router.get('/:id', authorize('admin', 'manager'), userController.getUser);

// 创建用户（需要admin权限）
router.post('/', authorize('admin'), userController.createUser);

// 更新用户（需要manager及以上权限）
router.put('/:id', authorize('admin', 'manager'), userController.updateUser);

// 删除用户（需要admin权限）
router.delete('/:id', authorize('admin'), userController.deleteUser);

// 获取用户的客户列表
router.get('/:id/clients', authorize('admin', 'manager'), userController.getUserClients);

module.exports = router;

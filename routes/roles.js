const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticate, isAdmin } = require('../middleware/auth');

// 所有角色管理路由需要登录
router.use(authenticate);

/**
 * @route   GET /api/roles
 * @desc    获取角色列表
 * @access  Private
 */
router.get('/', roleController.getRoles);

/**
 * @route   GET /api/roles/:id
 * @desc    获取单个角色详情
 * @access  Private
 */
router.get('/:id', roleController.getRole);

/**
 * @route   POST /api/roles
 * @desc    创建角色
 * @access  Private/Admin
 */
router.post('/', isAdmin, roleController.createRole);

/**
 * @route   PUT /api/roles/:id
 * @desc    更新角色
 * @access  Private/Admin
 */
router.put('/:id', isAdmin, roleController.updateRole);

/**
 * @route   DELETE /api/roles/:id
 * @desc    删除角色
 * @access  Private/Admin
 */
router.delete('/:id', isAdmin, roleController.deleteRole);

module.exports = router;

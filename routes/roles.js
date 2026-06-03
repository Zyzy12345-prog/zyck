const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
// const { authenticate, checkPermission } = require('../middleware/auth');

// 暂时不使用认证中间件，方便测试
// router.use(authenticate);

/**
 * @route   GET /api/roles
 * @desc    获取角色列表
 * @access  Public (临时)
 */
router.get('/', roleController.getRoles);

/**
 * @route   GET /api/roles/:id
 * @desc    获取单个角色详情
 * @access  Public (临时)
 */
router.get('/:id', roleController.getRole);

/**
 * @route   POST /api/roles
 * @desc    创建角色
 * @access  Private/Admin
 */
router.post('/', 
  // checkPermission('role:create'),
  roleController.createRole
);

/**
 * @route   PUT /api/roles/:id
 * @desc    更新角色
 * @access  Private/Admin
 */
router.put('/:id', 
  // checkPermission('role:update'),
  roleController.updateRole
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    删除角色
 * @access  Private/Admin
 */
router.delete('/:id', 
  // checkPermission('role:delete'),
  roleController.deleteRole
);

module.exports = router;









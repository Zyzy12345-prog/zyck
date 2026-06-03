const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

/**
 * 员工管理路由
 */

// 获取统计数据
router.get('/statistics', employeeController.getStatistics);

// 获取筛选选项
router.get('/options/departments', employeeController.getDepartments);
router.get('/options/positions', employeeController.getPositions);
router.get('/options/roles', employeeController.getRoles);

// 批量导入
router.post('/import', employeeController.importEmployees);

// CRUD操作
router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

// 状态管理
router.patch('/:id/status', employeeController.updateEmployeeStatus);

// 密码管理
router.post('/:id/reset-password', employeeController.resetPassword);
router.post('/:id/change-password', employeeController.changePassword);

module.exports = router;









const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validator');

// 用户注册
router.post('/register', validateRegister, authController.register);

// 用户登录
router.post('/login', validateLogin, authController.login);

// 获取当前用户信息（需要认证）
router.get('/me', authenticate, authController.getMe);

// 修改密码（需要认证）
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;

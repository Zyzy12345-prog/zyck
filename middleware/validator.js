const { body, validationResult } = require('express-validator');

// 验证结果处理中间件
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: errors.array()
    });
  }
  next();
};

// 用户注册验证规则
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符'),
  handleValidationErrors
];

// 用户登录验证规则
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
  handleValidationErrors
];

// 客户创建/更新验证规则
const validateClient = [
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('公司名称不能为空'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('phone')
    .optional()
    .matches(/^[0-9-+()\s]*$/)
    .withMessage('电话号码格式不正确'),
  handleValidationErrors
];

// 外呼记录验证规则
const validateCallRecord = [
  body('clientId')
    .isInt()
    .withMessage('客户ID必须是整数'),
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('电话号码不能为空')
    .matches(/^[0-9-+()\s]*$/)
    .withMessage('电话号码格式不正确'),
  body('callType')
    .optional()
    .isIn(['manual', 'auto', 'callback', 'inbound', 'outbound'])
    .withMessage('呼叫类型不正确'),
  body('direction')
    .optional()
    .isIn(['inbound', 'outbound'])
    .withMessage('呼叫方向不正确'),
  body('callTime')
    .optional()
    .isISO8601()
    .withMessage('拨打时间格式不正确'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('通话时长必须是非负整数'),
  body('status')
    .optional()
    .isIn(['initiated', 'ringing', 'answered', 'completed', 'no_answer', 'busy', 'failed'])
    .withMessage('呼叫状态不正确'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组'),
  body('satisfaction')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('满意度必须是1-5之间的整数'),
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('跟进日期格式不正确'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateClient,
  validateCallRecord,
  handleValidationErrors
};

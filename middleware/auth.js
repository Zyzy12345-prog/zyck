const jwt = require('jsonwebtoken');
const { User, Employee, Role, Permission } = require('../models');

// JWT认证中间件（支持User和Employee）
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // 判断token类型
    if (decoded.type === 'employee' && decoded.employeeId) {
      // 员工登录
      const employee = await Employee.findByPk(decoded.employeeId, {
        include: [
          {
            model: Role,
            as: 'role',
            include: [
              {
                model: Permission,
                as: 'permissionDetails',
                through: { attributes: [] }
              }
            ]
          }
        ]
      });

      if (!employee || !employee.isActive()) {
        return res.status(401).json({
          success: false,
          message: '员工不存在或已被停用'
        });
      }

      req.employee = employee;
      req.user = employee; // 兼容旧代码
    } else if (decoded.userId) {
      // 用户登录（旧系统）
      const user = await User.findByPk(decoded.userId);

      if (!user || user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: '用户不存在或已被禁用'
        });
      }

      req.user = user;
    } else {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期'
      });
    }
    return res.status(500).json({
      success: false,
      message: '认证过程出错',
      error: error.message
    });
  }
};

// 权限检查中间件（基于角色）
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证'
      });
    }

    // 检查User的role字段
    if (req.user.role && roles.includes(req.user.role)) {
      return next();
    }

    // 检查Employee的role关联
    if (req.employee && req.employee.role && roles.includes(req.employee.role.code)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: '权限不足'
    });
  };
};

// 权限检查中间件（基于权限代码）
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user && !req.employee) {
        return res.status(401).json({
          success: false,
          message: '未认证'
        });
      }

      // 如果是Employee，检查权限
      if (req.employee) {
        const employee = req.employee;

        // 检查是否有超级权限
        if (employee.hasPermission('*')) {
          return next();
        }

        // 检查角色权限
        if (employee.role && employee.role.hasPermission(requiredPermission)) {
          return next();
        }

        // 检查个人权限
        if (employee.hasPermission(requiredPermission)) {
          return next();
        }

        return res.status(403).json({
          success: false,
          message: '权限不足',
          required: requiredPermission
        });
      }

      // 如果是User（旧系统），检查角色
      if (req.user) {
        // 管理员拥有所有权限
        if (req.user.role === 'admin') {
          return next();
        }

        // 这里可以添加更多的权限映射逻辑
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: '权限检查失败',
        error: error.message
      });
    }
  };
};

// 检查是否是管理员
const isAdmin = (req, res, next) => {
  if (!req.user && !req.employee) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  // 检查Employee
  if (req.employee) {
    // 检查是否有超级权限或管理员角色
    if (req.employee.hasPermission('*') || 
        (req.employee.role && ['SUPER_ADMIN', 'ADMIN'].includes(req.employee.role.code))) {
      return next();
    }
  }

  // 检查User（旧系统）
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: '需要管理员权限'
  });
};

// 检查是否可以访问指定员工的资源
const canAccessEmployee = (req, res, next) => {
  const targetEmployeeId = parseInt(req.params.id);
  
  if (!req.employee) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  // 访问自己的资源
  if (req.employee.id === targetEmployeeId) {
    return next();
  }

  // 管理员可以访问所有员工
  if (req.employee.hasPermission('*') || req.employee.hasPermission('employee:read')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: '无权访问该员工的资源'
  });
};

module.exports = {
  authenticate,
  authorize,
  checkPermission,
  isAdmin,
  canAccessEmployee
};

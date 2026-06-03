const { User, Assignment, CallRecord } = require('../models');
const { Op } = require('sequelize');

// 获取用户列表
exports.getUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取单个用户详情
exports.getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Assignment,
          as: 'assignments',
          where: { status: 'active' },
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 获取统计数据
    const assignmentCount = await Assignment.count({
      where: { userId: id, status: 'active' }
    });

    const callRecordCount = await CallRecord.count({
      where: { userId: id }
    });

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        statistics: {
          assignmentCount,
          callRecordCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 创建用户
exports.createUser = async (req, res, next) => {
  try {
    const { username, email, password, role, status } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'operator',
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 不允许普通用户修改自己的角色
    if (req.body.role && req.user.id === parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权修改自己的角色'
      });
    }

    const updateData = { ...req.body };
    // 如果更新密码，需要单独处理
    if (updateData.password) {
      user.password = updateData.password;
      await user.save();
      delete updateData.password;
    }

    if (Object.keys(updateData).length > 0) {
      await user.update(updateData);
    }

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: '用户更新成功',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// 删除用户
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 软删除：将状态改为inactive
    await user.update({ status: 'inactive' });

    res.json({
      success: true,
      message: '用户已禁用'
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户的客户列表
exports.getUserClients = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const assignments = await Assignment.findAndCountAll({
      where: { userId: id, status: 'active' },
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: require('../models').Client,
        as: 'client'
      }],
      order: [['assignedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        assignments: assignments.rows,
        pagination: {
          total: assignments.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(assignments.count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

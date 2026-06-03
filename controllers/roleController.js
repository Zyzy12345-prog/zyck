const { Role } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取角色列表
 * GET /api/roles
 */
exports.getRoles = async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search, status } = req.query;

    const where = {};
    
    // 搜索条件
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 状态筛选 - 使用 isActive 字段
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const { count, rows } = await Role.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['level', 'DESC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      message: '获取角色列表成功',
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取单个角色详情
 * GET /api/roles/:id
 */
exports.getRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: '角色不存在'
      });
    }

    res.json({
      success: true,
      message: '获取角色详情成功',
      data: role
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建角色
 * POST /api/roles
 */
exports.createRole = async (req, res, next) => {
  try {
    const { name, code, description, permissions, level } = req.body;

    // 验证必填字段
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: '角色名称和编码不能为空'
      });
    }

    // 检查编码是否已存在
    const existingRole = await Role.findOne({ where: { code } });
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: '角色编码已存在'
      });
    }

    const role = await Role.create({
      name,
      code,
      description,
      permissions: permissions || {},
      level: level || 1,
      isActive: true,
      isSystem: false
    });

    res.status(201).json({
      success: true,
      message: '角色创建成功',
      data: role
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新角色
 * PUT /api/roles/:id
 */
exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, level, isActive } = req.body;

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: '角色不存在'
      });
    }

    // 系统角色不能修改某些字段
    if (role.isSystem && req.body.code) {
      return res.status(403).json({
        success: false,
        message: '系统角色的编码不能修改'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (level !== undefined) updateData.level = level;
    if (isActive !== undefined) updateData.isActive = isActive;

    await role.update(updateData);

    res.json({
      success: true,
      message: '角色更新成功',
      data: role
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除角色
 * DELETE /api/roles/:id
 */
exports.deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: '角色不存在'
      });
    }

    // 系统角色不能删除
    if (role.isSystem) {
      return res.status(403).json({
        success: false,
        message: '系统角色不能删除'
      });
    }

    // 检查是否有员工使用该角色
    const { Employee } = require('../models');
    const employeeCount = await Employee.count({
      where: { roleId: id }
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `该角色下还有 ${employeeCount} 个员工，无法删除`
      });
    }

    await role.destroy();

    res.json({
      success: true,
      message: '角色删除成功'
    });
  } catch (error) {
    next(error);
  }
};









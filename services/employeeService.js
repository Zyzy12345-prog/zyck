const { Employee, Department, Role, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * 员工服务层
 * 处理员工相关的业务逻辑
 */
class EmployeeService {
  /**
   * 获取员工列表（分页、筛选、搜索）
   */
  async getEmployees(params) {
    const {
      page = 1,
      limit = 20,
      search = '',
      departmentId,
      position,
      status,
      roleId,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = params;

    const offset = (page - 1) * limit;
    const where = {};

    // 搜索条件
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { employeeNo: { [Op.iLike]: `%${search}%` } },
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 筛选条件
    if (departmentId) where.departmentId = departmentId;
    if (position) where.position = position;
    if (status) where.status = status;
    if (roleId) where.roleId = roleId;

    const { count, rows } = await Employee.findAndCountAll({
      where,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'code']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      distinct: true
    });

    return {
      employees: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 获取员工统计数据
   */
  async getStatistics() {
    const total = await Employee.count();
    const active = await Employee.count({ where: { status: 'active' } });
    const inactive = await Employee.count({ where: { status: 'inactive' } });
    const suspended = await Employee.count({ where: { status: 'suspended' } });

    // 按部门统计
    const byDepartment = await Employee.findAll({
      attributes: [
        'departmentId',
        [sequelize.fn('COUNT', sequelize.col('Employee.id')), 'count']
      ],
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['name']
        }
      ],
      group: ['departmentId', 'department.id', 'department.name'],
      raw: false
    });

    // 按角色统计
    const byRole = await Employee.findAll({
      attributes: [
        'roleId',
        [sequelize.fn('COUNT', sequelize.col('Employee.id')), 'count']
      ],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['name']
        }
      ],
      group: ['roleId', 'role.id', 'role.name'],
      raw: false
    });

    return {
      total,
      active,
      inactive,
      suspended,
      byDepartment: byDepartment.map(item => ({
        department: item.department?.name || '未分配',
        count: parseInt(item.get('count'))
      })),
      byRole: byRole.map(item => ({
        role: item.role?.name || '未分配',
        count: parseInt(item.get('count'))
      }))
    };
  }

  /**
   * 根据ID获取员工详情
   */
  async getEmployeeById(id) {
    const employee = await Employee.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'code', 'permissions']
        }
      ]
    });

    if (!employee) {
      throw new Error('员工不存在');
    }

    return employee;
  }

  /**
   * 创建员工
   */
  async createEmployee(data) {
    // 验证工号唯一性
    if (data.employeeNo) {
      const existing = await Employee.findOne({
        where: { employeeNo: data.employeeNo }
      });
      if (existing) {
        throw new Error('工号已存在');
      }
    } else {
      // 自动生成工号
      data.employeeNo = await Employee.generateEmployeeNo();
    }

    // 验证用户名唯一性
    const existingUsername = await Employee.findOne({
      where: { username: data.username }
    });
    if (existingUsername) {
      throw new Error('用户名已存在');
    }

    // 验证邮箱唯一性
    if (data.email) {
      const existingEmail = await Employee.findOne({
        where: { email: data.email }
      });
      if (existingEmail) {
        throw new Error('邮箱已存在');
      }
    }

    // 如果没有提供密码，生成默认密码
    if (!data.password) {
      data.password = '123456';
    }

    const employee = await Employee.create(data);

    // 重新查询以包含关联数据
    return await this.getEmployeeById(employee.id);
  }

  /**
   * 更新员工信息
   */
  async updateEmployee(id, data) {
    const employee = await Employee.findByPk(id);
    if (!employee) {
      throw new Error('员工不存在');
    }

    // 验证工号唯一性
    if (data.employeeNo && data.employeeNo !== employee.employeeNo) {
      const existing = await Employee.findOne({
        where: {
          employeeNo: data.employeeNo,
          id: { [Op.ne]: id }
        }
      });
      if (existing) {
        throw new Error('工号已存在');
      }
    }

    // 验证用户名唯一性
    if (data.username && data.username !== employee.username) {
      const existing = await Employee.findOne({
        where: {
          username: data.username,
          id: { [Op.ne]: id }
        }
      });
      if (existing) {
        throw new Error('用户名已存在');
      }
    }

    // 验证邮箱唯一性
    if (data.email && data.email !== employee.email) {
      const existing = await Employee.findOne({
        where: {
          email: data.email,
          id: { [Op.ne]: id }
        }
      });
      if (existing) {
        throw new Error('邮箱已存在');
      }
    }

    // 不允许直接修改密码
    delete data.password;

    await employee.update(data);

    // 重新查询以包含关联数据
    return await this.getEmployeeById(id);
  }

  /**
   * 删除员工（软删除，改为离职状态）
   */
  async deleteEmployee(id) {
    const employee = await Employee.findByPk(id);
    if (!employee) {
      throw new Error('员工不存在');
    }

    await employee.update({
      status: 'inactive',
      resignDate: new Date()
    });

    return employee;
  }

  /**
   * 修改员工状态
   */
  async updateEmployeeStatus(id, status) {
    const employee = await Employee.findByPk(id);
    if (!employee) {
      throw new Error('员工不存在');
    }

    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(status)) {
      throw new Error('无效的状态值');
    }

    await employee.update({ status });

    return employee;
  }

  /**
   * 重置员工密码
   */
  async resetPassword(id) {
    const newPassword = await Employee.resetPassword(id);
    return { newPassword };
  }

  /**
   * 修改员工密码
   */
  async changePassword(id, oldPassword, newPassword) {
    const employee = await Employee.findByPk(id);
    if (!employee) {
      throw new Error('员工不存在');
    }

    // 验证旧密码
    const isValid = await employee.comparePassword(oldPassword);
    if (!isValid) {
      throw new Error('原密码不正确');
    }

    // 更新密码
    employee.password = newPassword;
    await employee.save();

    return true;
  }

  /**
   * 批量导入员工
   */
  async importEmployees(employeesData) {
    const results = {
      success: [],
      failed: []
    };

    for (const data of employeesData) {
      try {
        // 自动生成工号
        if (!data.employeeNo) {
          data.employeeNo = await Employee.generateEmployeeNo();
        }

        // 设置默认密码
        if (!data.password) {
          data.password = '123456';
        }

        const employee = await this.createEmployee(data);
        results.success.push({
          employeeNo: employee.employeeNo,
          name: employee.name
        });
      } catch (error) {
        results.failed.push({
          data,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 获取部门列表（用于筛选）
   */
  async getDepartments() {
    return await Department.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'code'],
      order: [['name', 'ASC']]
    });
  }

  /**
   * 获取职位列表（用于筛选）
   */
  async getPositions() {
    const positions = await Employee.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('position')), 'position']],
      where: {
        position: { [Op.ne]: null }
      },
      raw: true
    });

    return positions.map(p => p.position).filter(Boolean).sort();
  }

  /**
   * 获取角色列表（用于筛选）
   */
  async getRoles() {
    return await Role.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'code'],
      order: [['name', 'ASC']]
    });
  }
}

module.exports = new EmployeeService();


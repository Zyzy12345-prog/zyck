/**
 * 角色模型
 * 基于角色的权限管理
 */
module.exports = (sequelize, DataTypes) => {
const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '角色ID'
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '角色名称',
    validate: {
      notEmpty: {
        msg: '角色名称不能为空'
      },
      len: {
        args: [2, 50],
        msg: '角色名称长度必须在2-50个字符之间'
      }
    }
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '角色编码',
    validate: {
      notEmpty: {
        msg: '角色编码不能为空'
      },
      is: {
        args: /^[A-Z_]+$/,
        msg: '角色编码只能包含大写字母和下划线'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '角色描述'
  },
  permissions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: '权限配置（JSON格式）'
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_system', // 映射到数据库的 is_system 字段
    comment: '是否系统角色'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active', // 映射到数据库的 is_active 字段
    comment: '是否启用'
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '角色等级（1-100）'
  }
}, {
  tableName: 'roles',
  timestamps: false, // 禁用时间戳，因为表中没有 created_at 和 updated_at 字段
  underscored: true,
  paranoid: false,
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['is_active'] }
  ]
});

/**
 * 定义关联关系
 */
Role.associate = (models) => {
  // 关联员工（一对多）
  Role.hasMany(models.Employee, {
    as: 'employees',
    foreignKey: 'roleId'
  });
  
  // 注意：roles 表中没有 created_by 和 updated_by 字段
  // 暂时不添加这些关联
};

/**
 * 实例方法：检查是否有某个权限
 */
Role.prototype.hasPermission = function(permission) {
  const permissions = this.permissions || {};
  return permissions[permission] === true;
};

/**
 * 实例方法：添加权限
 */
Role.prototype.addPermission = async function(permission) {
  const permissions = this.permissions || {};
  permissions[permission] = true;
  this.permissions = permissions;
  await this.save();
};

/**
 * 实例方法：移除权限
 */
Role.prototype.removePermission = async function(permission) {
  const permissions = this.permissions || {};
  delete permissions[permission];
  this.permissions = permissions;
  await this.save();
};

/**
 * 实例方法：批量设置权限
 */
Role.prototype.setPermissions = async function(permissionList) {
  const permissions = {};
  permissionList.forEach(permission => {
    permissions[permission] = true;
  });
  this.permissions = permissions;
  await this.save();
};

/**
 * 实例方法：获取所有权限列表
 */
Role.prototype.getPermissionList = function() {
  const permissions = this.permissions || {};
  return Object.keys(permissions).filter(key => permissions[key] === true);
};

/**
 * 实例方法：获取角色员工数量
 */
Role.prototype.getEmployeeCount = async function() {
  const EmployeeRole = require('./EmployeeRole');
  return await EmployeeRole.count({
    where: { roleId: this.id }
  });
};

/**
 * 类方法：获取系统预定义角色
 */
Role.getSystemRoles = function() {
  return [
    {
      name: '超级管理员',
      code: 'SUPER_ADMIN',
      description: '拥有系统所有权限',
      isSystem: true,
      permissions: {
        '*': true // 所有权限
      }
    },
    {
      name: '管理员',
      code: 'ADMIN',
      description: '管理系统配置和用户',
      isSystem: true,
      permissions: {
        'system.manage': true,
        'employee.manage': true,
        'department.manage': true,
        'role.manage': true,
        'client.manage': true,
        'client.view': true,
        'client.create': true,
        'client.edit': true,
        'client.delete': true,
        'call.manage': true,
        'call.view': true,
        'report.view': true
      }
    },
    {
      name: '部门经理',
      code: 'MANAGER',
      description: '管理部门员工和客户',
      isSystem: true,
      permissions: {
        'employee.view': true,
        'client.manage': true,
        'client.view': true,
        'client.create': true,
        'client.edit': true,
        'client.assign': true,
        'call.view': true,
        'call.create': true,
        'report.view': true
      }
    },
    {
      name: '销售人员',
      code: 'SALES',
      description: '管理客户和外呼记录',
      isSystem: true,
      permissions: {
        'client.view': true,
        'client.create': true,
        'client.edit': true,
        'call.view': true,
        'call.create': true,
        'call.edit': true
      }
    },
    {
      name: '普通员工',
      code: 'EMPLOYEE',
      description: '基本查看权限',
      isSystem: true,
      permissions: {
        'client.view': true,
        'call.view': true
      }
    }
  ];
};

/**
 * 类方法：初始化系统角色
 */
Role.initSystemRoles = async function() {
  const systemRoles = Role.getSystemRoles();
  
  for (const roleData of systemRoles) {
    const [role, created] = await Role.findOrCreate({
      where: { code: roleData.code },
      defaults: roleData
    });

    if (!created) {
      // 更新权限
      await role.update({
        permissions: roleData.permissions,
        description: roleData.description
      });
    }
  }

  return systemRoles.length;
};

/**
 * 钩子：删除前验证
 */
Role.beforeDestroy(async (role) => {
  // 系统角色不能删除
  if (role.isSystem) {
    throw new Error('系统角色不能删除');
  }

  // 检查是否有员工使用该角色
  const count = await role.getEmployeeCount();
  if (count > 0) {
    throw new Error(`该角色下还有 ${count} 个员工，无法删除`);
  }
});

/**
 * 钩子：更新前验证
 */
Role.beforeUpdate(async (role) => {
  // 系统角色的编码不能修改
  if (role.isSystem && role.changed('code')) {
    throw new Error('系统角色编码不能修改');
  }
});

return Role;
};

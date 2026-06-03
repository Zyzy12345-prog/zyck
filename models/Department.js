/**
 * 部门模型
 * 支持树形结构的部门管理
 */
module.exports = (sequelize, DataTypes) => {
const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '部门ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '部门名称',
    validate: {
      notEmpty: {
        msg: '部门名称不能为空'
      },
      len: {
        args: [2, 100],
        msg: '部门名称长度必须在2-100个字符之间'
      }
    }
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '部门编码',
    validate: {
      notEmpty: {
        msg: '部门编码不能为空'
      },
      is: {
        args: /^[A-Z0-9_]+$/,
        msg: '部门编码只能包含大写字母、数字和下划线'
      }
    }
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '父部门ID'
  },
  managerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '部门经理ID'
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '部门层级',
    validate: {
      min: {
        args: 1,
        msg: '部门层级不能小于1'
      },
      max: {
        args: 5,
        msg: '部门层级不能超过5级'
      }
    }
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序顺序'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '部门描述'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'deleted'),
    allowNull: false,
    defaultValue: 'active',
    comment: '状态'
  }
}, {
  tableName: 'departments',
  timestamps: true,
  underscored: true, // 使用下划线命名（created_at, updated_at）
  paranoid: false,
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['parentId'] },
    { fields: ['status'] }
  ]
});

/**
 * 定义关联关系
 */
Department.associate = (models) => {
  // 自关联：父部门
  Department.belongsTo(models.Department, {
    as: 'parent',
    foreignKey: 'parentId'
  });

  // 自关联：子部门
  Department.hasMany(models.Department, {
    as: 'children',
    foreignKey: 'parentId'
  });

  // 注意：暂时注释掉与 Employee 的所有关联
  // 因为当前数据库结构不支持这些关联
  // Department.belongsTo(models.Employee, {
  //   as: 'manager',
  //   foreignKey: 'managerId'
  // });

  // 注意：当前 employees 表中的 department 字段是字符串类型，不是外键
  // 暂时注释掉关联，等待数据库迁移后再启用
  // Department.hasMany(models.Employee, {
  //   as: 'employees',
  //   foreignKey: 'departmentId'
  // });
};

/**
 * 实例方法：获取完整路径
 */
Department.prototype.getFullPath = async function() {
  const path = [this.name];
  let current = this;

  while (current.parentId) {
    current = await Department.findByPk(current.parentId);
    if (current) {
      path.unshift(current.name);
    } else {
      break;
    }
  }

  return path.join(' > ');
};

/**
 * 实例方法：获取所有子部门（递归）
 */
Department.prototype.getAllChildren = async function() {
  const children = await Department.findAll({
    where: { parentId: this.id, status: 'active' }
  });

  const allChildren = [...children];

  for (const child of children) {
    const subChildren = await child.getAllChildren();
    allChildren.push(...subChildren);
  }

  return allChildren;
};

/**
 * 实例方法：获取部门员工数量
 * 注意：当前数据库中 department 是字符串字段，不是外键
 */
Department.prototype.getEmployeeCount = async function() {
  const Employee = sequelize.models.Employee;
  return await Employee.count({
    where: {
      department: this.name, // 使用部门名称匹配
      status: 'active'
    }
  });
};

/**
 * 类方法：获取树形结构
 */
Department.getTree = async function(parentId = null) {
  const departments = await Department.findAll({
    where: {
      parentId: parentId,
      status: 'active'
    },
    order: [['sortOrder', 'ASC'], ['name', 'ASC']]
  });

  const tree = [];

  for (const dept of departments) {
    const node = dept.toJSON();
    node.children = await Department.getTree(dept.id);
    node.employeeCount = await dept.getEmployeeCount();
    tree.push(node);
  }

  return tree;
};

/**
 * 类方法：验证部门编码唯一性
 */
Department.isCodeUnique = async function(code, excludeId = null) {
  const where = { code };
  if (excludeId) {
    where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
  }

  const count = await Department.count({ where });
  return count === 0;
};

/**
 * 钩子：创建前验证
 */
Department.beforeCreate(async (department) => {
  // 验证编码唯一性
  const isUnique = await Department.isCodeUnique(department.code);
  if (!isUnique) {
    throw new Error('部门编码已存在');
  }

  // 如果有父部门，自动设置层级
  if (department.parentId) {
    const parent = await Department.findByPk(department.parentId);
    if (parent) {
      department.level = parent.level + 1;
    }
  }
});

/**
 * 钩子：更新前验证
 */
Department.beforeUpdate(async (department) => {
  // 验证编码唯一性
  if (department.changed('code')) {
    const isUnique = await Department.isCodeUnique(department.code, department.id);
    if (!isUnique) {
      throw new Error('部门编码已存在');
    }
  }

  // 防止设置自己为父部门
  if (department.parentId === department.id) {
    throw new Error('不能将自己设置为父部门');
  }

  // 更新层级
  if (department.changed('parentId')) {
    if (department.parentId) {
      const parent = await Department.findByPk(department.parentId);
      if (parent) {
        department.level = parent.level + 1;
      }
    } else {
      department.level = 1;
    }
  }
});

return Department;
};



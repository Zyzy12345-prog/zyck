module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define('Permission', {
    // 主键
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '权限ID'
    },
    
    // 权限代码（唯一标识）
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 100],
        is: /^[a-z_:]+$/i // 格式：module:action，如 client:read
      },
      comment: '权限代码（如：client:read, client:write, call:create）'
    },
    
    // 权限名称
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      },
      comment: '权限名称（如：查看客户、编辑客户）'
    },
    
    // 所属模块
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50],
        isIn: {
          args: [['client', 'call', 'employee', 'role', 'permission', 'report', 'system', 'dashboard', 'assignment']],
          msg: '模块必须是预定义的值之一'
        }
      },
      comment: '所属模块（client, call, employee, role, permission, report, system等）'
    },
    
    // 权限动作
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50],
        isIn: {
          args: [['read', 'write', 'create', 'update', 'delete', 'export', 'import', 'manage', 'view', 'execute']],
          msg: '动作必须是预定义的值之一'
        }
      },
      comment: '权限动作（read, write, create, update, delete, export, import, manage等）'
    },
    
    // 权限描述
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '权限描述'
    },
    
    // 权限分组（用于前端展示）
    group: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '权限分组（用于前端分组展示）'
    },
    
    // 是否启用
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
      comment: '是否启用'
    },
    
    // 是否系统内置权限（不可删除）
    isSystem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_system',
      comment: '是否系统内置权限'
    },
    
    // 排序顺序
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
      comment: '排序顺序（数字越小越靠前）'
    },
    
    // 时间戳
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
      comment: '创建时间'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
      comment: '更新时间'
    }
  }, {
    tableName: 'permissions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['code'],
        name: 'idx_permission_code'
      },
      {
        fields: ['module'],
        name: 'idx_permission_module'
      },
      {
        fields: ['action'],
        name: 'idx_permission_action'
      },
      {
        fields: ['is_active'],
        name: 'idx_permission_active'
      },
      {
        fields: ['is_system'],
        name: 'idx_permission_system'
      },
      {
        fields: ['group'],
        name: 'idx_permission_group'
      },
      {
        fields: ['sort_order'],
        name: 'idx_permission_sort'
      },
      {
        fields: ['module', 'action'],
        name: 'idx_permission_module_action'
      }
    ],
    hooks: {
      // 创建前自动生成code（如果没有提供）
      beforeValidate: (permission) => {
        if (!permission.code && permission.module && permission.action) {
          permission.code = `${permission.module}:${permission.action}`;
        }
      }
    }
  });

  // ==================== 关联关系 ====================
  Permission.associate = function(models) {
    // 权限和角色多对多关系
    Permission.belongsToMany(models.Role, {
      through: 'role_permissions',
      foreignKey: 'permissionId',
      otherKey: 'roleId',
      as: 'roles',
      timestamps: true
    });
  };

  // ==================== 实例方法 ====================
  
  /**
   * 检查是否可以删除
   * @returns {boolean} 是否可以删除
   */
  Permission.prototype.canDelete = function() {
    return !this.isSystem;
  };

  /**
   * 检查是否启用
   * @returns {boolean} 是否启用
   */
  Permission.prototype.isEnabled = function() {
    return this.isActive === true;
  };

  /**
   * 获取权限的角色数量
   * @returns {Promise<number>} 角色数量
   */
  Permission.prototype.getRoleCount = async function() {
    const count = await this.countRoles();
    return count;
  };

  /**
   * 获取完整的权限标识
   * @returns {string} 权限标识（module:action）
   */
  Permission.prototype.getFullCode = function() {
    return this.code || `${this.module}:${this.action}`;
  };

  // ==================== 类方法（静态方法）====================
  
  /**
   * 根据权限代码查找权限
   * @param {string} code - 权限代码
   * @returns {Promise<Permission|null>} 权限实例或null
   */
  Permission.findByCode = async function(code) {
    return await this.findOne({ where: { code } });
  };

  /**
   * 根据模块查找权限
   * @param {string} module - 模块名称
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Permission>>} 权限列表
   */
  Permission.findByModule = async function(module, options = {}) {
    return await this.findAll({
      where: { module, isActive: true },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      ...options
    });
  };

  /**
   * 根据动作查找权限
   * @param {string} action - 动作名称
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Permission>>} 权限列表
   */
  Permission.findByAction = async function(action, options = {}) {
    return await this.findAll({
      where: { action, isActive: true },
      order: [['module', 'ASC'], ['sortOrder', 'ASC']],
      ...options
    });
  };

  /**
   * 获取所有启用的权限
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Permission>>} 权限列表
   */
  Permission.getActivePermissions = async function(options = {}) {
    return await this.findAll({
      where: { isActive: true },
      order: [['module', 'ASC'], ['sortOrder', 'ASC'], ['name', 'ASC']],
      ...options
    });
  };

  /**
   * 获取系统内置权限
   * @returns {Promise<Array<Permission>>} 系统权限列表
   */
  Permission.getSystemPermissions = async function() {
    return await this.findAll({
      where: { isSystem: true },
      order: [['module', 'ASC'], ['sortOrder', 'ASC']]
    });
  };

  /**
   * 获取自定义权限
   * @returns {Promise<Array<Permission>>} 自定义权限列表
   */
  Permission.getCustomPermissions = async function() {
    return await this.findAll({
      where: { isSystem: false },
      order: [['module', 'ASC'], ['sortOrder', 'ASC']]
    });
  };

  /**
   * 按模块分组获取权限
   * @returns {Promise<Object>} 按模块分组的权限对象
   */
  Permission.getGroupedByModule = async function() {
    const permissions = await this.getActivePermissions();
    const grouped = {};
    
    permissions.forEach(permission => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });
    
    return grouped;
  };

  /**
   * 按分组获取权限
   * @returns {Promise<Object>} 按分组的权限对象
   */
  Permission.getGroupedByGroup = async function() {
    const permissions = await this.getActivePermissions();
    const grouped = {};
    
    permissions.forEach(permission => {
      const group = permission.group || 'other';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(permission);
    });
    
    return grouped;
  };

  /**
   * 批量创建权限
   * @param {Array<Object>} permissionsData - 权限数据数组
   * @returns {Promise<Array<Permission>>} 创建的权限列表
   */
  Permission.bulkCreatePermissions = async function(permissionsData) {
    return await this.bulkCreate(permissionsData, {
      ignoreDuplicates: true,
      validate: true
    });
  };

  /**
   * 根据模块和动作查找或创建权限
   * @param {string} module - 模块名称
   * @param {string} action - 动作名称
   * @param {Object} defaults - 默认值
   * @returns {Promise<[Permission, boolean]>} [权限实例, 是否新创建]
   */
  Permission.findOrCreateByModuleAction = async function(module, action, defaults = {}) {
    const code = `${module}:${action}`;
    return await this.findOrCreate({
      where: { code },
      defaults: {
        module,
        action,
        name: defaults.name || `${module} ${action}`,
        description: defaults.description || '',
        ...defaults
      }
    });
  };

  return Permission;
};





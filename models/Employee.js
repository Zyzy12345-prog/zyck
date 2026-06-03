const bcrypt = require('bcryptjs');

/**
 * 员工模型
 * 完整的员工信息管理
 */
module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '员工ID'
    },
    employeeNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '工号',
      validate: {
        notEmpty: {
          msg: '工号不能为空'
        }
      }
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '姓名',
      validate: {
        notEmpty: {
          msg: '姓名不能为空'
        },
        len: {
          args: [2, 50],
          msg: '姓名长度必须在2-50个字符之间'
        }
      }
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '用户名',
      validate: {
        notEmpty: {
          msg: '用户名不能为空'
        },
        len: {
          args: [3, 50],
          msg: '用户名长度必须在3-50个字符之间'
        }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '密码',
      validate: {
        len: {
          args: [6, 255],
          msg: '密码长度必须至少6个字符'
        }
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      comment: '邮箱',
      validate: {
        isEmail: {
          msg: '邮箱格式不正确'
        }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '手机号',
      validate: {
        is: {
          args: /^1[3-9]\d{9}$/,
          msg: '手机号格式不正确'
        }
      }
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '头像URL'
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true,
      comment: '性别'
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '出生日期'
    },
    idCard: {
      type: DataTypes.STRING(18),
      allowNull: true,
      comment: '身份证号',
      validate: {
        is: {
          args: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
          msg: '身份证号格式不正确'
        }
      }
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '部门ID'
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '职位'
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '角色ID'
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '入职日期'
    },
    resignDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '离职日期'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态：active-在职，inactive-离职，suspended-停用'
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '地址'
    },
    emergencyContact: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '紧急联系人'
    },
    emergencyPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '紧急联系电话'
    },
    education: {
      type: DataTypes.ENUM('primary', 'junior', 'senior', 'associate', 'bachelor', 'master', 'doctor'),
      allowNull: true,
      comment: '学历'
    },
    major: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '专业'
    },
    graduateSchool: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '毕业院校'
    },
    workExperience: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '工作经历'
    },
    skills: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: '技能标签',
      defaultValue: []
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后登录时间'
    },
    lastLoginIp: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '最后登录IP'
    }
  }, {
    tableName: 'employees',
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      { fields: ['employee_no'], unique: true },
      { fields: ['username'], unique: true },
      { fields: ['email'], unique: true },
      { fields: ['phone'] },
      { fields: ['department_id'] },
      { fields: ['role_id'] },
      { fields: ['status'] }
    ],
    hooks: {
      beforeCreate: async (employee) => {
        // 加密密码
        if (employee.password) {
          employee.password = await bcrypt.hash(employee.password, 10);
        }
      },
      beforeUpdate: async (employee) => {
        // 如果密码被修改，重新加密
        if (employee.changed('password')) {
          employee.password = await bcrypt.hash(employee.password, 10);
        }
      }
    }
  });

  /**
   * 定义关联关系
   */
  Employee.associate = (models) => {
    // 关联部门
    Employee.belongsTo(models.Department, {
      as: 'department',
      foreignKey: 'departmentId'
    });

    // 关联角色
    Employee.belongsTo(models.Role, {
      as: 'role',
      foreignKey: 'roleId'
    });

    // 关联客户分配
    Employee.hasMany(models.Assignment, {
      as: 'assignments',
      foreignKey: 'userId'
    });

    // 关联通话记录
    Employee.hasMany(models.CallRecord, {
      as: 'callRecords',
      foreignKey: 'userId'
    });
  };

  /**
   * 实例方法：验证密码
   */
  Employee.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  /**
   * 实例方法：生成JWT Token
   */
  Employee.prototype.generateToken = function() {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        id: this.id,
        username: this.username,
        roleId: this.roleId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
  };

  /**
   * 实例方法：更新最后登录信息
   */
  Employee.prototype.updateLastLogin = async function(ip) {
    this.lastLoginAt = new Date();
    this.lastLoginIp = ip;
    await this.save();
  };

  /**
   * 实例方法：JSON序列化（隐藏敏感信息）
   */
  Employee.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.idCard; // 隐藏身份证号
    return values;
  };

  /**
   * 类方法：生成工号
   */
  Employee.generateEmployeeNo = async function() {
    const prefix = 'EMP';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // 查找当月最大序号
    const lastEmployee = await Employee.findOne({
      where: {
        employeeNo: {
          [sequelize.Sequelize.Op.like]: `${prefix}${year}${month}%`
        }
      },
      order: [['employeeNo', 'DESC']]
    });

    let sequence = 1;
    if (lastEmployee) {
      const lastSequence = parseInt(lastEmployee.employeeNo.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${year}${month}${sequence.toString().padStart(4, '0')}`;
  };

  /**
   * 类方法：重置密码
   */
  Employee.resetPassword = async function(employeeId) {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new Error('员工不存在');
    }

    // 生成随机密码
    const newPassword = Math.random().toString(36).slice(-8);
    employee.password = newPassword;
    await employee.save();

    return newPassword;
  };

  return Employee;
};


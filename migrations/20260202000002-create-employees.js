'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employees', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '员工ID'
      },
      employeeNo: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '员工工号'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '员工姓名'
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '登录用户名'
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '登录密码（加密）'
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
        comment: '邮箱'
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: '手机号码'
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: '头像URL'
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'other'),
        allowNull: true,
        comment: '性别'
      },
      birthDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '出生日期'
      },
      idCard: {
        type: Sequelize.STRING(18),
        allowNull: true,
        comment: '身份证号'
      },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '所属部门ID'
      },
      position: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '职位'
      },
      level: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '职级'
      },
      hireDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '入职日期'
      },
      resignDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '离职日期'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'resigned', 'deleted'),
        allowNull: false,
        defaultValue: 'active',
        comment: '状态：active-在职，inactive-停用，resigned-离职，deleted-已删除'
      },
      isAdmin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否管理员'
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '最后登录时间'
      },
      lastLoginIp: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '最后登录IP'
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '备注'
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '创建人ID'
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '更新人ID'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '创建时间'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '更新时间'
      }
    });

    // 添加索引
    await queryInterface.addIndex('employees', ['employeeNo'], {
      name: 'idx_employees_employee_no',
      unique: true
    });
    
    await queryInterface.addIndex('employees', ['username'], {
      name: 'idx_employees_username',
      unique: true
    });
    
    await queryInterface.addIndex('employees', ['email'], {
      name: 'idx_employees_email',
      unique: true,
      where: {
        email: {
          [Sequelize.Op.ne]: null
        }
      }
    });
    
    await queryInterface.addIndex('employees', ['departmentId'], {
      name: 'idx_employees_department_id'
    });
    
    await queryInterface.addIndex('employees', ['status'], {
      name: 'idx_employees_status'
    });
    
    await queryInterface.addIndex('employees', ['phone'], {
      name: 'idx_employees_phone'
    });

    // 添加表注释
    await queryInterface.sequelize.query(
      "COMMENT ON TABLE employees IS '员工表'"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employees');
  }
};












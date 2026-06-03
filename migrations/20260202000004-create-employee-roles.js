'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '关联ID'
      },
      employeeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '员工ID'
      },
      roleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '角色ID'
      },
      assignedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '分配人ID'
      },
      assignedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '分配时间'
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

    // 添加唯一索引（一个员工不能重复分配同一个角色）
    await queryInterface.addIndex('employee_roles', ['employeeId', 'roleId'], {
      name: 'idx_employee_roles_unique',
      unique: true
    });
    
    // 添加外键索引
    await queryInterface.addIndex('employee_roles', ['employeeId'], {
      name: 'idx_employee_roles_employee_id'
    });
    
    await queryInterface.addIndex('employee_roles', ['roleId'], {
      name: 'idx_employee_roles_role_id'
    });

    // 添加表注释
    await queryInterface.sequelize.query(
      "COMMENT ON TABLE employee_roles IS '员工角色关联表'"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employee_roles');
  }
};












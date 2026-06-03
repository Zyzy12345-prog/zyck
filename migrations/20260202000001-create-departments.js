'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('departments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '部门ID'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '部门名称'
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '部门编码'
      },
      parentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '父部门ID'
      },
      managerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '部门经理ID（关联员工表）'
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '部门层级（1-一级部门，2-二级部门...）'
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '排序顺序'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '部门描述'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'deleted'),
        allowNull: false,
        defaultValue: 'active',
        comment: '状态：active-正常，inactive-停用，deleted-已删除'
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
    await queryInterface.addIndex('departments', ['code'], {
      name: 'idx_departments_code',
      unique: true
    });
    
    await queryInterface.addIndex('departments', ['parentId'], {
      name: 'idx_departments_parent_id'
    });
    
    await queryInterface.addIndex('departments', ['status'], {
      name: 'idx_departments_status'
    });

    // 添加表注释
    await queryInterface.sequelize.query(
      "COMMENT ON TABLE departments IS '部门表'"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('departments');
  }
};












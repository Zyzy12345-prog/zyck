'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '角色ID'
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '角色名称'
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '角色编码'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '角色描述'
      },
      permissions: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: '权限配置（JSON格式）'
      },
      isSystem: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否系统角色（系统角色不可删除）'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'deleted'),
        allowNull: false,
        defaultValue: 'active',
        comment: '状态：active-正常，inactive-停用，deleted-已删除'
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '排序顺序'
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
    await queryInterface.addIndex('roles', ['code'], {
      name: 'idx_roles_code',
      unique: true
    });
    
    await queryInterface.addIndex('roles', ['status'], {
      name: 'idx_roles_status'
    });

    // 添加表注释
    await queryInterface.sequelize.query(
      "COMMENT ON TABLE roles IS '角色表'"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('roles');
  }
};












'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 创建行业分类表
    await queryInterface.createTable('industry_categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '父级ID，0表示一级分类'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '行业名称'
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '行业代码'
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '层级：1=一级分类，2=二级分类，3=三级分类'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否启用'
      },
      keywords: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '关键词，用于智能匹配'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '排序顺序'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 创建索引
    await queryInterface.addIndex('industry_categories', ['parent_id'], {
      name: 'idx_industry_parent_id'
    });
    await queryInterface.addIndex('industry_categories', ['level'], {
      name: 'idx_industry_level'
    });
    await queryInterface.addIndex('industry_categories', ['is_active'], {
      name: 'idx_industry_is_active'
    });
    await queryInterface.addIndex('industry_categories', ['code'], {
      name: 'idx_industry_code',
      unique: true,
      where: { code: { [Sequelize.Op.ne]: null } }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('industry_categories');
  }
};






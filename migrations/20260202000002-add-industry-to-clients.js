'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. 重命名原有的 industry 字段为 original_industry
    await queryInterface.renameColumn('clients', 'industry', 'original_industry');

    // 2. 添加 industry_id 字段（外键关联行业分类表）
    await queryInterface.addColumn('clients', 'industry_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '行业分类ID',
      references: {
        model: 'industry_categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 3. 创建索引
    await queryInterface.addIndex('clients', ['industry_id'], {
      name: 'idx_clients_industry_id'
    });

    console.log('✅ 客户表行业字段更新完成');
    console.log('   - original_industry: 保留原始行业文本');
    console.log('   - industry_id: 关联行业分类表');
  },

  async down(queryInterface, Sequelize) {
    // 移除索引
    await queryInterface.removeIndex('clients', 'idx_clients_industry_id');
    
    // 移除 industry_id 字段
    await queryInterface.removeColumn('clients', 'industry_id');
    
    // 恢复原字段名
    await queryInterface.renameColumn('clients', 'original_industry', 'industry');
  }
};






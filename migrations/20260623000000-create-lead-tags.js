'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. 创建线索标签表
    await queryInterface.createTable('lead_tags', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '标签名称'
      },
      color: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: '#1890ff',
        comment: '标签颜色'
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '标签分类'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '标签描述'
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否系统标签'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '排序顺序'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '创建人'
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

    // 2. 修改 lead_tag_relations 的外键引用：从 customer_tags 改为 lead_tags
    // 先删除旧的外键约束，再创建新的
    await queryInterface.sequelize.query(`
      ALTER TABLE lead_tag_relations
      DROP CONSTRAINT IF EXISTS lead_tag_relations_tag_id_fkey;
    `);

    await queryInterface.changeColumn('lead_tag_relations', 'tag_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'lead_tags',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // 3. 插入默认系统标签
    await queryInterface.bulkInsert('lead_tags', [
      { name: '高意向', color: '#f5222d', category: '意向', is_system: true, sort_order: 1, created_at: new Date(), updated_at: new Date() },
      { name: '中意向', color: '#fa8c16', category: '意向', is_system: true, sort_order: 2, created_at: new Date(), updated_at: new Date() },
      { name: '低意向', color: '#8c8c8c', category: '意向', is_system: true, sort_order: 3, created_at: new Date(), updated_at: new Date() },
      { name: '大客户', color: '#722ed1', category: '客户级别', is_system: true, sort_order: 4, created_at: new Date(), updated_at: new Date() },
      { name: '中小企业', color: '#1890ff', category: '客户级别', is_system: true, sort_order: 5, created_at: new Date(), updated_at: new Date() },
      { name: '紧急跟进', color: '#eb2f96', category: '状态', is_system: true, sort_order: 6, created_at: new Date(), updated_at: new Date() },
      { name: '需回访', color: '#faad14', category: '状态', is_system: true, sort_order: 7, created_at: new Date(), updated_at: new Date() },
      { name: '已报价', color: '#52c41a', category: '销售阶段', is_system: true, sort_order: 8, created_at: new Date(), updated_at: new Date() },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // 恢复外键引用回 customer_tags
    await queryInterface.sequelize.query(`
      ALTER TABLE lead_tag_relations
      DROP CONSTRAINT IF EXISTS lead_tag_relations_tag_id_fkey;
    `);

    await queryInterface.changeColumn('lead_tag_relations', 'tag_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'customer_tags',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.dropTable('lead_tags');
  }
};

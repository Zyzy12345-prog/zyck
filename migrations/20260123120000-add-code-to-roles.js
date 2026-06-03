'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 检查 code 字段是否已存在
    const tableDescription = await queryInterface.describeTable('roles');
    
    if (!tableDescription.code) {
      // 1. 添加 code 字段（允许为空，因为现有数据没有这个值）
      await queryInterface.addColumn('roles', 'code', {
        type: Sequelize.STRING(50),
        allowNull: true, // 先允许为空
        comment: '角色代码'
      });

      // 2. 为现有角色生成 code 值
      // 获取所有现有角色
      const [roles] = await queryInterface.sequelize.query(
        'SELECT id, name FROM roles'
      );

      // 为每个角色生成 code
      for (const role of roles) {
        let code = role.name.toUpperCase().replace(/\s+/g, '_');
        await queryInterface.sequelize.query(
          'UPDATE roles SET code = :code WHERE id = :id',
          {
            replacements: { code, id: role.id }
          }
        );
      }

      // 3. 将 code 字段改为不允许为空
      await queryInterface.changeColumn('roles', 'code', {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '角色代码'
      });

      // 4. 创建唯一索引（如果不存在）
      try {
        await queryInterface.addIndex('roles', ['code'], {
          unique: true,
          name: 'idx_role_code'
        });
      } catch (error) {
        // 索引可能已存在，忽略错误
        console.log('索引 idx_role_code 可能已存在');
      }

      console.log('✅ 成功为 roles 表添加 code 字段');
    } else {
      console.log('ℹ️  code 字段已存在，跳过迁移');
    }

    // 检查并添加其他可能缺失的字段
    if (!tableDescription.level) {
      await queryInterface.addColumn('roles', 'level', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '角色等级（1-100）'
      });
      console.log('✅ 添加 level 字段');
    }

    if (!tableDescription.is_active) {
      await queryInterface.addColumn('roles', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否启用'
      });
      console.log('✅ 添加 is_active 字段');
    }

    if (!tableDescription.is_system) {
      await queryInterface.addColumn('roles', 'is_system', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否系统内置角色'
      });
      console.log('✅ 添加 is_system 字段');
    }

    // 创建其他索引
    const indexes = [
      { fields: ['is_active'], name: 'idx_role_active' },
      { fields: ['level'], name: 'idx_role_level' },
      { fields: ['is_system'], name: 'idx_role_system' }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('roles', index.fields, {
          name: index.name
        });
      } catch (error) {
        // 索引可能已存在，忽略错误
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // 删除索引
    const indexesToRemove = ['idx_role_code', 'idx_role_active', 'idx_role_level', 'idx_role_system'];
    
    for (const indexName of indexesToRemove) {
      try {
        await queryInterface.removeIndex('roles', indexName);
      } catch (error) {
        // 索引可能不存在，忽略错误
      }
    }

    // 删除字段
    const tableDescription = await queryInterface.describeTable('roles');
    
    if (tableDescription.code) {
      await queryInterface.removeColumn('roles', 'code');
    }
    if (tableDescription.level) {
      await queryInterface.removeColumn('roles', 'level');
    }
    if (tableDescription.is_active) {
      await queryInterface.removeColumn('roles', 'is_active');
    }
    if (tableDescription.is_system) {
      await queryInterface.removeColumn('roles', 'is_system');
    }

    console.log('✅ 回滚完成');
  }
};





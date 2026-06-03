'use strict';

/**
 * 数据库迁移 - 更新外呼记录表（简化版）
 * 
 * 策略：
 * - 不修改现有的 call_type 字段
 * - 只添加新字段
 * - 保持向后兼容
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 获取现有列
      const tableDescription = await queryInterface.describeTable('call_records');
      
      // 辅助函数：检查列是否存在
      const columnExists = (columnName) => {
        return tableDescription[columnName] !== undefined;
      };

      console.log('开始添加新字段...');

      // 1. 添加新字段（只添加不存在的）
      if (!columnExists('phone_number')) {
        console.log('添加 phone_number...');
        await queryInterface.addColumn('call_records', 'phone_number', {
          type: Sequelize.STRING(20),
          allowNull: true,
        }, { transaction });
      }

      if (!columnExists('direction')) {
        console.log('添加 direction...');
        await queryInterface.addColumn('call_records', 'direction', {
          type: Sequelize.ENUM('inbound', 'outbound'),
          allowNull: false,
          defaultValue: 'outbound',
        }, { transaction });
      }

      if (!columnExists('start_time')) {
        console.log('添加 start_time...');
        await queryInterface.addColumn('call_records', 'start_time', {
          type: Sequelize.DATE,
          allowNull: true,
        }, { transaction });
      }

      if (!columnExists('end_time')) {
        console.log('添加 end_time...');
        await queryInterface.addColumn('call_records', 'end_time', {
          type: Sequelize.DATE,
          allowNull: true,
        }, { transaction });
      }

      if (!columnExists('status')) {
        console.log('添加 status...');
        await queryInterface.addColumn('call_records', 'status', {
          type: Sequelize.ENUM('initiated', 'ringing', 'answered', 'completed', 'no_answer', 'busy', 'failed'),
          allowNull: false,
          defaultValue: 'completed',
        }, { transaction });
      }

      if (!columnExists('hangup_cause')) {
        console.log('添加 hangup_cause...');
        await queryInterface.addColumn('call_records', 'hangup_cause', {
          type: Sequelize.STRING(100),
          allowNull: true,
        }, { transaction });
      }

      if (!columnExists('recording_url')) {
        console.log('添加 recording_url...');
        await queryInterface.addColumn('call_records', 'recording_url', {
          type: Sequelize.STRING(1000),
          allowNull: true,
        }, { transaction });
      }

      if (!columnExists('recording_duration')) {
        console.log('添加 recording_duration...');
        await queryInterface.addColumn('call_records', 'recording_duration', {
          type: Sequelize.INTEGER,
          allowNull: true,
        }, { transaction });
      }

      if (!columnExists('notes')) {
        console.log('添加 notes...');
        await queryInterface.addColumn('call_records', 'notes', {
          type: Sequelize.TEXT,
          allowNull: true,
        }, { transaction });
      }

      if (!columnExists('tags')) {
        console.log('添加 tags...');
        await queryInterface.addColumn('call_records', 'tags', {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true,
          defaultValue: [],
        }, { transaction });
      }

      if (!columnExists('satisfaction')) {
        console.log('添加 satisfaction...');
        await queryInterface.addColumn('call_records', 'satisfaction', {
          type: Sequelize.INTEGER,
          allowNull: true,
        }, { transaction });
      }

      if (!columnExists('follow_up_action')) {
        console.log('添加 follow_up_action...');
        await queryInterface.addColumn('call_records', 'follow_up_action', {
          type: Sequelize.STRING(500),
          allowNull: true,
        }, { transaction });
      }

      if (!columnExists('follow_up_date')) {
        console.log('添加 follow_up_date...');
        await queryInterface.addColumn('call_records', 'follow_up_date', {
          type: Sequelize.DATE,
          allowNull: true,
        }, { transaction });
      }

      if (!columnExists('provider')) {
        console.log('添加 provider...');
        await queryInterface.addColumn('call_records', 'provider', {
          type: Sequelize.ENUM('virtual', 'twilio', 'aliyun', 'tencent', 'other'),
          allowNull: true,
          defaultValue: 'virtual',
        }, { transaction });
      }

      if (!columnExists('external_call_id')) {
        console.log('添加 external_call_id...');
        await queryInterface.addColumn('call_records', 'external_call_id', {
          type: Sequelize.STRING(100),
          allowNull: true,
        }, { transaction });
      }

      if (!columnExists('provider_data')) {
        console.log('添加 provider_data...');
        await queryInterface.addColumn('call_records', 'provider_data', {
          type: Sequelize.JSONB,
          allowNull: true,
        }, { transaction });
      }

      // 2. 填充 phone_number
      if (columnExists('phone_number')) {
        console.log('填充 phone_number...');
        await queryInterface.sequelize.query(`
          UPDATE call_records cr
          SET phone_number = COALESCE(c.phone, '未知号码')
          FROM clients c
          WHERE cr.client_id = c.id AND (cr.phone_number IS NULL OR cr.phone_number = '')
        `, { transaction });

        await queryInterface.sequelize.query(`
          UPDATE call_records
          SET phone_number = '未知号码'
          WHERE phone_number IS NULL OR phone_number = ''
        `, { transaction });

        // 设置为不可空
        console.log('设置 phone_number 为必填...');
        await queryInterface.sequelize.query(`
          ALTER TABLE call_records 
          ALTER COLUMN phone_number SET NOT NULL
        `, { transaction });
      }

      // 3. 添加索引（检查是否存在）
      console.log('添加索引...');
      const indexes = await queryInterface.showIndex('call_records', { transaction });
      const indexNames = indexes.map(idx => idx.name);

      if (!indexNames.includes('idx_call_records_phone_number')) {
        await queryInterface.addIndex('call_records', ['phone_number'], {
          name: 'idx_call_records_phone_number',
          transaction
        });
      }

      if (!indexNames.includes('idx_call_records_status')) {
        await queryInterface.addIndex('call_records', ['status'], {
          name: 'idx_call_records_status',
          transaction
        });
      }

      if (!indexNames.includes('idx_call_records_direction')) {
        await queryInterface.addIndex('call_records', ['direction'], {
          name: 'idx_call_records_direction',
          transaction
        });
      }

      if (!indexNames.includes('idx_call_records_follow_up_date')) {
        await queryInterface.addIndex('call_records', ['follow_up_date'], {
          name: 'idx_call_records_follow_up_date',
          transaction
        });
      }

      if (!indexNames.includes('idx_call_records_external_call_id')) {
        await queryInterface.addIndex('call_records', ['external_call_id'], {
          name: 'idx_call_records_external_call_id',
          transaction
        });
      }

      if (!indexNames.includes('idx_call_records_status_direction')) {
        await queryInterface.addIndex('call_records', ['status', 'direction'], {
          name: 'idx_call_records_status_direction',
          transaction
        });
      }

      await transaction.commit();
      console.log('✅ 外呼记录表更新完成');
      console.log('');
      console.log('注意：call_type 字段保持原样（inbound/outbound）');
      console.log('新的呼叫类型使用 direction 字段');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ 迁移失败:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 删除索引
      const indexes = await queryInterface.showIndex('call_records', { transaction });
      const indexNames = indexes.map(idx => idx.name);

      const indexesToRemove = [
        'idx_call_records_phone_number',
        'idx_call_records_status',
        'idx_call_records_direction',
        'idx_call_records_follow_up_date',
        'idx_call_records_external_call_id',
        'idx_call_records_status_direction'
      ];

      for (const indexName of indexesToRemove) {
        if (indexNames.includes(indexName)) {
          await queryInterface.removeIndex('call_records', indexName, { transaction });
        }
      }

      // 获取现有列
      const tableDescription = await queryInterface.describeTable('call_records');
      const columnExists = (columnName) => tableDescription[columnName] !== undefined;

      // 删除新增字段
      const columnsToRemove = [
        'phone_number', 'direction', 'start_time', 'end_time', 'status',
        'hangup_cause', 'recording_url', 'recording_duration', 'notes',
        'tags', 'satisfaction', 'follow_up_action', 'follow_up_date',
        'provider', 'external_call_id', 'provider_data'
      ];

      for (const columnName of columnsToRemove) {
        if (columnExists(columnName)) {
          await queryInterface.removeColumn('call_records', columnName, { transaction });
        }
      }

      await transaction.commit();
      console.log('✅ 外呼记录表回滚完成');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ 回滚失败:', error.message);
      throw error;
    }
  }
};

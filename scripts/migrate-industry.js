const { sequelize } = require('../models');

async function migrateIndustry() {
  const queryInterface = sequelize.getQueryInterface();
  const Sequelize = require('sequelize');

  try {
    console.log('开始行业分类系统迁移...\n');

    // 1. 检查 industry_categories 表是否存在
    const tables = await queryInterface.showAllTables();
    console.log('现有表:', tables.join(', '));

    if (!tables.includes('industry_categories')) {
      console.log('\n步骤 1: 创建 industry_categories 表...');
      
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

      console.log('✅ industry_categories 表创建成功');
    } else {
      console.log('\n✓ industry_categories 表已存在，跳过创建');
    }

    // 2. 检查是否已有数据
    const [countResult] = await sequelize.query(
      'SELECT COUNT(*) as count FROM industry_categories'
    );
    const count = parseInt(countResult[0].count);

    if (count === 0) {
      console.log('\n步骤 2: 初始化行业分类数据...');
      
      const now = new Date();
      
      // 一级分类数据
      const level1Categories = [
        { id: 1, name: '科技与互联网', code: 'TECH', level: 1, parent_id: 0, sort_order: 1, keywords: JSON.stringify(['科技', '互联网', 'IT', '软件', '技术']) },
        { id: 2, name: '金融与投资', code: 'FIN', level: 1, parent_id: 0, sort_order: 2, keywords: JSON.stringify(['金融', '投资', '银行', '证券', '保险']) },
        { id: 3, name: '制造业', code: 'MFG', level: 1, parent_id: 0, sort_order: 3, keywords: JSON.stringify(['制造', '生产', '工厂', '加工']) },
        { id: 4, name: '商业与零售', code: 'RET', level: 1, parent_id: 0, sort_order: 4, keywords: JSON.stringify(['商业', '零售', '批发', '贸易', '电商']) },
        { id: 5, name: '房地产与建筑', code: 'RE', level: 1, parent_id: 0, sort_order: 5, keywords: JSON.stringify(['房地产', '建筑', '施工', '物业']) },
        { id: 6, name: '教育与培训', code: 'EDU', level: 1, parent_id: 0, sort_order: 6, keywords: JSON.stringify(['教育', '培训', '学校', '教学']) },
        { id: 7, name: '医疗健康', code: 'HEALTH', level: 1, parent_id: 0, sort_order: 7, keywords: JSON.stringify(['医疗', '健康', '医院', '诊所', '医药']) },
        { id: 8, name: '咨询服务', code: 'CONS', level: 1, parent_id: 0, sort_order: 8, keywords: JSON.stringify(['咨询', '顾问', '服务']) },
        { id: 9, name: '文化传媒', code: 'MEDIA', level: 1, parent_id: 0, sort_order: 9, keywords: JSON.stringify(['文化', '传媒', '广告', '出版', '广播']) },
        { id: 10, name: '其他服务业', code: 'OTHER', level: 1, parent_id: 0, sort_order: 10, keywords: JSON.stringify(['服务', '物流', '餐饮', '旅游']) }
      ];

      // 二级分类数据
      const level2Categories = [
        // 科技与互联网 (parent_id: 1)
        { id: 101, name: '信息技术服务', code: 'TECH_IT', level: 2, parent_id: 1, sort_order: 1, keywords: JSON.stringify(['IT服务', '软件开发', '系统集成', '技术支持']) },
        { id: 102, name: '科学研究和技术服务业', code: 'TECH_RD', level: 2, parent_id: 1, sort_order: 2, keywords: JSON.stringify(['研发', '科研', '技术研究', '实验室']) },
        { id: 103, name: '互联网和相关服务', code: 'TECH_NET', level: 2, parent_id: 1, sort_order: 3, keywords: JSON.stringify(['互联网', '网络服务', '在线平台', 'APP']) },
        
        // 金融与投资 (parent_id: 2)
        { id: 201, name: '银行', code: 'FIN_BANK', level: 2, parent_id: 2, sort_order: 1, keywords: JSON.stringify(['银行', '商业银行', '储蓄', '贷款']) },
        { id: 202, name: '证券', code: 'FIN_SEC', level: 2, parent_id: 2, sort_order: 2, keywords: JSON.stringify(['证券', '股票', '基金', '期货']) },
        { id: 203, name: '保险', code: 'FIN_INS', level: 2, parent_id: 2, sort_order: 3, keywords: JSON.stringify(['保险', '人寿保险', '财产保险']) },
        { id: 204, name: '投资管理', code: 'FIN_INV', level: 2, parent_id: 2, sort_order: 4, keywords: JSON.stringify(['投资', '资产管理', '私募', '风投']) },
        
        // 制造业 (parent_id: 3)
        { id: 301, name: '装备制造', code: 'MFG_EQP', level: 2, parent_id: 3, sort_order: 1, keywords: JSON.stringify(['装备', '机械', '设备制造']) },
        { id: 302, name: '汽车制造', code: 'MFG_AUTO', level: 2, parent_id: 3, sort_order: 2, keywords: JSON.stringify(['汽车', '车辆', '汽配']) },
        { id: 303, name: '医药制造', code: 'MFG_PHARM', level: 2, parent_id: 3, sort_order: 3, keywords: JSON.stringify(['医药', '制药', '药品生产']) },
        
        // 商业与零售 (parent_id: 4)
        { id: 401, name: '批发业', code: 'RET_WHO', level: 2, parent_id: 4, sort_order: 1, keywords: JSON.stringify(['批发', '经销', '代理']) },
        { id: 402, name: '零售业', code: 'RET_RET', level: 2, parent_id: 4, sort_order: 2, keywords: JSON.stringify(['零售', '商店', '超市', '便利店']) },
        { id: 403, name: '电子商务', code: 'RET_EC', level: 2, parent_id: 4, sort_order: 3, keywords: JSON.stringify(['电商', '网购', '在线销售', '跨境电商']) },
        
        // 房地产与建筑 (parent_id: 5)
        { id: 501, name: '房地产开发', code: 'RE_DEV', level: 2, parent_id: 5, sort_order: 1, keywords: JSON.stringify(['房地产开发', '地产', '楼盘']) },
        { id: 502, name: '建筑施工', code: 'RE_CON', level: 2, parent_id: 5, sort_order: 2, keywords: JSON.stringify(['建筑', '施工', '工程', '承包']) },
        { id: 503, name: '物业管理', code: 'RE_PM', level: 2, parent_id: 5, sort_order: 3, keywords: JSON.stringify(['物业', '物业管理', '小区管理']) },
        
        // 教育与培训 (parent_id: 6)
        { id: 601, name: '学前教育', code: 'EDU_PRE', level: 2, parent_id: 6, sort_order: 1, keywords: JSON.stringify(['幼儿园', '学前', '早教']) },
        { id: 602, name: '中小学教育', code: 'EDU_K12', level: 2, parent_id: 6, sort_order: 2, keywords: JSON.stringify(['中小学', '小学', '中学', 'K12']) },
        { id: 603, name: '职业培训', code: 'EDU_VOC', level: 2, parent_id: 6, sort_order: 3, keywords: JSON.stringify(['职业培训', '技能培训', '成人教育']) },
        
        // 医疗健康 (parent_id: 7)
        { id: 701, name: '医院', code: 'HEALTH_HOSP', level: 2, parent_id: 7, sort_order: 1, keywords: JSON.stringify(['医院', '综合医院', '专科医院']) },
        { id: 702, name: '诊所', code: 'HEALTH_CLIN', level: 2, parent_id: 7, sort_order: 2, keywords: JSON.stringify(['诊所', '门诊', '社区医疗']) },
        { id: 703, name: '医药零售', code: 'HEALTH_PHARM', level: 2, parent_id: 7, sort_order: 3, keywords: JSON.stringify(['药店', '药房', '医药零售']) },
        
        // 咨询服务 (parent_id: 8)
        { id: 801, name: '管理咨询', code: 'CONS_MGT', level: 2, parent_id: 8, sort_order: 1, keywords: JSON.stringify(['管理咨询', '战略咨询', '企业管理']) },
        { id: 802, name: '财务咨询', code: 'CONS_FIN', level: 2, parent_id: 8, sort_order: 2, keywords: JSON.stringify(['财务咨询', '审计', '会计']) },
        { id: 803, name: '税务咨询', code: 'CONS_TAX', level: 2, parent_id: 8, sort_order: 3, keywords: JSON.stringify(['税务咨询', '税务代理', '税务筹划']) },
        { id: 804, name: '人力资源咨询', code: 'CONS_HR', level: 2, parent_id: 8, sort_order: 4, keywords: JSON.stringify(['人力资源', 'HR咨询', '招聘', '猎头']) },
        
        // 文化传媒 (parent_id: 9)
        { id: 901, name: '新闻出版', code: 'MEDIA_PUB', level: 2, parent_id: 9, sort_order: 1, keywords: JSON.stringify(['出版', '新闻', '报刊', '杂志']) },
        { id: 902, name: '广播电视', code: 'MEDIA_BC', level: 2, parent_id: 9, sort_order: 2, keywords: JSON.stringify(['广播', '电视', '影视制作']) },
        { id: 903, name: '广告创意', code: 'MEDIA_AD', level: 2, parent_id: 9, sort_order: 3, keywords: JSON.stringify(['广告', '创意', '营销', '公关']) },
        
        // 其他服务业 (parent_id: 10)
        { id: 1001, name: '物流运输', code: 'OTHER_LOG', level: 2, parent_id: 10, sort_order: 1, keywords: JSON.stringify(['物流', '运输', '快递', '仓储']) },
        { id: 1002, name: '餐饮住宿', code: 'OTHER_FOOD', level: 2, parent_id: 10, sort_order: 2, keywords: JSON.stringify(['餐饮', '酒店', '住宿', '餐厅']) },
        { id: 1003, name: '旅游服务', code: 'OTHER_TOUR', level: 2, parent_id: 10, sort_order: 3, keywords: JSON.stringify(['旅游', '旅行社', '景区']) }
      ];

      // 合并所有分类数据
      const allCategories = [...level1Categories, ...level2Categories].map(cat => ({
        ...cat,
        is_active: true,
        created_at: now,
        updated_at: now
      }));

      // 批量插入数据
      await queryInterface.bulkInsert('industry_categories', allCategories);

      console.log('✅ 行业分类数据初始化完成');
      console.log(`   - 一级分类: ${level1Categories.length} 条`);
      console.log(`   - 二级分类: ${level2Categories.length} 条`);
      console.log(`   - 总计: ${allCategories.length} 条`);
    } else {
      console.log(`\n✓ 行业分类数据已存在 (${count} 条)，跳过初始化`);
    }

    // 3. 检查 clients 表的字段
    console.log('\n步骤 3: 更新 clients 表...');
    const clientsColumns = await queryInterface.describeTable('clients');
    
    if (clientsColumns.industry && !clientsColumns.original_industry) {
      console.log('   - 重命名 industry 字段为 original_industry...');
      await queryInterface.renameColumn('clients', 'industry', 'original_industry');
      console.log('   ✅ 字段重命名成功');
    } else if (clientsColumns.original_industry) {
      console.log('   ✓ original_industry 字段已存在');
    }

    if (!clientsColumns.industry_id) {
      console.log('   - 添加 industry_id 字段...');
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

      // 创建索引
      await queryInterface.addIndex('clients', ['industry_id'], {
        name: 'idx_clients_industry_id'
      });
      console.log('   ✅ industry_id 字段添加成功');
    } else {
      console.log('   ✓ industry_id 字段已存在');
    }

    console.log('\n✅ 行业分类系统迁移完成！');
    console.log('\n数据库结构：');
    console.log('  - industry_categories: 行业分类表（树形结构）');
    console.log('  - clients.original_industry: 原始行业文本');
    console.log('  - clients.industry_id: 关联行业分类ID');

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrateIndustry();






const { Client, IndustryCategory } = require('../models');

async function migrateClientIndustries() {
  try {
    console.log('=== 客户行业数据迁移工具 ===\n');

    // 1. 统计需要迁移的客户
    const totalClients = await Client.count();
    const unmatchedClients = await Client.count({
      where: { industryId: null }
    });

    console.log(`总客户数: ${totalClients}`);
    console.log(`未匹配行业的客户: ${unmatchedClients}\n`);

    if (unmatchedClients === 0) {
      console.log('✅ 所有客户都已匹配行业分类！');
      process.exit(0);
    }

    // 2. 获取所有未匹配的客户
    console.log('开始自动匹配...\n');
    const clients = await Client.findAll({
      where: { industryId: null },
      attributes: ['id', 'companyName', 'originalIndustry']
    });

    let matchedCount = 0;
    let unmatchedCount = 0;
    const unmatchedList = [];

    // 3. 逐个匹配
    for (const client of clients) {
      if (!client.originalIndustry) {
        unmatchedCount++;
        unmatchedList.push({
          id: client.id,
          companyName: client.companyName,
          reason: '无原始行业信息'
        });
        continue;
      }

      // 尝试智能匹配
      const matched = await IndustryCategory.matchByKeywords(
        client.originalIndustry
      );

      if (matched) {
        await client.update({ industryId: matched.id });
        matchedCount++;
        
        const fullPath = await matched.getFullPath();
        console.log(`✓ [${client.id}] ${client.companyName}`);
        console.log(`  "${client.originalIndustry}" → ${fullPath}\n`);
      } else {
        unmatchedCount++;
        unmatchedList.push({
          id: client.id,
          companyName: client.companyName,
          originalIndustry: client.originalIndustry,
          reason: '未找到匹配的行业'
        });
      }
    }

    // 4. 输出统计结果
    console.log('\n=== 迁移完成 ===\n');
    console.log(`成功匹配: ${matchedCount} 个客户`);
    console.log(`未能匹配: ${unmatchedCount} 个客户`);
    console.log(`匹配率: ${((matchedCount / clients.length) * 100).toFixed(2)}%\n`);

    // 5. 输出未匹配列表
    if (unmatchedList.length > 0) {
      console.log('未匹配的客户列表：\n');
      unmatchedList.forEach(item => {
        console.log(`[${item.id}] ${item.companyName}`);
        if (item.originalIndustry) {
          console.log(`  原始行业: ${item.originalIndustry}`);
        }
        console.log(`  原因: ${item.reason}\n`);
      });

      console.log('💡 建议：');
      console.log('1. 手动为这些客户分配行业分类');
      console.log('2. 或者为相关行业添加更多关键词');
    }

    // 6. 最终统计
    const finalMatched = await Client.count({
      where: { industryId: { [require('sequelize').Op.ne]: null } }
    });
    console.log(`\n当前已匹配客户总数: ${finalMatched}/${totalClients}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateClientIndustries();
}

module.exports = { migrateClientIndustries };






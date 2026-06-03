// 修复客户数据脚本

const { Client, IndustryCategory } = require('./models');

async function fixClientData() {
  try {
    console.log('🔧 开始修复客户数据...\n');

    // 查找所有客户
    const clients = await Client.findAll();
    console.log(`找到 ${clients.length} 个客户\n`);

    let fixedCount = 0;

    for (const client of clients) {
      let needUpdate = false;
      const updates = {};

      // 检查1：如果有 originalIndustry 但没有 industryId，尝试匹配
      if (client.originalIndustry && !client.industryId) {
        console.log(`客户 "${client.companyName}" 有原始行业 "${client.originalIndustry}" 但未匹配`);
        
        const industryMatchingService = require('./services/IndustryMatchingService');
        const matchResult = await industryMatchingService.matchIndustry(client.originalIndustry);
        
        if (matchResult.matched) {
          updates.industryId = matchResult.matchedIndustry.id;
          needUpdate = true;
          console.log(`  ✅ 匹配到: ${matchResult.matchedIndustry.name}`);
        } else {
          console.log(`  ⚠️  未能匹配`);
        }
      }

      // 检查2：如果 industryId 无效，清除它
      if (client.industryId) {
        const industry = await IndustryCategory.findByPk(client.industryId);
        if (!industry) {
          console.log(`客户 "${client.companyName}" 的 industryId ${client.industryId} 无效，清除`);
          updates.industryId = null;
          needUpdate = true;
        }
      }

      if (needUpdate) {
        await client.update(updates);
        fixedCount++;
      }
    }

    console.log(`\n✅ 修复完成！共修复 ${fixedCount} 个客户\n`);

  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    process.exit(0);
  }
}

fixClientData();












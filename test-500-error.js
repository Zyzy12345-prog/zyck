// 快速测试脚本 - 检查500错误原因

const { IndustryCategory } = require('./models');

async function test() {
  try {
    console.log('🔍 开始诊断...\n');

    // 测试1：检查行业分类表
    console.log('测试1：检查行业分类表...');
    const count = await IndustryCategory.count();
    console.log(`✅ 行业分类表有 ${count} 条数据\n`);

    if (count === 0) {
      console.log('⚠️  警告：行业分类表为空！');
      console.log('请运行：node scripts/migrate-industry.js\n');
    }

    // 测试2：测试智能匹配服务
    console.log('测试2：测试智能匹配服务...');
    const industryMatchingService = require('./services/IndustryMatchingService');
    const result = await industryMatchingService.matchIndustry('科研');
    console.log('✅ 智能匹配服务正常');
    console.log('匹配结果:', result.matched ? `"${result.matchedIndustry.name}"` : '未匹配');
    console.log('置信度:', result.confidence);
    console.log('');

    // 测试3：测试客户创建
    console.log('测试3：测试客户创建逻辑...');
    const testData = {
      companyName: '测试公司',
      phone: '13800138000',
      industry: '科研'
    };
    
    console.log('输入数据:', testData);
    
    // 模拟控制器逻辑
    const clientData = {
      companyName: testData.companyName,
      phone: testData.phone
    };
    
    if (testData.industry) {
      const matchResult = await industryMatchingService.matchIndustry(testData.industry);
      if (matchResult.matched) {
        clientData.industryId = matchResult.matchedIndustry.id;
        clientData.originalIndustry = testData.industry;
        console.log('✅ 行业匹配成功');
        console.log('industryId:', clientData.industryId);
        console.log('originalIndustry:', clientData.originalIndustry);
      }
    }
    
    console.log('\n✅ 所有测试通过！');
    console.log('\n如果仍然出现500错误，请：');
    console.log('1. 重启后端服务');
    console.log('2. 查看后端终端的完整错误日志');
    console.log('3. 检查是否是其他API接口的错误\n');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('\n完整错误:');
    console.error(error);
    console.log('\n🔧 修复建议：');
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('- 数据库表不存在，请运行迁移脚本');
      console.log('  node scripts/migrate-industry.js');
    } else if (error.message.includes('Cannot find module')) {
      console.log('- 缺少依赖模块，请运行：npm install');
    } else {
      console.log('- 检查数据库连接配置（.env文件）');
      console.log('- 确保PostgreSQL服务正在运行');
    }
  } finally {
    process.exit(0);
  }
}

test();












const { IndustryCategory } = require('../models');

async function testIndustrySystem() {
  try {
    console.log('=== 行业分类系统测试 ===\n');

    // 1. 获取所有一级分类
    console.log('1. 一级分类列表：');
    const level1 = await IndustryCategory.findAll({
      where: { level: 1, isActive: true },
      order: [['sortOrder', 'ASC']]
    });
    level1.forEach(cat => {
      console.log(`   [${cat.code}] ${cat.name}`);
    });

    // 2. 获取某个一级分类的子分类
    console.log('\n2. "咨询服务" 的子分类：');
    const consulting = await IndustryCategory.findOne({
      where: { code: 'CONS' }
    });
    if (consulting) {
      const children = await IndustryCategory.findAll({
        where: { parentId: consulting.id, isActive: true },
        order: [['sortOrder', 'ASC']]
      });
      children.forEach(cat => {
        console.log(`   [${cat.code}] ${cat.name}`);
      });
    }

    // 3. 测试树形结构
    console.log('\n3. 完整树形结构（前3个一级分类）：');
    const tree = await IndustryCategory.getTree();
    tree.slice(0, 3).forEach(cat => {
      console.log(`   ${cat.name} (${cat.code})`);
      if (cat.children && cat.children.length > 0) {
        cat.children.forEach(child => {
          console.log(`      └─ ${child.name} (${child.code})`);
        });
      }
    });

    // 4. 测试关键词匹配
    console.log('\n4. 关键词智能匹配测试：');
    const testTexts = [
      '软件开发公司',
      '税务代理服务',
      '汽车制造企业',
      '电商平台'
    ];
    
    for (const text of testTexts) {
      const matched = await IndustryCategory.matchByKeywords(text);
      if (matched) {
        const fullPath = await matched.getFullPath();
        console.log(`   "${text}" → ${fullPath}`);
      } else {
        console.log(`   "${text}" → 未匹配`);
      }
    }

    // 5. 统计信息
    console.log('\n5. 统计信息：');
    const total = await IndustryCategory.count();
    const level1Count = await IndustryCategory.count({ where: { level: 1 } });
    const level2Count = await IndustryCategory.count({ where: { level: 2 } });
    console.log(`   总分类数: ${total}`);
    console.log(`   一级分类: ${level1Count}`);
    console.log(`   二级分类: ${level2Count}`);

    console.log('\n✅ 测试完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testIndustrySystem();






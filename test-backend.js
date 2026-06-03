const { sequelize, IndustryCategory } = require('./models');

async function testBackend() {
  try {
    console.log('🔍 测试数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    console.log('\n🔍 检查行业数据...');
    const count = await IndustryCategory.count();
    console.log(`✅ 找到 ${count} 条行业数据`);

    if (count === 0) {
      console.log('\n⚠️  警告：数据库中没有行业数据！');
      console.log('请运行以下命令初始化数据：');
      console.log('  npx sequelize-cli db:migrate');
      console.log('  或者运行: node scripts/init.js');
    } else {
      console.log('\n📋 前5条行业数据：');
      const industries = await IndustryCategory.findAll({ limit: 5 });
      industries.forEach(ind => {
        console.log(`  - [${ind.id}] ${ind.name} (Level ${ind.level})`);
      });
    }

    console.log('\n✅ 后端测试完成！');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 测试失败：', error.message);
    console.error('\n详细错误：', error);
    process.exit(1);
  }
}

testBackend();

















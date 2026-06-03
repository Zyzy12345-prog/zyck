const { SalesStage } = require('./models');

async function testStageQuery() {
  try {
    console.log('=== 测试阶段查询 ===\n');
    
    // 测试查询所有阶段
    const allStages = await SalesStage.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']]
    });
    
    console.log(`找到 ${allStages.length} 个阶段:\n`);
    allStages.forEach(stage => {
      console.log(`ID: ${stage.id}, 名称: ${stage.name}, 排序: ${stage.sortOrder}`);
    });
    
    console.log('\n=== 测试单个阶段查询 ===\n');
    
    // 测试查询每个阶段
    for (let i = 1; i <= 6; i++) {
      const stage = await SalesStage.findByPk(i);
      if (stage) {
        console.log(`✓ 阶段 ${i} 存在: ${stage.name}`);
      } else {
        console.log(`✗ 阶段 ${i} 不存在`);
      }
    }
    
    console.log('\n=== 测试不同类型的ID查询 ===\n');
    
    // 测试字符串类型的ID
    const stage2String = await SalesStage.findByPk('2');
    console.log('查询 ID="2" (字符串):', stage2String ? stage2String.name : 'null');
    
    // 测试数字类型的ID
    const stage2Number = await SalesStage.findByPk(2);
    console.log('查询 ID=2 (数字):', stage2Number ? stage2Number.name : 'null');
    
    // 测试parseInt后的ID
    const stage2ParseInt = await SalesStage.findByPk(parseInt('2'));
    console.log('查询 ID=parseInt("2"):', stage2ParseInt ? stage2ParseInt.name : 'null');
    
    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

testStageQuery();












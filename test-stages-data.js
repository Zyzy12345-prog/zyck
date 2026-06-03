const { SalesStage, SalesOpportunity, Client } = require('./models');

async function testStagesData() {
  try {
    console.log('=== 查询所有销售阶段 ===');
    const stages = await SalesStage.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
      include: [{
        model: SalesOpportunity,
        as: 'opportunities',
        where: { status: 'active' },
        required: false,
        include: [{
          model: Client,
          as: 'client',
          attributes: ['id', 'companyName']
        }]
      }]
    });

    console.log(`\n找到 ${stages.length} 个阶段:\n`);
    
    stages.forEach((stage, index) => {
      console.log(`${index + 1}. 阶段: ${stage.name} (ID: ${stage.id})`);
      console.log(`   排序: ${stage.sortOrder}`);
      console.log(`   颜色: ${stage.color}`);
      console.log(`   商机数量: ${stage.opportunities ? stage.opportunities.length : 0}`);
      
      if (stage.opportunities && stage.opportunities.length > 0) {
        stage.opportunities.forEach((opp, oppIndex) => {
          console.log(`   ${oppIndex + 1}) ${opp.title} - ${opp.client?.companyName || '无客户'}`);
        });
      } else {
        console.log(`   (暂无商机)`);
      }
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

testStagesData();












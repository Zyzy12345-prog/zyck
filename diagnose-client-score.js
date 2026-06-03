// Diagnose client score issue
const { Client, ClientScore, CustomerTag, ClientTagRelation } = require('./models');

async function diagnose() {
  try {
    console.log('=== 诊断客户评分问题 ===\n');

    // 1. 检查客户是否存在
    console.log('1. 检查客户 ID 41 是否存在...');
    const client = await Client.findByPk(41);
    if (!client) {
      console.log('❌ 客户不存在');
      return;
    }
    console.log('✓ 客户存在:', client.companyName);

    // 2. 检查客户评分
    console.log('\n2. 检查客户评分...');
    const score = await ClientScore.findOne({ where: { clientId: 41 } });
    if (!score) {
      console.log('❌ 客户评分不存在（这是正常的，需要先计算）');
    } else {
      console.log('✓ 客户评分存在:');
      console.log('  - 总分:', score.totalScore);
      console.log('  - 跟进评分:', score.followUpScore);
      console.log('  - 交易金额评分:', score.dealAmountScore);
      console.log('  - 互动评分:', score.interactionScore);
    }

    // 3. 检查客户标签
    console.log('\n3. 检查客户标签...');
    const tags = await ClientTagRelation.findAll({
      where: { clientId: 41 },
      include: [{
        model: CustomerTag,
        as: 'tag'
      }]
    });
    console.log(`✓ 找到 ${tags.length} 个标签`);
    tags.forEach(t => {
      console.log(`  - ${t.tag?.name || '未知'} (${t.tag?.color || '无颜色'})`);
    });

    // 4. 检查模型关联
    console.log('\n4. 检查模型关联...');
    const clientWithTags = await Client.findByPk(41, {
      include: [{
        model: CustomerTag,
        as: 'tags',
        through: { attributes: [] }
      }]
    });
    
    if (clientWithTags && clientWithTags.tags) {
      console.log(`✓ 通过关联查询到 ${clientWithTags.tags.length} 个标签`);
    } else {
      console.log('❌ 模型关联可能有问题');
    }

    console.log('\n=== 诊断完成 ===');
    process.exit(0);

  } catch (error) {
    console.error('❌ 诊断过程中出错:', error);
    console.error('错误详情:', error.message);
    console.error('堆栈:', error.stack);
    process.exit(1);
  }
}

diagnose();













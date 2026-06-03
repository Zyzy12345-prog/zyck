// Test client tags retrieval
const { Client, CustomerTag, ClientTagRelation } = require('./models');

async function testClientTags() {
  try {
    const clientId = 41;
    
    console.log('=== 测试客户标签获取 ===\n');

    // 方法1: 直接查询关联表
    console.log('方法1: 直接查询 client_tag_relations 表');
    const relations = await ClientTagRelation.findAll({
      where: { clientId },
      include: [{
        model: CustomerTag,
        as: 'tag'
      }]
    });
    console.log(`找到 ${relations.length} 条关联记录`);
    relations.forEach(r => {
      console.log(`  - 标签ID: ${r.tagId}, 标签名: ${r.tag?.name || '未找到'}`);
    });

    // 方法2: 通过 Client 模型的关联查询
    console.log('\n方法2: 通过 Client 模型关联查询');
    const client = await Client.findByPk(clientId, {
      include: [{
        model: CustomerTag,
        as: 'tags',
        through: { attributes: [] }
      }]
    });

    if (client) {
      console.log(`客户: ${client.companyName}`);
      console.log(`标签数量: ${client.tags?.length || 0}`);
      if (client.tags && client.tags.length > 0) {
        client.tags.forEach(tag => {
          console.log(`  - ${tag.name} (${tag.color})`);
        });
      }
    } else {
      console.log('客户不存在');
    }

    // 方法3: 手动查询
    console.log('\n方法3: 手动分步查询');
    const tagIds = relations.map(r => r.tagId);
    if (tagIds.length > 0) {
      const tags = await CustomerTag.findAll({
        where: { id: tagIds }
      });
      console.log(`找到 ${tags.length} 个标签`);
      tags.forEach(tag => {
        console.log(`  - ${tag.name} (${tag.color})`);
      });
    }

    console.log('\n=== 测试完成 ===');
    process.exit(0);

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('详细信息:', error);
    process.exit(1);
  }
}

testClientTags();


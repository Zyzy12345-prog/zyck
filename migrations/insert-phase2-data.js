// Phase 2: Insert default data using Node.js to avoid encoding issues
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'tax_crm',
  user: 'postgres',
  password: 'admin321', // Please update this
});

async function insertDefaultData() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Insert sales stages
    const stagesQuery = `
      INSERT INTO sales_stages (name, description, sort_order, color) VALUES
      ($1, $2, $3, $4),
      ($5, $6, $7, $8),
      ($9, $10, $11, $12),
      ($13, $14, $15, $16),
      ($17, $18, $19, $20),
      ($21, $22, $23, $24)
      ON CONFLICT DO NOTHING
    `;
    
    await client.query(stagesQuery, [
      '线索', '初步接触的潜在客户', 1, '#8c8c8c',
      '意向', '表达明确合作意向', 2, '#1890ff',
      '报价', '已提供报价方案', 3, '#faad14',
      '谈判', '商务谈判中', 4, '#fa8c16',
      '成交', '签约成功', 5, '#52c41a',
      '流失', '客户流失', 6, '#f5222d'
    ]);
    console.log('✓ Sales stages inserted');

    // Insert customer tags
    const tagsQuery = `
      INSERT INTO customer_tags (name, color, icon, category, is_system) VALUES
      ($1, $2, $3, $4, $5),
      ($6, $7, $8, $9, $10),
      ($11, $12, $13, $14, $15),
      ($16, $17, $18, $19, $20),
      ($21, $22, $23, $24, $25),
      ($26, $27, $28, $29, $30),
      ($31, $32, $33, $34, $35),
      ($36, $37, $38, $39, $40)
      ON CONFLICT DO NOTHING
    `;
    
    await client.query(tagsQuery, [
      '重点客户', '#f5222d', 'star', '客户价值', true,
      '潜力客户', '#faad14', 'rocket', '客户价值', true,
      '长期合作', '#52c41a', 'heart', '合作状态', true,
      '新客户', '#1890ff', 'user-add', '客户状态', true,
      '高价值', '#722ed1', 'dollar', '客户价值', true,
      '需跟进', '#fa8c16', 'clock-circle', '跟进状态', true,
      '已流失', '#8c8c8c', 'stop', '客户状态', true,
      'VIP', '#eb2f96', 'crown', '客户等级', true
    ]);
    console.log('✓ Customer tags inserted');

    // Verify data
    const stagesCount = await client.query('SELECT COUNT(*) FROM sales_stages');
    const tagsCount = await client.query('SELECT COUNT(*) FROM customer_tags');
    
    console.log(`\n✓ Phase 2 data inserted successfully!`);
    console.log(`  - Sales stages: ${stagesCount.rows[0].count}`);
    console.log(`  - Customer tags: ${tagsCount.rows[0].count}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

insertDefaultData();













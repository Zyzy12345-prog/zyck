/**
 * 删除并重新创建员工表
 */

const { sequelize } = require('../models');

async function recreateEmployeesTable() {
  try {
    console.log('========================================');
    console.log('   重新创建员工表');
    console.log('========================================\n');

    // 1. 删除旧表
    console.log('1. 删除旧表...');
    await sequelize.query('DROP TABLE IF EXISTS employees CASCADE;');
    console.log('✓ 旧表已删除\n');

    // 2. 创建新表
    console.log('2. 创建新表...');
    const { createEmployeesTable } = require('../migrations/create-employees-table');
    await createEmployeesTable();
    
    console.log('\n========================================');
    console.log('   ✅ 员工表重新创建完成！');
    console.log('========================================\n');
    
    console.log('下一步：');
    console.log('1. 运行：node seeds/seed-employees.js');
    console.log('2. 重启后端服务');
    console.log('3. 刷新浏览器\n');
    
  } catch (error) {
    console.error('\n❌ 操作失败:', error.message);
    throw error;
  }
}

if (require.main === module) {
  recreateEmployeesTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('错误:', error);
      process.exit(1);
    });
}

module.exports = { recreateEmployeesTable };









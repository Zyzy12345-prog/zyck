/**
 * 员工管理模块完整设置脚本
 * 一键创建表和初始化数据
 */

const { createEmployeesTable } = require('../migrations/create-employees-table');
const { seedEmployees } = require('../seeds/seed-employees');

async function setupEmployeeModule() {
  console.log('========================================');
  console.log('   员工管理模块设置');
  console.log('========================================\n');

  try {
    // 1. 创建员工表
    console.log('步骤 1/2: 创建员工表');
    console.log('----------------------------------------');
    await createEmployeesTable();
    console.log('');

    // 2. 初始化员工数据
    console.log('步骤 2/2: 初始化员工数据');
    console.log('----------------------------------------');
    await seedEmployees();
    console.log('');

    console.log('========================================');
    console.log('   ✅ 员工管理模块设置完成！');
    console.log('========================================\n');

    console.log('📋 下一步操作：');
    console.log('1. 重启后端服务');
    console.log('2. 访问前端页面：http://localhost:5173/employees');
    console.log('3. 使用管理员账号登录：');
    console.log('   用户名: admin');
    console.log('   密码: admin123\n');

  } catch (error) {
    console.error('\n❌ 设置失败:', error);
    process.exit(1);
  }
}

// 运行设置
if (require.main === module) {
  setupEmployeeModule()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('设置失败:', error);
      process.exit(1);
    });
}

module.exports = { setupEmployeeModule };









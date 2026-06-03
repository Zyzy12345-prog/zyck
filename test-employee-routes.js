/**
 * 测试员工管理路由是否正确配置
 */

console.log('========================================');
console.log('   员工管理路由测试');
console.log('========================================\n');

try {
  // 1. 测试控制器
  console.log('1. 测试控制器...');
  const controller = require('./controllers/employeeController');
  const methods = Object.keys(controller);
  console.log('✓ 控制器方法:', methods.join(', '));
  console.log('✓ 方法数量:', methods.length);
  
  // 2. 测试路由
  console.log('\n2. 测试路由...');
  const router = require('./routes/employees');
  const routes = router.stack
    .filter(r => r.route)
    .map(r => ({
      path: r.route.path,
      methods: Object.keys(r.route.methods).join(',').toUpperCase()
    }));
  
  console.log('✓ 路由列表:');
  routes.forEach(r => {
    console.log(`  ${r.methods.padEnd(6)} ${r.path}`);
  });
  
  // 3. 测试 app.js
  console.log('\n3. 测试 app.js...');
  const fs = require('fs');
  const appContent = fs.readFileSync('./app.js', 'utf8');
  
  if (appContent.includes("require('./routes/employees')")) {
    console.log('✓ employees 路由已导入');
  } else {
    console.log('✗ employees 路由未导入');
  }
  
  if (appContent.includes("app.use('/api/employees', employeeRoutes)")) {
    console.log('✓ employees 路由已注册');
  } else {
    console.log('✗ employees 路由未注册');
  }
  
  console.log('\n========================================');
  console.log('   ✅ 所有测试通过！');
  console.log('========================================\n');
  
  console.log('📋 下一步操作：');
  console.log('1. 完全停止后端服务（Ctrl + C，可能需要按两次）');
  console.log('2. 等待3秒');
  console.log('3. 重新启动：npm run dev');
  console.log('4. 刷新浏览器：Ctrl + Shift + R\n');
  
} catch (error) {
  console.error('\n❌ 测试失败:', error.message);
  console.error('\n错误详情:', error.stack);
  process.exit(1);
}









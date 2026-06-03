// 500错误诊断脚本

console.log('🔍 500错误诊断\n');

console.log('常见原因：');
console.log('1. IndustryMatchingService 文件不存在或有语法错误');
console.log('2. 数据库连接失败');
console.log('3. 行业分类表没有数据');
console.log('4. 模型关联配置错误\n');

console.log('📋 诊断步骤：\n');

console.log('步骤1：检查后端日志');
console.log('  - 查看运行后端的终端窗口');
console.log('  - 找到完整的错误堆栈信息');
console.log('  - 错误信息通常会显示：');
console.log('    * 哪个文件出错');
console.log('    * 哪一行出错');
console.log('    * 具体错误原因\n');

console.log('步骤2：检查关键文件是否存在');
console.log('  运行以下命令：');
console.log('  cd d:/tax-crm-system');
console.log('  ls services/IndustryMatchingService.js');
console.log('  ls controllers/clientController.js');
console.log('  ls models/IndustryCategory.js\n');

console.log('步骤3：检查数据库');
console.log('  确保行业分类表有数据：');
console.log('  node scripts/migrate-industry.js\n');

console.log('步骤4：重启后端服务');
console.log('  Ctrl + C 停止');
console.log('  npm run dev 重新启动\n');

console.log('步骤5：测试API');
console.log('  在浏览器控制台执行：');
console.log(`
  const token = localStorage.getItem('token');
  
  // 测试获取行业列表
  fetch('http://localhost:3000/api/clients/industries/list', {
    headers: { 'Authorization': \`Bearer \${token}\` }
  })
  .then(res => res.json())
  .then(data => console.log('行业列表:', data))
  .catch(err => console.error('错误:', err));
`);

console.log('\n🔧 快速修复：\n');

console.log('如果是 IndustryMatchingService 错误：');
console.log('  - 检查文件是否存在');
console.log('  - 检查是否有语法错误');
console.log('  - 确保正确导出：module.exports = new IndustryMatchingService();\n');

console.log('如果是数据库错误：');
console.log('  - 检查 .env 文件的数据库配置');
console.log('  - 确保 PostgreSQL 服务正在运行');
console.log('  - 运行迁移脚本\n');

console.log('如果是模型关联错误：');
console.log('  - 检查 models/index.js');
console.log('  - 确保所有模型都正确加载');
console.log('  - 检查关联配置\n');

console.log('💡 提示：');
console.log('请复制后端终端的完整错误信息，这样我可以准确定位问题！');












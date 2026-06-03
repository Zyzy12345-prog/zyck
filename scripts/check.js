const fs = require('fs');
const path = require('path');

console.log('🔍 开始诊断系统配置...\n');

// 检查 .env 文件
console.log('1. 检查环境变量文件...');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env 文件存在');
  require('dotenv').config();
  
  // 检查必要的环境变量
  const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.log(`   ⚠️  缺少环境变量: ${missing.join(', ')}`);
  } else {
    console.log('   ✅ 所有必要的环境变量已配置');
    console.log(`   - DB_HOST: ${process.env.DB_HOST}`);
    console.log(`   - DB_NAME: ${process.env.DB_NAME}`);
    console.log(`   - DB_USER: ${process.env.DB_USER}`);
    console.log(`   - DB_PASSWORD: ${process.env.DB_PASSWORD ? '***已设置***' : '未设置'}`);
  }
} else {
  console.log('   ❌ .env 文件不存在！');
  console.log('   💡 请运行: copy .env.example .env');
  process.exit(1);
}

// 检查 node_modules
console.log('\n2. 检查依赖包...');
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✅ node_modules 目录存在');
} else {
  console.log('   ❌ node_modules 目录不存在！');
  console.log('   💡 请运行: npm install');
  process.exit(1);
}

// 检查数据库连接
console.log('\n3. 测试数据库连接...');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'tax_crm',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

sequelize.authenticate()
  .then(() => {
    console.log('   ✅ 数据库连接成功！');
    console.log('\n✅ 所有检查通过！可以启动服务器了。');
    console.log('   💡 运行: npm run dev 或 npm start');
    process.exit(0);
  })
  .catch(err => {
    console.log('   ❌ 数据库连接失败！');
    console.log(`   📋 错误信息: ${err.message}`);
    console.log('\n💡 可能的解决方案:');
    console.log('   1. 确认PostgreSQL服务正在运行');
    console.log('   2. 检查 .env 文件中的数据库配置');
    console.log('   3. 确认数据库已创建: CREATE DATABASE tax_crm;');
    console.log('   4. 检查数据库用户权限');
    process.exit(1);
  });

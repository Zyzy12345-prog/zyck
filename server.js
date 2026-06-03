const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// 支持两种 .env 位置：
// 1) 项目根目录: tax-crm-system/.env（推荐）
// 2) server 目录: tax-crm-system/server/.env（兼容你的当前结构）
const rootEnvPath = path.join(process.cwd(), '.env');
const serverEnvPath = path.join(process.cwd(), 'server', '.env');
dotenv.config({ path: fs.existsSync(rootEnvPath) ? rootEnvPath : serverEnvPath });
const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');
const { initializeSocket } = require('./socket/chatSocket');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// 测试数据库连接
async function startServer() {
  try {
    console.log('正在连接数据库...');
    console.log(`数据库: ${process.env.DB_NAME || 'tax_crm'}`);
    console.log(`主机: ${process.env.DB_HOST || 'localhost'}`);
    
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 同步数据库模型（开发环境）
    // 暂时禁用自动同步，使用迁移文件管理数据库结构
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('正在同步数据库模型...');
    //   await sequelize.sync({ alter: false });
    //   console.log('✅ 数据库模型同步完成');
    // }
    console.log('⚠️  已禁用自动同步，请使用迁移文件管理数据库');

    // 初始化 Socket.io
    const io = initializeSocket(server);
    console.log('✅ Socket.io 初始化成功');

    server.listen(PORT, '0.0.0.0', () => {
      console.log('\n🚀 服务器启动成功！');
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`📍 健康检查: http://localhost:${PORT}/health`);
      console.log(`💬 WebSocket: ws://localhost:${PORT}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log('\n按 Ctrl+C 停止服务器\n');
    });
  } catch (error) {
    console.error('\n❌ 启动服务器失败！\n');
    console.error('错误详情:', error.message);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n💡 数据库连接失败，请检查:');
      console.error('   1. PostgreSQL服务是否正在运行');
      console.error('   2. .env 文件中的数据库配置是否正确');
      console.error('   3. 数据库是否已创建 (CREATE DATABASE tax_crm;)');
      console.error('   4. 数据库用户密码是否正确');
      console.error('\n   运行诊断: npm run check');
    } else if (error.name === 'SequelizeDatabaseError') {
      console.error('\n💡 数据库错误，请检查:');
      console.error('   1. 数据库是否存在');
      console.error('   2. 运行数据库迁移: npm run db:migrate');
    } else {
      console.error('\n完整错误信息:', error);
    }
    
    process.exit(1);
  }
}

startServer();

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  await sequelize.close();
  process.exit(0);
});

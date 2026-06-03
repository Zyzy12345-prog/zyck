/**
 * 测试登录功能
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testLogin() {
  console.log('🧪 测试登录功能...\n');

  // 测试用户列表
  const testUsers = [
    { email: 'admin@example.com', password: 'admin123', name: 'Admin' },
    { email: 'lour@email.com', password: '123456', name: 'zyzyzy' },
    { email: 'hhh@email.com', password: '123456', name: 'qwer' }
  ];

  for (const testUser of testUsers) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`测试用户: ${testUser.name} (${testUser.email})`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    try {
      console.log('📤 发送登录请求...');
      console.log(`   邮箱: ${testUser.email}`);
      console.log(`   密码: ${testUser.password}`);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });

      console.log('\n✅ 登录成功！');
      console.log('响应数据:', JSON.stringify(response.data, null, 2));
      
      if (response.data.data && response.data.data.token) {
        console.log('\n🔑 Token:', response.data.data.token.substring(0, 50) + '...');
      }
      
      if (response.data.data && response.data.data.user) {
        const user = response.data.data.user;
        console.log('\n👤 用户信息:');
        console.log(`   ID: ${user.id}`);
        console.log(`   用户名: ${user.username}`);
        console.log(`   邮箱: ${user.email}`);
        console.log(`   角色: ${user.role}`);
        console.log(`   状态: ${user.status}`);
      }

    } catch (error) {
      console.log('\n❌ 登录失败！');
      
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
        console.log(`   错误信息: ${error.response.data.message || '未知错误'}`);
        console.log('   完整响应:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.log('   ⚠️  无法连接到服务器');
        console.log('   请确保后端服务正在运行: npm start');
        console.log(`   服务地址: ${API_URL}`);
      } else {
        console.log('   错误:', error.message);
      }
    }
  }

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('测试完成！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// 运行测试
testLogin().catch(console.error);











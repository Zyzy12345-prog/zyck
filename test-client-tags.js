// Test client tags API
const axios = require('axios');

async function testClientTags() {
  try {
    // First login to get token
    console.log('1. 登录获取 token...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      console.error('登录失败:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✓ 登录成功');

    // Test get client tags
    console.log('\n2. 获取客户 41 的标签...');
    const tagsResponse = await axios.get('http://localhost:3000/api/customer-tags/clients/41/tags', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✓ 获取成功:', tagsResponse.data);

  } catch (error) {
    console.error('❌ 错误:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('详细错误:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.stack) {
      console.error('堆栈:', error.stack);
    }
  }
}

testClientTags();













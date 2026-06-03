const http = require('http');

function testStatisticsAPI() {
  console.log('测试员工统计API...\n');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/employees/statistics',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('API响应状态:', res.statusCode);
      console.log('API响应数据:');
      
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));

        if (jsonData.success) {
          const stats = jsonData.data;
          console.log('\n统计数据:');
          console.log(`  员工总数: ${stats.total}`);
          console.log(`  在职员工: ${stats.active}`);
          console.log(`  离职员工: ${stats.inactive}`);
          console.log(`  停用账号: ${stats.suspended}`);
        }
      } catch (e) {
        console.log('原始响应:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('API调用失败:', error.message);
    console.error('\n请确保后端服务在 http://localhost:3000 运行');
    console.error('运行命令: node server.js');
  });

  req.end();
}

testStatisticsAPI();

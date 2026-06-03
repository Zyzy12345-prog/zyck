// Quick test script for Phase 2 backend APIs
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login() {
  try {
    log('\n1. Testing login...', 'blue');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (response.data.success) {
      authToken = response.data.data.token;
      log('✓ Login successful', 'green');
      return true;
    }
  } catch (error) {
    log('✗ Login failed: ' + error.message, 'red');
    return false;
  }
}

async function testSalesStages() {
  try {
    log('\n2. Testing sales stages...', 'blue');
    const response = await axios.get(`${BASE_URL}/sales-funnel/stages`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      log(`✓ Found ${response.data.data.length} sales stages`, 'green');
      response.data.data.forEach(stage => {
        log(`  - ${stage.name} (${stage.color})`, 'yellow');
      });
      return true;
    }
  } catch (error) {
    log('✗ Sales stages test failed: ' + error.message, 'red');
    return false;
  }
}

async function testCustomerTags() {
  try {
    log('\n3. Testing customer tags...', 'blue');
    const response = await axios.get(`${BASE_URL}/customer-tags/tags`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      log(`✓ Found ${response.data.data.length} customer tags`, 'green');
      response.data.data.forEach(tag => {
        log(`  - ${tag.name} (${tag.category})`, 'yellow');
      });
      return true;
    }
  } catch (error) {
    log('✗ Customer tags test failed: ' + error.message, 'red');
    return false;
  }
}

async function testLevelDistribution() {
  try {
    log('\n4. Testing level distribution...', 'blue');
    const response = await axios.get(`${BASE_URL}/client-scoring/clients/level-distribution`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      log('✓ Level distribution:', 'green');
      const dist = response.data.data;
      log(`  A级: ${dist.A || 0} 客户`, 'yellow');
      log(`  B级: ${dist.B || 0} 客户`, 'yellow');
      log(`  C级: ${dist.C || 0} 客户`, 'yellow');
      log(`  D级: ${dist.D || 0} 客户`, 'yellow');
      return true;
    }
  } catch (error) {
    log('✗ Level distribution test failed: ' + error.message, 'red');
    return false;
  }
}

async function testCreateOpportunity() {
  try {
    log('\n5. Testing create opportunity...', 'blue');
    
    // First get a client
    const clientsResponse = await axios.get(`${BASE_URL}/clients?limit=1`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!clientsResponse.data.data.clients.length) {
      log('⚠ No clients found, skipping opportunity test', 'yellow');
      return true;
    }
    
    const clientId = clientsResponse.data.data.clients[0].id;
    
    // Get first stage
    const stagesResponse = await axios.get(`${BASE_URL}/sales-funnel/stages`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const stageId = stagesResponse.data.data[0].id;
    
    // Create opportunity
    const response = await axios.post(`${BASE_URL}/sales-funnel/opportunities`, {
      clientId,
      stageId,
      title: '测试商机',
      description: '这是一个测试商机',
      expectedAmount: 50000,
      probability: 60,
      expectedCloseDate: '2026-03-01'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      log('✓ Opportunity created successfully', 'green');
      log(`  ID: ${response.data.data.id}`, 'yellow');
      log(`  Title: ${response.data.data.title}`, 'yellow');
      return true;
    }
  } catch (error) {
    log('✗ Create opportunity test failed: ' + error.message, 'red');
    return false;
  }
}

async function runTests() {
  log('='.repeat(60), 'blue');
  log('Phase 2 Backend API Tests', 'blue');
  log('='.repeat(60), 'blue');
  
  const results = [];
  
  // Run tests
  results.push(await login());
  
  if (results[0]) {
    results.push(await testSalesStages());
    results.push(await testCustomerTags());
    results.push(await testLevelDistribution());
    results.push(await testCreateOpportunity());
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('Test Summary', 'blue');
  log('='.repeat(60), 'blue');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    log(`\n✓ All tests passed (${passed}/${total})`, 'green');
    log('\n🎉 Phase 2 backend is ready!', 'green');
    log('You can now start frontend development.', 'green');
  } else {
    log(`\n⚠ ${passed}/${total} tests passed`, 'yellow');
    log('Please check the errors above.', 'yellow');
  }
  
  log('\n' + '='.repeat(60), 'blue');
}

// Run tests
runTests().catch(error => {
  log('\n✗ Test suite failed: ' + error.message, 'red');
  process.exit(1);
});













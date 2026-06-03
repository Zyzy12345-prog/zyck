// Test script for batch add tags API
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Replace with your actual token
const TOKEN = 'YOUR_TOKEN_HERE';

async function testBatchAddTags() {
  try {
    console.log('Testing batch add tags API...');
    
    const response = await axios.post(
      `${API_URL}/customer-tags/client-tags/batch`,
      {
        clientIds: [1, 2],
        tagIds: [1, 2]
      },
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testBatchAddTags();









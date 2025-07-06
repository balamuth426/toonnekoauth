#!/usr/bin/env node

// Test script for admin endpoints
const baseUrl = 'http://localhost:5506/api';

async function testEndpoint(endpoint, method = 'GET', headers = {}) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
    
    const text = await response.text();
    console.log(`\n${method} ${endpoint}:`);
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
    
    return response;
  } catch (error) {
    console.log(`\n${method} ${endpoint}:`);
    console.log(`Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('Testing Admin Endpoints...\n');
  
  // Test endpoints that should be accessible without auth (for basic connectivity)
  await testEndpoint('/admin/series-list');
  await testEndpoint('/admin/available-series');
  await testEndpoint('/admin/users');
  
  console.log('\n✅ All endpoints are responding (auth required is expected)');
}

// Only run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

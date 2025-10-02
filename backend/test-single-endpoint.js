/**
 * Quick test for a single endpoint to see detailed error messages
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const ACCESS_TOKEN = 'paste-a-fresh-access-token-here'; // Update this

// Get a fresh token by logging in first
async function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'anas.h.k2244@gmail.com',
      password: 'abc.123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(body);
        resolve(parsed.accessToken);
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testEndpoint(problemId, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/problems/${problemId}/hints`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
        resolve();
      });
    });

    req.on('error', reject);
    req.write('{}');
    req.end();
  });
}

async function main() {
  try {
    console.log('Logging in...');
    const token = await login();
    console.log('Token obtained:', token.substring(0, 50) + '...');
    
    // Use a problem ID from the previous test
    const problemId = 'cmg9v146b0004w3898575td0v';
    
    console.log('\nTesting hints endpoint...');
    await testEndpoint(problemId, token);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

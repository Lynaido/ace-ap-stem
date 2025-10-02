/**
 * Test Script for AI Generation Endpoints - Single Test
 * 
 * Tests only the "Generate Hints (With Options)" endpoint.
 * 
 * Usage: node test-hints-options.js
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3001';
const API_PREFIX = '/api';

// Test credentials (update these with valid credentials)
const TEST_USER = {
  email: 'anas.h.k2244@gmail.com',
  password: 'abc.123'
};

// Pre-configured access token (update this with a valid token, or leave empty to use TEST_USER credentials)
const ACCESS_TOKEN = ''; // Token expired - set to empty string to use credentials instead

// Test problem data
const TEST_PROBLEM = {
  title: 'Projectile Motion - Maximum Height',
  description: 'A ball is thrown vertically upward with an initial velocity of 20 m/s. Calculate the maximum height reached by the ball. (g = 10 m/s²)',
  subject: 'ap_physics_1_2',
  difficulty: 'medium',
  tags: ['kinematics', 'projectile motion']
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Disable SSL verification for local development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Utility function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logSection(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'cyan');
  console.log('='.repeat(60) + '\n');
}

// Test suite
class AIEndpointTester {
  constructor() {
    this.accessToken = null;
    this.testProblemId = null;
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async run() {
    logSection('AI Endpoint Test Suite - Single Test: Generate Hints with Options');
    logInfo(`Testing against: ${BASE_URL}`);
    logInfo(`Timestamp: ${new Date().toISOString()}\n`);

    try {
      // Setup: Use pre-configured token or login
      if (ACCESS_TOKEN) {
        logSection('Setup: Using Pre-configured Token');
        this.accessToken = ACCESS_TOKEN;
        logSuccess('Access token configured');
      } else {
        await this.login();
      }
      await this.createTestProblem();

      // Test AI endpoints
      await this.testGenerateHintsWithOptions();

      // Cleanup
      await this.cleanup();

      // Summary
      this.printSummary();
    } catch (error) {
      logError(`Fatal error: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  }

  async login() {
    logSection('Setup: Authentication');
    logInfo('Attempting to sign in...');

    try {
      const response = await makeRequest('POST', '/auth/login', TEST_USER);

      if (response.status === 200 && response.data.accessToken) {
        this.accessToken = response.data.accessToken;
        logSuccess('Signed in successfully');
        logInfo(`User: ${response.data.user?.email || 'Unknown'}`);
        return;
      }

      // If sign in fails, try to sign up
      logWarning(`Sign in failed (${response.status}), attempting to create account...`);
      const signupResponse = await makeRequest('POST', '/auth/signup', TEST_USER);

      if (signupResponse.status === 201 && signupResponse.data.accessToken) {
        this.accessToken = signupResponse.data.accessToken;
        logSuccess('Account created and signed in successfully');
        return;
      }

      console.error('Signup response:', {
        status: signupResponse.status,
        data: signupResponse.data
      });
      throw new Error(`Authentication failed - Signup returned ${signupResponse.status}`);
    } catch (error) {
      console.error('Login error details:', error);
      throw new Error(`Authentication error: ${error.message}`);
    }
  }

  async createTestProblem() {
    logSection('Setup: Creating Test Problem');
    logInfo('Creating a test problem for AI generation...');

    const response = await makeRequest(
      'POST',
      `${API_PREFIX}/problems`,
      TEST_PROBLEM,
      this.accessToken
    );

    if (response.status === 201 && response.data.success && response.data.data?.id) {
      this.testProblemId = response.data.data.id;
      logSuccess(`Test problem created (ID: ${this.testProblemId})`);
      logInfo(`Description: ${TEST_PROBLEM.description.substring(0, 50)}...`);
    } else {
      console.error('Problem creation failed:', {
        status: response.status,
        data: response.data
      });
      throw new Error(`Failed to create test problem: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  }

  async testGenerateHintsWithOptions() {
    logSection('Test 4: Generate Hints (With Options)');
    this.results.total++;

    try {
      const options = {
        numberOfHints: 5,
        progressionType: 'gradual'
      };

      logInfo(`POST /api/problems/${this.testProblemId}/hints`);
      logInfo(`Options: ${JSON.stringify(options, null, 2)}`);
      const startTime = Date.now();

      const response = await makeRequest(
        'POST',
        `${API_PREFIX}/problems/${this.testProblemId}/hints`,
        { options },
        this.accessToken
      );

      const duration = Date.now() - startTime;

      if (response.status === 200 && response.data.success) {
        const hints = response.data.data.hints;
        logSuccess(`Hints generated with options in ${duration}ms`);
        logInfo(`Requested ${options.numberOfHints}, received ${hints.length} hints`);
        this.results.passed++;
      } else {
        throw new Error(`Unexpected response: ${response.status}`);
      }
    } catch (error) {
      logError(`Test failed: ${error.message}`);
      this.results.failed++;
    }
  }

  async cleanup() {
    logSection('Cleanup');
    logInfo('Cleaning up test data...');

    try {
      if (this.testProblemId) {
        const response = await makeRequest(
          'DELETE',
          `${API_PREFIX}/problems/${this.testProblemId}`,
          null,
          this.accessToken
        );

        if (response.status === 200 || response.status === 204) {
          logSuccess('Test problem deleted successfully');
        } else {
          logWarning(`Problem deletion returned status ${response.status}`);
        }
      }
    } catch (error) {
      logWarning(`Cleanup warning: ${error.message}`);
    }
  }

  printSummary() {
    logSection('Test Summary');
    log(`Total Tests: ${this.results.total}`, 'cyan');
    log(`Passed: ${this.results.passed}`, 'green');
    log(`Failed: ${this.results.failed}`, 'red');
    
    const passRate = this.results.total > 0 ? ((this.results.passed / this.results.total) * 100).toFixed(1) : 0;
    console.log('');
    
    if (this.results.failed === 0 && this.results.total > 0) {
      log(`🎉 All tests passed! (${passRate}%)`, 'green');
    } else if (this.results.total > 0) {
      log(`⚠️  ${this.results.failed} test(s) failed (${passRate}% pass rate)`, 'yellow');
    } else {
      log('No tests were run.', 'yellow');
    }
    
    console.log('');
  }
}

// Run the tests
if (require.main === module) {
  const tester = new AIEndpointTester();
  tester.run().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = AIEndpointTester;
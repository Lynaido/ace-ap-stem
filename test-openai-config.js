// Test script to verify OpenAI configuration
console.log('Testing OpenAI configuration...');

// Check if we're in the backend directory
const fs = require('fs');
const path = require('path');

// Look for environment configuration
const envFiles = ['.env', '.env.local', '.env.example'];
let envConfig = {};

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    console.log(`Found ${envFile}`);
    const envContent = fs.readFileSync(envFile, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/^OPENAI_API_KEY=(.*)$/);
      if (match) {
        envConfig.OPENAI_API_KEY = match[1];
        console.log(`OPENAI_API_KEY found: ${match[1] ? 'YES (length: ' + match[1].length + ')' : 'NO'}`);
      }
    });
  }
}

// Check backend environment
const backendEnvPath = path.join('backend', '.env');
if (fs.existsSync(backendEnvPath)) {
  console.log('Found backend/.env');
  const envContent = fs.readFileSync(backendEnvPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/^OPENAI_API_KEY=(.*)$/);
    if (match) {
      envConfig.OPENAI_API_KEY = match[1];
      console.log(`Backend OPENAI_API_KEY found: ${match[1] ? 'YES (length: ' + match[1].length + ')' : 'NO'}`);
    }
  });
}

// Check backend config file
const backendConfigPath = path.join('backend', 'src', 'config', 'environment.ts');
if (fs.existsSync(backendConfigPath)) {
  console.log('Found backend/src/config/environment.ts');
  const configContent = fs.readFileSync(backendConfigPath, 'utf8');
  console.log('Environment config file exists');
}

console.log('\nConfiguration Summary:');
console.log('- OPENAI_API_KEY configured:', !!envConfig.OPENAI_API_KEY);
console.log('- Key length:', envConfig.OPENAI_API_KEY?.length || 0);

if (!envConfig.OPENAI_API_KEY) {
  console.log('\n⚠️  WARNING: OpenAI API key not found!');
  console.log('Please set OPENAI_API_KEY in your environment variables.');
} else {
  console.log('\n✅ OpenAI API key appears to be configured');
}
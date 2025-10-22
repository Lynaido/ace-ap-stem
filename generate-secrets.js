#!/usr/bin/env node

/**
 * Generate Secure Secrets for Production
 *
 * This script generates cryptographically secure random strings
 * to use as JWT secrets in production.
 *
 * Usage: node generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
}

console.log('\n===========================================');
console.log('Secure Secret Generator for AAS App');
console.log('===========================================\n');

console.log('Copy these values to your backend/.env.production file:\n');

console.log('JWT_SECRET=' + generateSecret(64));
console.log('JWT_REFRESH_SECRET=' + generateSecret(64));

console.log('\n===========================================');
console.log('IMPORTANT:');
console.log('- Never share these secrets');
console.log('- Never commit them to version control');
console.log('- Keep them secure in your .env files');
console.log('- Use different secrets for different environments');
console.log('===========================================\n');

/**
 * Environment Variable Validator
 * Validates all required environment variables at startup
 * Prevents the app from starting with missing critical config
 */

function validateEnvironment() {
  const required = [
    'RPC_URL',
    'PRIVATE_KEY',
    'CONTRACT_PROFILE_REGISTRY',
    'CONTRACT_UTILITY_PAYMENT',
    'CONTRACT_REPUTATION_SYSTEM',
    'CONTRACT_NEXUS_TOKEN',
    'JWT_SECRET',
    'FRONTEND_URL',
  ];

  const missing = [];
  const invalid = [];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Validate formats
  if (process.env.RPC_URL && !process.env.RPC_URL.startsWith('http')) {
    invalid.push('RPC_URL must be a valid HTTP/HTTPS URL');
  }

  if (process.env.PRIVATE_KEY && !process.env.PRIVATE_KEY.startsWith('0x')) {
    invalid.push('PRIVATE_KEY must start with 0x (hex format)');
  }

  // Validate contract addresses
  const contractAddresses = [
    'CONTRACT_PROFILE_REGISTRY',
    'CONTRACT_UTILITY_PAYMENT',
    'CONTRACT_REPUTATION_SYSTEM',
    'CONTRACT_NEXUS_TOKEN',
  ];

  for (const contractVar of contractAddresses) {
    const address = process.env[contractVar];
    if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      invalid.push(`${contractVar} must be a valid Ethereum address (0x + 40 hex chars)`);
    }
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    invalid.push('JWT_SECRET must be at least 32 characters long');
  }

  if (missing.length > 0 || invalid.length > 0) {
    console.error('\n❌ ENVIRONMENT CONFIGURATION ERRORS:\n');

    if (missing.length > 0) {
      console.error('Missing required environment variables:');
      missing.forEach((v) => console.error(`  ✗ ${v}`));
    }

    if (invalid.length > 0) {
      console.error('\nInvalid environment variable formats:');
      invalid.forEach((v) => console.error(`  ✗ ${v}`));
    }

    console.error('\n📋 Instructions:');
    console.error('1. Copy .env.example to .env');
    console.error('2. Fill in your actual values in the .env file');
    console.error('3. NEVER commit .env to version control');
    console.error('4. Run: npm run dev\n');

    process.exit(1);
  }

  console.log('✅ All environment variables validated successfully\n');
}

module.exports = { validateEnvironment };

#!/usr/bin/env node

/**
 * Environment Setup Helper Script
 * Run: node scripts/setup-env.js
 * 
 * This script helps you set up environment variables safely
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const backendDir = path.join(__dirname, '..');
const envPath = path.join(backendDir, '.env');
const envExamplePath = path.join(backendDir, '.env.example');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function setupEnvironment() {
  console.log('\n🔐 Nexus Backend Environment Setup\n');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file already exists\n');
    const overwrite = await question('Overwrite existing .env? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Exiting without changes.\n');
      rl.close();
      return;
    }
  }

  // Create .env file from template
  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ .env.example not found. Cannot proceed.\n');
    rl.close();
    process.exit(1);
  }

  console.log('\n📝 Enter your configuration values:\n');

  const rpcUrl = await question('RPC URL (press Enter for testnet default): ');
  const rpc = rpcUrl || 'https://rpc.api.moonbase.moonbeam.network';

  const privateKey = await question('Private Key (0x...): ');
  if (!privateKey.startsWith('0x')) {
    console.error('❌ Private key must start with 0x\n');
    rl.close();
    process.exit(1);
  }

  const contractRegistry = await question('Contract Profile Registry (0x...): ');
  const contractPayment = await question('Contract Utility Payment (0x...): ');
  const contractReputation = await question('Contract Reputation System (0x...): ');
  const contractToken = await question('Contract Nexus Token (0x...): ');

  const jwtSecret = await question('JWT Secret (or press Enter to generate): ');
  const jwt = jwtSecret || require('crypto').randomBytes(32).toString('hex');

  const frontendUrl = await question('Frontend URL (press Enter for localhost:3000): ');
  const frontend = frontendUrl || 'http://localhost:3000';

  const port = await question('Backend Port (press Enter for 5000): ');
  const backendPort = port || '5000';

  const nodeEnv = await question('Node Environment [development/production] (press Enter for development): ');
  const env = nodeEnv || 'development';

  // Create .env content
  const envContent = `# Polkadot/Moonbeam Network Configuration
RPC_URL=${rpc}

# Private Key for Transactions
PRIVATE_KEY=${privateKey}

# Smart Contract Addresses
CONTRACT_PROFILE_REGISTRY=${contractRegistry}
CONTRACT_UTILITY_PAYMENT=${contractPayment}
CONTRACT_REPUTATION_SYSTEM=${contractReputation}
CONTRACT_NEXUS_TOKEN=${contractToken}

# Authentication
JWT_SECRET=${jwt}

# Frontend Configuration
FRONTEND_URL=${frontend}

# Server Configuration
PORT=${backendPort}
NODE_ENV=${env}

# Logging
LOG_LEVEL=info
`;

  // Write .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ .env file created successfully!\n');
  console.log('📋 Your configuration:');
  console.log(`   RPC URL: ${rpc}`);
  console.log(`   Private Key: ${privateKey.slice(0, 10)}...`);
  console.log(`   Frontend URL: ${frontend}`);
  console.log(`   Backend Port: ${backendPort}`);
  console.log(`   Environment: ${env}\n`);

  console.log('🚀 Next steps:');
  console.log('   1. Review the .env file');
  console.log('   2. Run: npm install');
  console.log('   3. Run: npm run dev\n');

  rl.close();
}

setupEnvironment();

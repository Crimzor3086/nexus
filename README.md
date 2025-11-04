# nexus
=======
# Nexus Platform

A decentralized identity and utility platform built on Polkadot, merging profile verification with real-world payments.

## Overview

Nexus bridges digital identity and financial responsibility into one unified ecosystem. Users can create verified on-chain profiles, pay utility bills, and earn rewards for timely payments. Admins or DAOs can approve trusted profiles, building a transparent reputation network. All actions are secured and verifiable on-chain, ensuring authenticity and trust.

## Features

### 🔐 Profile Verification
- Create verified on-chain profiles with document verification
- Admin/DAO approval system for trusted profiles
- Reputation scoring based on verification status
- Document upload and verification tracking

### 💳 Utility Payments
- Pay utility bills directly through the platform
- Automatic reward distribution for timely payments
- Early payment bonuses and overdue penalties
- Comprehensive payment history tracking

### ⭐ Reputation System
- Transparent reputation scoring algorithm
- Community-driven governance with proposal creation
- Voting power based on reputation and stake
- DAO participation and staking mechanisms

### 🗳️ Governance
- On-chain voting for platform decisions
- Proposal creation and execution
- Quorum and approval threshold management
- Community-driven decision making

## Smart Contracts

### ProfileRegistry
Manages verified on-chain profiles with admin/DAO approval system.

### UtilityPayment
Handles utility bill payments and automatic reward distribution.

### ReputationSystem
Manages reputation scoring and DAO governance functionality.

### NexusToken (NEX)
ERC-20 token used for rewards and platform incentives.

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Nexus
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp config.env.example .env
# Edit .env with your configuration
```

4. Compile contracts:
```bash
npm run build
```

## Deployment

### Local Development
```bash
# Start local blockchain
npm run node

# Deploy contracts
npm run deploy:local

# Set up test environment
npm run setup:test

# Run tests
npm run test
```

### Production Deployment
```bash
# Deploy to mainnet
npm run deploy

# Verify contracts
npm run verify

# Generate report
npm run report
```

## Usage

### Web3 SDK
```javascript
const NexusSDK = require('./src/NexusSDK');

// Initialize SDK
const sdk = new NexusSDK();
await sdk.init({
    ethereumRpcUrl: 'http://localhost:8545',
    privateKey: 'your-private-key',
    contractAddresses: {
        profileRegistry: '0x...',
        utilityPayment: '0x...',
        reputationSystem: '0x...',
        nexusToken: '0x...'
    }
});

// Create profile
const result = await sdk.createProfile({
    name: 'Alice Johnson',
    email: 'alice@example.com',
    documentHash: 'QmTestHash'
});

// Pay utility bill
await sdk.payBill(billId, amount);

// Create governance proposal
await sdk.createProposal({
    proposalType: 0,
    targetAddress: '0x...',
    description: 'Approve new user',
    metadata: 'Additional data'
});
```

### Direct Contract Interaction
```javascript
const { ethers } = require('ethers');

// Get contract instances
const profileRegistry = new ethers.Contract(address, abi, signer);

// Create profile
await profileRegistry.createProfile(name, email, documentHash);

// Approve profile (admin only)
await profileRegistry.approveProfile(profileId);
```

## Scripts

- `deploy.js` - Deploy all contracts
- `setup-test-env.js` - Set up test environment with sample data
- `test-platform.js` - Run comprehensive platform tests
- `verify-contracts.js` - Verify contracts on Etherscan
- `generate-report.js` - Generate platform status report

## Configuration

### Network Configuration
- Ethereum RPC URL
- Polkadot WebSocket URL
- Private key for deployment
- Contract addresses

### Platform Parameters
- Reward rates for timely payments
- Platform fee rates
- Reputation scoring weights
- Governance thresholds

## Testing

Run the test suite:
```bash
npm test
```

Run specific tests:
```bash
npx hardhat test test/NexusPlatform.test.js
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  ProfileRegistry│    │ UtilityPayment  │    │ReputationSystem │
│                 │    │                 │    │                 │
│ • Profile Mgmt  │    │ • Bill Payments │    │ • Reputation    │
│ • Verification  │    │ • Rewards       │    │ • Governance    │
│ • Admin Control │    │ • Provider Mgmt │    │ • Voting        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   NexusToken    │
                    │                 │
                    │ • ERC-20 Token  │
                    │ • Reward System │
                    │ • Staking       │
                    └─────────────────┘
```

## Security

- All contracts use OpenZeppelin security patterns
- ReentrancyGuard protection
- Access control with role-based permissions
- Input validation and error handling
- Comprehensive test coverage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions and support:
- Create an issue in the repository
- Join our community Discord
- Check the documentation wiki

## Roadmap

- [ ] Multi-chain support (Ethereum, Polkadot, Polygon)
- [ ] Mobile app integration
- [ ] Advanced analytics dashboard
- [ ] Integration with real utility providers
- [ ] DeFi yield farming for rewards
- [ ] NFT-based identity verification
- [ ] Cross-chain reputation portability

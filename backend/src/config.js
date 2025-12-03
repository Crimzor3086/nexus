require('dotenv').config({ path: `${__dirname}/../.env` });
const { validateEnvironment } = require('./validation/envValidator');

// Validate environment at startup
validateEnvironment();

module.exports = {
  // Network Configuration
  rpcUrl: process.env.RPC_URL,
  privateKey: process.env.PRIVATE_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Smart Contract Addresses
  contracts: {
    profileRegistry: process.env.CONTRACT_PROFILE_REGISTRY,
    utilityPayment: process.env.CONTRACT_UTILITY_PAYMENT,
    reputationSystem: process.env.CONTRACT_REPUTATION_SYSTEM,
    nexusToken: process.env.CONTRACT_NEXUS_TOKEN,
  },

  // Frontend Configuration
  frontendUrl: process.env.FRONTEND_URL,

  // Authentication
  jwtSecret: process.env.JWT_SECRET,

  // Server Configuration
  port: process.env.PORT || 5000,

  // Security Headers
  corsOptions: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

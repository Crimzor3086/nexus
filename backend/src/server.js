const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const { initContracts } = require('./services/contractService');

const profileRoutes = require('./routes/profileRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(cors(config.corsOptions)); // Restrict to your frontend with enhanced security

// Routes
app.use('/api/profile', profileRoutes);
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK' }));

// Start server
(async () => {
  try {
    await initContracts();
    app.listen(config.port, () => {
      console.log(`🚀 Backend running on http://localhost:${config.port}`);
      console.log(`📡 Network: ${config.nodeEnv}`);
      console.log(`✅ Connected to RPC: ${config.rpcUrl}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
})();
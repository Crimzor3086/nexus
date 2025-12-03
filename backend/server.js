// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { ApiPromise, WsProvider } = require('@polkadot/api');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global API instance
let polkadotApi = null;

// Initialize Polkadot API connection
async function initPolkadotApi() {
  try {
    const wsProvider = new WsProvider(process.env.RPC_ENDPOINT || 'wss://rpc.polkadot.io');
    polkadotApi = await ApiPromise.create({ provider: wsProvider });
    
    const [chain, nodeName, nodeVersion] = await Promise.all([
      polkadotApi.rpc.system.chain(),
      polkadotApi.rpc.system.name(),
      polkadotApi.rpc.system.version()
    ]);
    
    console.log(`✅ Connected to ${chain} using ${nodeName} v${nodeVersion}`);
    return polkadotApi;
  } catch (error) {
    console.error('❌ Failed to connect to Polkadot node:', error.message);
    throw error;
  }
}

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connected: polkadotApi?.isConnected || false
  });
});

// Get blockchain info
app.get('/api/chain/info', async (req, res) => {
  try {
    if (!polkadotApi) {
      return res.status(503).json({ error: 'API not initialized' });
    }

    const [chain, nodeName, nodeVersion, properties] = await Promise.all([
      polkadotApi.rpc.system.chain(),
      polkadotApi.rpc.system.name(),
      polkadotApi.rpc.system.version(),
      polkadotApi.rpc.system.properties()
    ]);

    res.json({
      chain: chain.toString(),
      nodeName: nodeName.toString(),
      nodeVersion: nodeVersion.toString(),
      properties: properties.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get account balance
app.get('/api/account/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!polkadotApi) {
      return res.status(503).json({ error: 'API not initialized' });
    }

    const { data: balance } = await polkadotApi.query.system.account(address);
    
    res.json({
      address,
      free: balance.free.toString(),
      reserved: balance.reserved.toString(),
      frozen: balance.frozen.toString(),
      total: balance.free.add(balance.reserved).toString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get account info
app.get('/api/account/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!polkadotApi) {
      return res.status(503).json({ error: 'API not initialized' });
    }

    const [accountInfo, identity] = await Promise.all([
      polkadotApi.query.system.account(address),
      polkadotApi.query.identity?.identityOf(address).catch(() => null)
    ]);

    res.json({
      address,
      nonce: accountInfo.nonce.toString(),
      consumers: accountInfo.consumers.toString(),
      providers: accountInfo.providers.toString(),
      sufficients: accountInfo.sufficients.toString(),
      balance: {
        free: accountInfo.data.free.toString(),
        reserved: accountInfo.data.reserved.toString(),
        frozen: accountInfo.data.frozen.toString()
      },
      identity: identity?.toJSON() || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest block
app.get('/api/block/latest', async (req, res) => {
  try {
    if (!polkadotApi) {
      return res.status(503).json({ error: 'API not initialized' });
    }

    const hash = await polkadotApi.rpc.chain.getBlockHash();
    const block = await polkadotApi.rpc.chain.getBlock(hash);
    const header = await polkadotApi.rpc.chain.getHeader(hash);

    res.json({
      number: header.number.toNumber(),
      hash: hash.toString(),
      parentHash: block.block.header.parentHash.toString(),
      stateRoot: block.block.header.stateRoot.toString(),
      extrinsicsRoot: block.block.header.extrinsicsRoot.toString(),
      extrinsicsCount: block.block.extrinsics.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get block by number
app.get('/api/block/:number', async (req, res) => {
  try {
    const { number } = req.params;
    
    if (!polkadotApi) {
      return res.status(503).json({ error: 'API not initialized' });
    }

    const hash = await polkadotApi.rpc.chain.getBlockHash(number);
    const block = await polkadotApi.rpc.chain.getBlock(hash);

    res.json({
      number: block.block.header.number.toNumber(),
      hash: hash.toString(),
      parentHash: block.block.header.parentHash.toString(),
      extrinsics: block.block.extrinsics.map(ext => ({
        method: ext.method.toJSON(),
        signature: ext.signature.toJSON()
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe to new blocks (WebSocket endpoint)
app.get('/api/subscribe/blocks', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    if (!polkadotApi) {
      res.write(`data: ${JSON.stringify({ error: 'API not initialized' })}\n\n`);
      return res.end();
    }

    const unsubscribe = await polkadotApi.rpc.chain.subscribeNewHeads((header) => {
      res.write(`data: ${JSON.stringify({
        number: header.number.toNumber(),
        hash: header.hash.toString(),
        parentHash: header.parentHash.toString()
      })}\n\n`);
    });

    req.on('close', () => {
      unsubscribe();
    });
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function start() {
  try {
    // Initialize Polkadot API first
    await initPolkadotApi();
    
    // Then start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (polkadotApi) {
    await polkadotApi.disconnect();
  }
  process.exit(0);
});

start();
<div align="center">
  <img src="https://via.placeholder.com/300x300?text=Nexus+Project" alt="Nexus Project Logo" width="250">
</div>

# 🔐 Environment Variables & Security Setup Guide

## Overview
This guide explains how to securely manage environment variables for your Polkadot/Moonbeam backend without exposing sensitive information when running `npm run`.

---

## 📁 File Structure

```
backend/
├── .env                    ← Your LOCAL secrets (NEVER commit!)
├── .env.example           ← Template with instructions (SAFE to commit)
├── .gitignore             ← Prevents .env from being committed
├── package.json           
├── src/
│   ├── config.js          ← Loads & validates environment variables
│   ├── server.js          ← Main Express server
│   ├── validation/
│   │   └── envValidator.js ← Validates all env variables at startup
│   └── services/
│       └── contractService.js ← Uses config for contract initialization
```

---

## 🚀 Quick Start

### Step 1: Create Local .env File

```bash
# In the backend/ directory
cp .env.example .env
```

This creates a local `.env` file based on the template. **This file is in .gitignore and never gets committed.**

### Step 2: Fill in Your Secrets

Edit `backend/.env` with your actual values:

```env
# Moonbeam RPC (Testnet is safer for development)
RPC_URL=https://rpc.api.moonbase.moonbeam.network

# Your Wallet's Private Key (from MetaMask or Polkadot.js)
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Your Deployed Contract Addresses
CONTRACT_PROFILE_REGISTRY=0x0000000000000000000000000000000000000000
CONTRACT_UTILITY_PAYMENT=0x0000000000000000000000000000000000000000
CONTRACT_REPUTATION_SYSTEM=0x0000000000000000000000000000000000000000
CONTRACT_NEXUS_TOKEN=0x0000000000000000000000000000000000000000

# Strong JWT Secret for authentication
JWT_SECRET=your_long_random_secret_key_at_least_32_characters

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Other config
PORT=5000
NODE_ENV=development
```

### Step 3: Run the Backend

```bash
npm run dev    # or `npm start` for production
```

The environment variables are loaded from `.env` - they're **never exposed** in npm commands!

---

## 🔑 How to Obtain Secret Keys/Tokens

### 1. **Private Key** (Required for contract interactions)

#### From MetaMask:
1. Open MetaMask extension
2. Click **Settings** → **Security & Privacy**
3. Click **Show Private Key**
4. Copy and paste in `.env` as `PRIVATE_KEY=0x...`

#### From Polkadot.js:
1. Open [https://polkadot.js.org/apps](https://polkadot.js.org/apps)
2. Create or import account
3. Right-click account → **Export Account**
4. Copy raw private key and paste in `.env`

#### Testnet Faucet (Get Free Test Tokens):
For Moonbase Alpha testnet:
- Visit: https://faucet.moonbeam.network
- Paste your address and request tokens

### 2. **Contract Addresses** (From your deployment)

After deploying contracts:
```bash
# Deploy script output shows contract addresses
# Or find them in deployed-contracts.json in the root directory
```

Example from deployment:
```
ProfileRegistry deployed to: 0xABC123...
UtilityPayment deployed to: 0xDEF456...
```

### 3. **JWT_SECRET** (Generate locally)

```bash
# Run this in terminal to generate a strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Output: Copy this 64-character hex string into `.env`

### 4. **RPC URL** (Use public endpoints)

**Moonbeam Mainnet:**
```
https://rpc.api.moonbeam.network
```

**Moonbase Alpha (Testnet - Recommended for dev):**
```
https://rpc.api.moonbase.moonbeam.network
```

---

## 🛡️ Security Best Practices

### ✅ DO:
- ✅ Keep `.env` in `.gitignore`
- ✅ Commit `.env.example` with placeholder values
- ✅ Use testnet RPC during development
- ✅ Rotate private keys periodically
- ✅ Use environment variables for ALL secrets
- ✅ Never hardcode secrets in source files
- ✅ Enable 2FA on your wallet accounts
- ✅ Use different accounts for dev/prod

### ❌ DON'T:
- ❌ Commit `.env` file to git
- ❌ Share `.env` content over chat/email
- ❌ Expose environment variables in build logs
- ❌ Use real mainnet keys during development
- ❌ Hardcode secrets in JavaScript files
- ❌ Push private keys to public repositories
- ❌ Print secrets in console logs
- ❌ Use the same wallet for multiple environments

---

## 🔄 How Backend Loads Environment Variables

### Flow Diagram:
```
npm run dev
    ↓
server.js loads config.js
    ↓
config.js runs: require('dotenv').config({ path: '.env' })
    ↓
Reads .env file from disk (NEVER exposed in npm command)
    ↓
envValidator.js validates all required variables
    ↓
If validation passes → Start server
If validation fails → Show errors and exit
    ↓
contractService.js uses validated config to initialize contracts
    ↓
Backend is ready to sync with frontend!
```

---

## 📋 What Each Environment Variable Does

| Variable | Purpose | Example |
|----------|---------|---------|
| `RPC_URL` | Connect to Polkadot/Moonbeam network | `https://rpc.api.moonbase.moonbeam.network` |
| `PRIVATE_KEY` | Sign blockchain transactions | `0xabcd...` |
| `CONTRACT_*` | Address of deployed smart contracts | `0x1234...` |
| `JWT_SECRET` | Sign authentication tokens | `a1b2c3d4...` |
| `FRONTEND_URL` | Allow CORS requests from frontend | `http://localhost:3000` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |

---

## 🔍 Validation & Error Handling

When you run `npm run dev`, the backend validates all required environment variables:

### ✅ Validation Success:
```
✅ All environment variables validated successfully
🚀 Backend running on http://localhost:5000
📡 Network: development
✅ Connected to RPC: https://rpc.api.moonbase.moonbeam.network
```

### ❌ Validation Error:
```
❌ ENVIRONMENT CONFIGURATION ERRORS:

Missing required environment variables:
  ✗ RPC_URL
  ✗ PRIVATE_KEY

Invalid environment variable formats:
  ✗ CONTRACT_PROFILE_REGISTRY must be a valid Ethereum address (0x + 40 hex chars)

📋 Instructions:
1. Copy .env.example to .env
2. Fill in your actual values in the .env file
3. NEVER commit .env to version control
4. Run: npm run dev
```

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot find module dotenv"
**Solution:**
```bash
npm install dotenv
```

### Issue: "Missing environment variable: PRIVATE_KEY"
**Solution:**
1. Check that `.env` file exists in `backend/` directory
2. Verify `PRIVATE_KEY=0x...` is uncommented and filled in
3. Run: `npm run dev`

### Issue: "Invalid RPC_URL"
**Solution:**
- Use official endpoints:
  - Testnet: `https://rpc.api.moonbase.moonbeam.network`
  - Mainnet: `https://rpc.api.moonbeam.network`

### Issue: "Frontend not connecting to backend"
**Solution:**
- Ensure `FRONTEND_URL` matches your frontend origin (e.g., `http://localhost:3000`)
- Check CORS is enabled in server.js

### Issue: "Contract initialization failed"
**Solution:**
- Verify contract addresses are correct in `.env`
- Ensure contract addresses match deployed contracts
- Check RPC URL is valid and has network access

---

## 🔗 Backend-Frontend Synchronization

### Without Exposing Secrets:

**Frontend (`src/App.tsx`):**
```javascript
// Frontend NEVER needs private keys!
// Only needs backend API URL
const apiUrl = 'http://localhost:5000/api';

// Calls backend safely
const response = await fetch(`${apiUrl}/profile/create`, {
  method: 'POST',
  body: JSON.stringify(profileData),
  headers: { 'Content-Type': 'application/json' }
});
```

**Backend (`src/server.js`):**
```javascript
// Backend has private key in .env
// Backend signs transactions for frontend
// Frontend gets response WITHOUT seeing the key

app.post('/api/profile/create', async (req, res) => {
  const tx = await profileRegistry.createProfile(...);
  // Private key used internally, never sent to frontend
  res.json({ txHash: tx.hash });
});
```

### Security Flow:
```
Frontend (No secrets)
    ↓ HTTP Request
Backend (Has .env secrets)
    ↓ Uses private key to sign
    ↓ Sends transaction to blockchain
    ↓
Frontend (Receives response)
    ↓ Shows result to user
```

---

## 📦 Production Deployment

### On a Server (e.g., AWS, Heroku, Railway):

1. **Never push .env file**
   ```bash
   git push origin main  # .env stays local, never pushed
   ```

2. **Set environment variables on server:**
   - Dashboard environment variables
   - Or use a secret manager (AWS Secrets Manager, HashiCorp Vault)

3. **Example for Heroku:**
   ```bash
   heroku config:set RPC_URL=https://rpc.api.moonbeam.network
   heroku config:set PRIVATE_KEY=0x...
   heroku config:set JWT_SECRET=...
   # etc for all variables
   ```

4. **Server reads from environment:**
   ```bash
   npm run dev  # Reads from Heroku environment variables, not .env
   ```

---

## ✨ Summary

| Step | What to Do | Where |
|------|-----------|-------|
| 1 | Copy `.env.example` to `.env` | `backend/.env` |
| 2 | Fill in RPC URL, Private Key, Contracts | `backend/.env` |
| 3 | Keep `.env` in `.gitignore` | `backend/.gitignore` |
| 4 | Never commit `.env` | Git won't touch it |
| 5 | Run `npm run dev` | Backend loads `.env` safely |
| 6 | Frontend connects to backend API | No keys exposed |
| 7 | Backend syncs with frontend securely | Private key stays on backend |

---

## 🆘 Need Help?

- **Polkadot Docs:** https://polkadot.network/development/
- **Moonbeam Docs:** https://docs.moonbeam.network/
- **Dotenv Package:** https://github.com/motdotla/dotenv
- **Ethers.js Docs:** https://docs.ethers.org/

---

**Created for Nexus Polkadot dApp | Keep your secrets safe! 🔐**

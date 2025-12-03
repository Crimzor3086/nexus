<div align="center">
  <img src="https://via.placeholder.com/300x300?text=Nexus+Project" alt="Nexus Project Logo" width="250">
</div>

# 🎯 Backend Security Setup - Reference Card

## Quick Commands

```bash
# First time setup
cd backend
npm run setup-env        # Creates .env from template
nano .env                # Edit with your secrets
npm install              # Install dependencies
npm run dev              # Start backend

# Verify secrets are protected
ls -la | grep .env       # Should show .env exists
cat .gitignore | grep .env  # Should show .env is ignored
git status               # Should NOT show .env
```

---

## Where to Find Each Secret

### Private Key (Most Important!)
```
From MetaMask:
1. Click extension icon
2. Settings → Security & Privacy
3. Show Private Key → Copy → Paste in .env

Format: 0x followed by 64 hex characters
Example: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

⚠️ NEVER share this! NEVER commit to git!
```

### RPC URL (Network Connection)
```
Testnet (Recommended for Development):
https://rpc.api.moonbase.moonbeam.network

Mainnet (Use only for production):
https://rpc.api.moonbeam.network

✓ Just copy-paste the URL
```

### Contract Addresses
```
After deployment, find in:
1. Deployment script output
2. deployed-contracts.json in root directory
3. Deployment transaction receipt

Format: 0x followed by 40 hex characters
Example: 0x1234567890123456789012345678901234567890

Get one for each:
- CONTRACT_PROFILE_REGISTRY
- CONTRACT_UTILITY_PAYMENT
- CONTRACT_REPUTATION_SYSTEM
- CONTRACT_NEXUS_TOKEN
```

### JWT Secret (Generate it!)
```
Run this command:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Paste output into JWT_SECRET in .env
✓ No need to remember - just paste & use

Length: 64 hex characters (32 bytes)
```

---

## Your .env File Template

```env
# Polkadot/Moonbeam Network (Testnet for development)
RPC_URL=https://rpc.api.moonbase.moonbeam.network

# Your wallet private key (from MetaMask)
PRIVATE_KEY=0x...paste_your_key_here...

# Deployed smart contract addresses
CONTRACT_PROFILE_REGISTRY=0x...contract_address...
CONTRACT_UTILITY_PAYMENT=0x...contract_address...
CONTRACT_REPUTATION_SYSTEM=0x...contract_address...
CONTRACT_NEXUS_TOKEN=0x...contract_address...

# Generated JWT secret (run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=...generated_secret...

# Your frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Server settings
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
```

---

## File Locations Explained

```
backend/
├── .env                    ← YOUR LOCAL SECRETS (in .gitignore)
├── .env.example           ← TEMPLATE (safe to commit)
├── .gitignore             ← Prevents .env from git
├── src/
│   ├── config.js          ← Loads & validates .env
│   ├── server.js          ← Express app (uses config)
│   └── validation/
│       └── envValidator.js ← Checks all variables exist
├── SECURITY_SETUP.md      ← Full documentation
├── SETUP_QUICK_REF.md     ← Quick reference (this area)
├── ARCHITECTURE_DIAGRAM.md ← Visual flow charts
└── IMPLEMENTATION_SUMMARY.md ← What changed
```

---

## How It Protects Your Secrets

```
Security Layers:

1. FILE LAYER
   .env lives only on your computer
   ↓
2. GIT LAYER
   .gitignore prevents .env from being committed
   ↓
3. ENVIRONMENT LAYER
   npm run dev → Loads .env into memory
   Secrets NEVER appear in npm output
   ↓
4. CODE LAYER
   config.js reads from process.env
   envValidator.js ensures all vars exist
   ↓
5. API LAYER
   Backend uses private key internally
   Frontend receives ONLY transaction receipts
   ↓
6. RESULT
   ✅ Private key never exposed
   ✅ Backend syncs with frontend safely
   ✅ Secrets protected at every layer
```

---

## Validation Checklist

```bash
# Verify your setup

✓ .env file exists
  ls backend/.env

✓ .env is protected
  git status | grep -i ".env"  # Should show NOTHING

✓ Variables are valid
  npm run dev  # Should show: ✅ All environment variables validated

✓ Backend starts
  npm run dev  # Should show: 🚀 Backend running on http://localhost:5000

✓ Frontend can connect
  Frontend calls: fetch('http://localhost:5000/api/...')
  Should get response WITHOUT seeing any secrets
```

---

## Common Values

### For Development

```env
# Testnet setup (safe for testing)
RPC_URL=https://rpc.api.moonbase.moonbeam.network
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### For Production

```env
# Mainnet setup (real money!)
RPC_URL=https://rpc.api.moonbeam.network
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Cannot find .env` | Run: `npm run setup-env` |
| `Validation failed: Missing RPC_URL` | Edit .env and add RPC_URL |
| `Invalid PRIVATE_KEY` | Must start with 0x, check MetaMask |
| `Frontend can't connect` | Check FRONTEND_URL matches frontend origin |
| `Contract address invalid` | Must be 0x + 40 hex characters |
| `JWT_SECRET too short` | Must be at least 32 characters |

---

## Git Commands (to verify protection)

```bash
# Check if .env is being ignored
git status                    # Should NOT show .env

# Check if .env.example will be committed
git status                    # SHOULD show .env.example (without secrets)

# List ignored files
git check-ignore -v backend/.env    # Should show .env is ignored

# Verify git won't commit secrets
git add -n .                        # Dry run - should skip .env
```

---

## Backend-Frontend Flow (Visual)

```
User opens http://localhost:3000
    ↓
Frontend loads (No secrets here)
    ↓
User clicks "Create Profile"
    ↓
Frontend sends HTTP POST:
  POST http://localhost:5000/api/profile/create
  { name: "John", email: "john@example.com" }
    ↓
Backend receives (Has .env secrets)
    ↓
Backend processes:
  1. Validate request data
  2. Load private key from .env (in memory)
  3. Create contract transaction
  4. Sign transaction with private key
  5. Send to blockchain
  6. Wait for confirmation
    ↓
Backend sends HTTP response:
  { txHash: "0xabc...", status: "success" }
    ↓
Frontend receives (No secrets!)
    ↓
Frontend displays:
  "✅ Transaction Confirmed!"
    ↓
User sees result (But never sees private key!)

🔐 PRIVATE KEY NEVER LEFT THE BACKEND!
```

---

## What Frontend Never Sees

```
❌ FRONTEND NEVER RECEIVES:
- Private Key
- JWT Secret
- Contract ABIs
- RPC URL
- Database credentials
- Any sensitive configuration

✅ FRONTEND ONLY RECEIVES:
- Transaction hashes
- Transaction status
- Contract state (public data)
- User profile info
- API responses
```

---

## Key Concepts

**Environment Variables:**
Configuration values loaded at runtime
Not hardcoded in source files
Different for dev/prod environments

**.env File:**
Text file containing environment variables
Local only, never committed to git
Read by dotenv package at startup

**.env.example:**
Template showing required variables
Safe to commit (no real values)
Helps team members know what to configure

**dotenv Package:**
npm package that reads .env files
Loads variables into process.env
Called in config.js at startup

**CORS (Cross-Origin Resource Sharing):**
Security feature that restricts API access
Only allows requests from specified origins
Frontend URL must match FRONTEND_URL in .env

---

## One-Liner Commands

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Create .env from template
cp backend/.env.example backend/.env

# Check if .env is in git
git ls-files | grep ".env"

# Install dependencies
npm install

# Start backend with validation
npm run dev

# Check configuration
cat backend/.env | head -5

# Verify backend is running
curl http://localhost:5000/health
```

---

## Contact References

- **Polkadot Network:** https://polkadot.network
- **Moonbeam (Polkadot Parachain):** https://moonbeam.network
- **Dotenv Package:** https://github.com/motdotla/dotenv
- **Node.js Environment:** https://nodejs.org/en/docs/guides/nodejs-env-variable
- **Express.js CORS:** https://expressjs.com/en/resources/middleware/cors.html

---

## Remember

```
🔐 SECURITY FIRST
   - Never commit .env
   - Never share .env
   - Never log secrets

✅ VALIDATION MATTERS
   - Check output on startup
   - Fix errors before proceeding
   - Use validation scripts

🚀 SYNC SAFELY
   - Frontend talks to backend API
   - Backend handles secrets
   - Frontend gets results

📚 DOCUMENTATION
   - Read SECURITY_SETUP.md for details
   - Read ARCHITECTURE_DIAGRAM.md for flows
   - Ask questions in code comments
```

---

**Backend is secure. Frontend syncs safely. Secrets are protected.** 🎉

# 📝 Backend Environment Setup - Quick Reference

## What Changed in Your Backend?

### Files Created:
1. **`.env.example`** - Template with all required variables (Safe to commit)
2. **`.env`** - Your local secrets (Auto-created, in .gitignore, NEVER commit)
3. **`.gitignore`** - Prevents .env from being accidentally committed
4. **`src/validation/envValidator.js`** - Validates all environment variables at startup
5. **`SECURITY_SETUP.md`** - Complete security documentation

### Files Modified:
1. **`src/config.js`** - Now loads and validates environment variables
2. **`src/server.js`** - Uses config with enhanced CORS security
3. **`package.json`** - Fixed script paths + added setup script

---

## 🚀 Implementation Steps (For You)

### Step 1: Setup Environment (First time only)
```bash
cd nexus/backend
npm run setup-env
```
This creates `.env` from `.env.example`

### Step 2: Fill in Your Secrets
Edit `nexus/backend/.env` with:
```env
RPC_URL=https://rpc.api.moonbase.moonbeam.network
PRIVATE_KEY=0x[your_private_key_from_metamask]
CONTRACT_PROFILE_REGISTRY=0x[your_deployed_contract]
CONTRACT_UTILITY_PAYMENT=0x[your_deployed_contract]
CONTRACT_REPUTATION_SYSTEM=0x[your_deployed_contract]
CONTRACT_NEXUS_TOKEN=0x[your_deployed_contract]
JWT_SECRET=your_long_random_secret_key
FRONTEND_URL=http://localhost:3000
PORT=5000
NODE_ENV=development
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Run Backend
```bash
npm run dev
```

Expected output:
```
✅ All environment variables validated successfully
🚀 Backend running on http://localhost:5000
```

---

## 🔑 Where to Get Each Secret

| Secret | How to Get | Location in .env |
|--------|-----------|-----------------|
| **Private Key** | MetaMask → Settings → Security → Show Private Key | `PRIVATE_KEY=0x...` |
| **RPC URL** | Use public endpoint | `RPC_URL=https://rpc.api.moonbase.moonbeam.network` |
| **Contract Addresses** | From deployment output | `CONTRACT_*=0x...` |
| **JWT Secret** | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | `JWT_SECRET=...` |
| **Frontend URL** | Your frontend address | `FRONTEND_URL=http://localhost:3000` |

---

## 🔐 How Secrets Are Protected

```
┌─────────────────────────────────────────────────────────────┐
│ When you run: npm run dev                                   │
├─────────────────────────────────────────────────────────────┤
│ 1. Node.js loads .env file from disk                        │
│ 2. Environment variables stored in process.env (in memory)  │
│ 3. .env file path not visible in npm command                │
│ 4. Secrets never logged to console                          │
│ 5. Secrets never sent to frontend                           │
│ 6. Only contract responses sent to frontend                 │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Security Checklist

- [ ] `.env` created from `.env.example`
- [ ] All values filled in `.env`
- [ ] `.env` is in `.gitignore`
- [ ] Never run `git add .env`
- [ ] `.env.example` is committed to git (without secrets)
- [ ] `npm run dev` runs without validation errors
- [ ] Backend syncs with frontend without exposing keys
- [ ] Private key is from testnet wallet (not mainnet)

---

## 🔄 Backend-Frontend Communication (No Key Exposure)

### Before:
```
Frontend talks to Backend with hardcoded URLs
Risk: Secrets could be exposed
```

### After:
```
Frontend → Backend API
├─ Frontend sends: { profileData }
├─ Backend receives request (has .env secrets)
├─ Backend uses private key to sign transaction
├─ Backend sends to blockchain
└─ Backend returns response: { txHash, status }
```

**Result:** Frontend never sees the private key! ✅

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### Error: "Missing environment variable: RPC_URL"
- Check `.env` file exists in `backend/` folder
- Verify `RPC_URL=` is uncommented

### Error: "Invalid Ethereum address"
- Contract addresses must be: `0x` + 40 hex characters
- Example: `0x1234567890123456789012345678901234567890`

### Frontend can't connect to backend
- Check `FRONTEND_URL` matches your frontend origin
- Ensure `npm run dev` shows ✅ validation success
- Check backend is running on port 5000

---

## 📖 Full Documentation

For complete details, read: `SECURITY_SETUP.md`

---

## 🎯 Summary

| What | Where | Why |
|-----|-------|-----|
| Secrets stored | `.env` (local only) | Never exposed to git |
| Template shared | `.env.example` (committed) | Safe reference for team |
| Validation | `src/validation/envValidator.js` | Catch config errors early |
| Loading | `src/config.js` | Centralized config |
| Backend uses | Private key in `.env` | Signs transactions safely |
| Frontend gets | API responses only | No security keys exposed |

---

**Your backend is now secure and ready to sync with frontend!** 🎉

# 🔐 Backend Security Architecture Diagram

## How Your Secure Backend Works

### 1. Development Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                    YOUR LOCAL MACHINE                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Create .env                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ cp .env.example .env                                     │  │
│  │ Edit .env with your secrets (MetaMask private key, etc) │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  Step 2: Run Backend                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ npm run dev                                              │  │
│  │ ↓                                                        │  │
│  │ Loads: src/server.js                                    │  │
│  │ Imports: src/config.js                                  │  │
│  │ Reads: .env (from disk)                                 │  │
│  │ Validates: src/validation/envValidator.js              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  Step 3: Backend Ready                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ All environment variables validated                   │  │
│  │ 🚀 Backend running on http://localhost:5000            │  │
│  │ ✅ Connected to RPC: Moonbase Alpha                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### 2. Data Flow: No Secrets Exposed

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (Port 3000)                                        │
│ ├─ Has: Component code, UI logic                           │
│ ├─ Does NOT have: Private keys, JWT secret                 │
│ └─ Sends: API requests to backend                          │
└────────┬────────────────────────────────────────────────────┘
         │
         │ HTTP Request (No secrets in request)
         │ POST /api/profile/create
         │ { profileName: "John", email: "john@example.com" }
         ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (Port 5000)                                         │
│ ├─ Has: Private key in .env (in memory)                    │
│ ├─ Has: JWT secret in .env (in memory)                     │
│ ├─ Has: Contract addresses in .env                         │
│ └─ Receives: Profile data from frontend                    │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Backend Processing (Private keys never leave)       │  │
│ │ 1. Validates request data                           │  │
│ │ 2. Uses private key to sign transaction             │  │
│ │ 3. Sends signed tx to blockchain                    │  │
│ │ 4. Waits for confirmation                           │  │
│ │ 5. Returns ONLY result (no keys in response)        │  │
│ └──────────────────────────────────────────────────────┘  │
└────────┬────────────────────────────────────────────────────┘
         │
         │ HTTP Response (No secrets in response)
         │ { txHash: "0xabc123...", status: "success" }
         ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (Port 3000)                                        │
│ ├─ Receives: txHash and status only                        │
│ ├─ Shows: Transaction confirmation to user                 │
│ └─ Never sees: Private keys, secrets, or sensitive data    │
└─────────────────────────────────────────────────────────────┘

         🔐 PRIVATE KEY STAYS ON BACKEND - NEVER EXPOSED!
```

---

### 3. File Access & Git Protection

```
┌─────────────────────────────────────────────────────────┐
│ PROJECT FILES                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ✅ COMMITTED TO GIT (.env.example)                     │
│ ┌───────────────────────────────────────────────────┐ │
│ │ RPC_URL=https://rpc.api.moonbase.moonbeam.network│ │
│ │ PRIVATE_KEY=0x[TEMPLATE - NO REAL KEY HERE]     │ │
│ │ CONTRACT_PROFILE_REGISTRY=0x[EXAMPLE]           │ │
│ │ JWT_SECRET=your_long_random_secret_here         │ │
│ └───────────────────────────────────────────────────┘ │
│ Safe to share: YES (no real secrets)                  │
│ Purpose: Template for team members                    │
│                                                       │
│ ❌ NEVER COMMITTED TO GIT (.env)                      │
│ ┌───────────────────────────────────────────────────┐ │
│ │ RPC_URL=https://rpc.api.moonbase.moonbeam.network│ │
│ │ PRIVATE_KEY=0x1234567890abcdef...REAL_KEY...    │ │
│ │ CONTRACT_PROFILE_REGISTRY=0xABC123...REAL_ADDR  │ │
│ │ JWT_SECRET=a1b2c3d4...REAL_SECRET...            │ │
│ └───────────────────────────────────────────────────┘ │
│ Safe to share: NO (contains real secrets!)            │
│ Protected by: .gitignore                              │
│ Location: Local machine only                          │
│                                                       │
│ ✅ COMMITTED TO GIT (.gitignore)                      │
│ ┌───────────────────────────────────────────────────┐ │
│ │ .env                                              │ │
│ │ .env.local                                        │ │
│ │ .env.*.local                                      │ │
│ │ node_modules/                                     │ │
│ │ .DS_Store                                         │ │
│ └───────────────────────────────────────────────────┘ │
│ Purpose: Tell git to ignore sensitive files           │
│ Result: .env never accidentally pushed                │
│                                                       │
└─────────────────────────────────────────────────────────┘
```

---

### 4. Startup Validation Flow

```
npm run dev
    ↓
┌─────────────────────────────────────┐
│ package.json "dev" script           │
│ → nodemon src/server.js             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ src/server.js loads                 │
│ require('./config')                 │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ src/config.js executes              │
│ 1. dotenv.config() reads .env       │
│ 2. validateEnvironment()            │
└─────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────┐
│ envValidator.js checks:                      │
│ ✓ RPC_URL exists and is valid HTTP/HTTPS   │
│ ✓ PRIVATE_KEY exists and starts with 0x    │
│ ✓ All 4 CONTRACT_* addresses are valid     │
│ ✓ JWT_SECRET is at least 32 characters     │
│ ✓ FRONTEND_URL exists                      │
└──────────────────────────────────────────────┘
    ↓
    ├─ VALID ──→ ✅ All checks passed
    │            Server starts
    │            Backend ready for sync
    │
    └─ INVALID ──→ ❌ Missing/Invalid variables
                   Detailed error message shown
                   Process exits with code 1
                   NO BROKEN DEPLOYMENT!
```

---

### 5. Backend-Frontend Sync (Secure)

```
SYNCHRONIZATION PROCESS:

Frontend (.tsx components)
├─ Uses API endpoint: http://localhost:5000/api
├─ Sends data: { profileName, email, address }
└─ Does NOT include: Private key, JWT secret, etc.
    ↓
Backend REST API
├─ Route: POST /api/profile/create
├─ Handler: profileRoutes.js
└─ Actions:
    ├─ Validate request
    ├─ Load signer from .env (PRIVATE_KEY in memory)
    ├─ Create transaction with validated config
    ├─ Sign with private key (only on backend)
    ├─ Send to blockchain
    ├─ Wait for confirmation
    └─ Return: { txHash, status, receipt }
        ↓
Frontend UI
├─ Receives: Transaction receipt
├─ Shows: "Transaction confirmed!"
└─ User sees: Success status (no secrets exposed)

KEY: Private key used to SIGN, but NEVER sent over network!
```

---

### 6. Security Layers

```
Layer 1: File Protection
├─ .env in .gitignore → Can't accidentally commit
├─ .env on local disk → Only accessible to you
└─ .env in node process → Memory protection

Layer 2: Environment Variables
├─ Loaded into process.env at runtime
├─ Not visible in console commands
├─ Not logged by default
└─ Only used internally by Node.js

Layer 3: Validation
├─ envValidator.js checks all variables at startup
├─ Prevents server from running with incomplete config
├─ Shows helpful error messages
└─ Catches typos and mistakes early

Layer 4: API Isolation
├─ Frontend talks only to REST API
├─ Backend never sends secrets in responses
├─ Private key never crosses network boundary
└─ Only blockchain receipts sent to frontend

Layer 5: CORS Restriction
├─ cors(config.corsOptions) restricts origin
├─ Frontend URL must match FRONTEND_URL in .env
├─ Prevents unauthorized requests
└─ Only your frontend can access backend
```

---

### 7. Production Deployment (No .env file)

```
Local Development:
┌─────────────────────┐
│ backend/.env        │ ← File on disk
│ npm run dev         │ → Reads .env file
└─────────────────────┘

Production (e.g., Heroku):
┌──────────────────────────┐
│ NO .env file            │
│ Environment variables:   │
│ ├─ RPC_URL               │ (Set in Heroku dashboard)
│ ├─ PRIVATE_KEY           │ (Set in Heroku dashboard)
│ ├─ JWT_SECRET            │ (Set in Heroku dashboard)
│ └─ ... (all vars)        │ (Set in Heroku dashboard)
│                          │
│ npm start               │ → Reads from Heroku config
└──────────────────────────┘

Benefits:
✓ .env file never on production server
✓ Secrets stored in encrypted config
✓ No accidental commits of production secrets
✓ Easy to rotate keys on deployment platform
✓ Audit trail of who changed what
```

---

### 8. Configuration Sources (Priority Order)

```
1. Environment Variables (Highest Priority)
   ↓
   process.env.RPC_URL
   ├─ From .env file (development)
   └─ From platform config (production)

2. .env File (Development Only)
   ↓
   dotenv loads at runtime
   └─ Only if .env exists

3. Hardcoded Defaults (Lowest Priority)
   ↓
   PORT = 5000 (if PORT not set)
   NODE_ENV = development (if NODE_ENV not set)

⚠️  NEVER hardcode secrets - always use env variables!
```

---

## Summary: Your Security Stack

```
┌─────────────────────────────────────────────────────────┐
│              SECURITY ARCHITECTURE                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Git Layer: .gitignore prevents .env commit        │
│  2. File Layer: .env stored locally only              │
│  3. Code Layer: config.js validates at startup        │
│  4. Runtime Layer: Variables in process.env only      │
│  5. API Layer: No secrets in HTTP responses           │
│  6. Network Layer: CORS restricts frontend origin     │
│  7. Blockchain Layer: Private key signs internally    │
│  8. Deployment Layer: Platform config (no .env)       │
│                                                       │
│  RESULT: Private key never exposed! ✅                │
│                                                       │
└─────────────────────────────────────────────────────────┘
```

---

**Your backend is protected by multiple layers of security!** 🔐

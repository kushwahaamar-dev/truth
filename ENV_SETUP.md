# TruthBlink Environment Setup

## Quick Setup

1. Copy the template below to `apps/web/.env.local`
2. Fill in your API keys
3. Run `npm run dev` in `apps/web`

---

## Environment Variables Template

Create `apps/web/.env.local` with:

```env
# ============================================
# SOLANA CONFIGURATION
# ============================================

# Network: "devnet" or "mainnet-beta"
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# RPC URL (use Helius for production)
SOLANA_RPC_URL=https://api.devnet.solana.com

# Program ID (use default for testing, update after deploying your own)
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS

# USDC Mint Address
# Devnet: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
# Mainnet: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# ============================================
# ADMIN CONFIGURATION (for market management)
# ============================================

# Admin wallet private key (Base58 encoded)
# Generate with: solana-keygen new --outfile admin.json
# Then encode: cat admin.json | python3 -c "import json,sys,base58; print(base58.b58encode(bytes(json.load(sys.stdin))).decode())"
ADMIN_PRIVATE_KEY=

# API key for admin endpoints (create your own secure key)
ADMIN_API_KEY=your-secret-admin-key-here

# ============================================
# AI CONFIGURATION
# ============================================

# Gemini API Key (get from https://ai.google.dev/)
GEMINI_API_KEY=

# ============================================
# APPLICATION
# ============================================

# Base URL (update for production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# ============================================
# OPTIONAL: SUPABASE (for caching)
# ============================================

# Get these from your Supabase project settings
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
```

---

## Getting API Keys

### 1. Gemini API Key
1. Go to https://ai.google.dev/
2. Click "Get API key"
3. Create a new key
4. Copy to `GEMINI_API_KEY`

### 2. Admin Wallet
```bash
# Generate a new keypair
solana-keygen new --outfile admin-wallet.json

# Get the public key
solana-keygen pubkey admin-wallet.json

# Fund it on devnet
solana airdrop 2 $(solana-keygen pubkey admin-wallet.json) --url devnet

# Encode the private key (requires base58 package: pip install base58)
python3 -c "
import json, base58
with open('admin-wallet.json') as f:
    key = json.load(f)
print(base58.b58encode(bytes(key)).decode())
"
```

### 3. Helius RPC (Recommended for Production)
1. Go to https://helius.dev/
2. Create free account
3. Get your API key
4. Use: `https://devnet.helius-rpc.com/?api-key=YOUR_KEY`

### 4. Supabase (Optional)
1. Go to https://supabase.com/
2. Create a new project
3. Go to Settings → API
4. Copy URL and anon key
5. Run the SQL schema from `lib/supabase.ts`

---

## Verify Setup

After creating `.env.local`, test the setup:

```bash
cd apps/web
npm run dev
```

Then visit:
- http://localhost:3000 (Homepage)
- http://localhost:3000/api/markets (Markets API)
- http://localhost:3000/admin (Admin Dashboard)


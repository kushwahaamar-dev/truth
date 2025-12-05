# TruthBlink ⚡

**Bet on the Truth directly from Twitter/X using Solana Blinks.**

A browser extension and dApp that bridges Web2 social media with Web3 prediction markets using Solana Blinks (Blockchain Links) and Actions. Place USDC bets on viral claims without leaving your Twitter feed.

![Solana](https://img.shields.io/badge/Solana-14F195?style=flat&logo=solana&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![Anchor](https://img.shields.io/badge/Anchor-9945FF?style=flat&logo=anchor&logoColor=white)

## 🎯 Features

- **🐦 Twitter Integration**: Automatically detects bettable claims in tweets
- **🤖 AI Matching**: Gemini AI matches tweets to Polymarket prediction markets
- **⚡ Solana Blinks**: One-click betting with Solana Actions
- **💰 USDC Betting**: Bet with stablecoins, winners take the pool
- **📊 Live Odds**: Real-time odds from Polymarket displayed inline
- **📱 Mobile Ready**: Responsive Blink preview pages
- **🔐 Admin Dashboard**: Initialize and resolve markets

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Chrome Browser
- (Optional) Rust & Anchor CLI for smart contract deployment

### 1. Install Dependencies
```bash
git clone https://github.com/your-repo/truthblink.git
cd truthblink
npm install
```

### 2. Configure Environment

See **[ENV_SETUP.md](./ENV_SETUP.md)** for detailed instructions.

Quick setup - create `apps/web/.env.local`:
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
GEMINI_API_KEY=your_key_here
ADMIN_API_KEY=your_secret_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Run the Web Server
```bash
cd apps/web
npm run dev
```

### 4. Run the Extension
```bash
cd apps/extension
npm run dev
```

### 5. Load Extension in Chrome
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `apps/extension/build/chrome-mv3-dev`
5. Browse Twitter/X and look for ⚡ Bet buttons!

## 📁 Project Structure

```
truthblink/
├── anchor/                    # Solana Smart Contract (Anchor/Rust)
│   ├── programs/truthblink/
│   │   └── src/
│   │       ├── lib.rs         # Main program (betting logic)
│   │       ├── state.rs       # Market & UserBet accounts
│   │       ├── error.rs       # Custom errors
│   │       └── constants.rs   # PDA seeds
│   └── tests/                 # Integration tests
│
├── apps/
│   ├── extension/             # Chrome Extension (Plasmo)
│   │   ├── content.tsx        # Tweet scanner & button injector
│   │   ├── popup.tsx          # Extension popup UI
│   │   └── styles.css         # Styling
│   │
│   └── web/                   # Next.js Blink Server
│       ├── app/
│       │   ├── api/
│       │   │   ├── actions/bet/   # Solana Actions (Blinks)
│       │   │   ├── admin/         # Admin endpoints
│       │   │   ├── markets/       # Market listing
│       │   │   ├── match/         # AI tweet matching
│       │   │   ├── og/            # Social share images
│       │   │   └── resolve/       # Market resolution
│       │   ├── admin/             # Admin dashboard
│       │   └── blink/[marketId]/  # Mobile Blink preview
│       └── lib/
│           ├── config.ts          # Network configuration
│           ├── gemini.ts          # AI matching
│           ├── polymarket.ts      # Market data
│           ├── polymarket-odds.ts # Live odds
│           └── supabase.ts        # Caching layer
│
├── ENV_SETUP.md               # Environment setup guide
└── README.md
```

## 📡 API Reference

### Solana Actions (Blinks)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/actions/bet?marketId=xxx` | Blink metadata with live odds |
| `POST` | `/api/actions/bet?marketId=xxx&side=yes&amount=10` | Transaction payload |
| `OPTIONS` | `/api/actions/bet` | CORS preflight |

### Backend APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/markets` | List all markets |
| `POST` | `/api/match` | AI match tweet → market |
| `POST` | `/api/admin/initialize` | Create new market (auth) |
| `POST` | `/api/resolve` | Resolve market (auth) |
| `GET` | `/api/og?marketId=xxx&title=xxx` | OG image generation |

### Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with market list |
| `/blink/[marketId]` | Mobile Blink preview |
| `/admin` | Admin dashboard |

## 🔐 Smart Contract

### Accounts

```rust
// Market - Betting pool state
pub struct Market {
    pub authority: Pubkey,      // Admin
    pub external_id: String,    // Polymarket ID
    pub total_yes: u64,         // USDC on YES
    pub total_no: u64,          // USDC on NO
    pub resolved: bool,
    pub outcome: Option<bool>,
    pub bump: u8,
}

// UserBet - Individual bet
pub struct UserBet {
    pub owner: Pubkey,
    pub amount_yes: u64,
    pub amount_no: u64,
    pub claimed: bool,
    pub bump: u8,
}
```

### Instructions

1. `initialize_market(external_id)` - Create betting pool
2. `place_bet(amount, side_yes)` - Deposit USDC
3. `resolve_market(outcome_yes)` - Close market (admin)
4. `claim_winnings()` - Withdraw winnings

## 🧪 Testing

### Test the Web Server
```bash
# Markets API
curl http://localhost:3000/api/markets

# Blink API
curl "http://localhost:3000/api/actions/bet?marketId=btc-100k-2025"
```

### Test in Dialect Viewer
```
https://dial.to/?action=solana-action:http://localhost:3000/api/actions/bet?marketId=btc-100k-2025
```

### Run Anchor Tests
```bash
cd anchor
anchor test
```

## 🚀 Production Deployment

### 1. Deploy Smart Contract
```bash
cd anchor
anchor build
anchor deploy --provider.cluster mainnet
# Update NEXT_PUBLIC_PROGRAM_ID with new address
```

### 2. Update Environment
```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### 3. Deploy Web App
```bash
cd apps/web
npm run build
# Deploy to Vercel, Railway, etc.
```

### 4. Publish Extension
```bash
cd apps/extension
npm run build
npm run package
# Upload to Chrome Web Store
```

## 🎨 Tech Stack

| Component | Technology |
|-----------|------------|
| Smart Contract | Anchor (Rust) |
| Web Server | Next.js 14 (App Router) |
| Extension | Plasmo (React) |
| AI Matching | Gemini 1.5 Flash |
| Database | Supabase (PostgreSQL) |
| Token | USDC (SPL Token) |
| RPC | Helius / Solana |

## 📋 Roadmap

- [x] Anchor smart contract with USDC escrow
- [x] Solana Actions/Blinks integration
- [x] Chrome extension with Twitter injection
- [x] Gemini AI market matching
- [x] Supabase caching for API efficiency
- [x] Polymarket real-time odds display
- [x] Mobile-responsive Blink UI
- [x] Admin dashboard for market management
- [x] OG image generation for social sharing
- [x] Mainnet deployment configuration
- [ ] Extension popup with trending markets
- [ ] Push notifications for resolution
- [ ] Leaderboard & user stats
- [ ] Multi-language support

## 📄 License

MIT License - Built for Solana Hackathon 2024

---

<p align="center">
  <strong>TruthBlink</strong> - Where Web2 meets Web3 prediction markets ⚡
</p>

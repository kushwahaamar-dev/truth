# TruthBlink ⚡

> **MBC 2025 Hackathon Submission**  
> Solana Main Track + Polymarket Bounty ($5,000)

**Bet on the Truth directly from Twitter/X using Solana Blinks.**

A browser extension and dApp that bridges Web2 social media with Web3 prediction markets using Solana Blinks (Blockchain Links) and Actions. Place USDC bets on viral claims without leaving your Twitter feed.

![Solana](https://img.shields.io/badge/Solana-14F195?style=flat&logo=solana&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![Anchor](https://img.shields.io/badge/Anchor-9945FF?style=flat&logo=anchor&logoColor=white)
![Polymarket](https://img.shields.io/badge/Polymarket-FF6B35?style=flat&logoColor=white)

---

## 📑 Table of Contents

- [Hackathon Submission Details](#-hackathon-submission-details)
- [Architecture Overview](#️-architecture-overview)
- [Features](#-features)
- [Deployed Contracts](#-deployed-contracts)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [API Reference](#-api-reference)
- [Smart Contract](#-smart-contract)
- [Testing](#-testing)
- [Team](#-team)
- [License](#-license)

---

## 📋 Hackathon Submission Details

| Field | Value |
|-------|-------|
| **Project Name** | TruthBlink |
| **Track** | Solana Main Track + Polymarket Bounty |
| **Team** | Amar Kushwaha |
| **GitHub** | https://github.com/kushwahaamar-dev/truth |
| **Video Demo** | [VIDEO_LINK_HERE] |
| **Program ID (Devnet)** | `BMLPwQE7THXBWM72ihnEJ63mjvw2Bmg7Ert2oXbpj9sX` |

### Track Requirements Met

#### ✅ Solana Main Track
- [x] Deployed to Solana Devnet
- [x] Uses Anchor Framework (Rust)
- [x] Uses @solana/web3.js
- [x] Uses @solana/actions (Blinks)
- [x] Uses SPL Token (USDC)
- [x] Public GitHub with documentation
- [x] Functional demo (Chrome extension + web app)

#### ✅ Polymarket Bounty ($5,000)
- [x] Integrates Polymarket public APIs (gamma-api.polymarket.com)
- [x] Cross-chain data integration (Polymarket EVM → Solana betting)
- [x] Clear utility: Bet on predictions from Twitter
- [x] Original UX: First Solana Blinks + Polymarket + Twitter integration

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         TRUTHBLINK ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Twitter/X     │     │   Polymarket    │     │     Solana      │
│   (Web2 Feed)   │     │   (EVM Data)    │     │   (Settlement)  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       │
┌─────────────────────────────────────────┐              │
│         CHROME EXTENSION (Plasmo)       │              │
│  • Tweet Scanner (MutationObserver)     │              │
│  • Bet Button Injection                 │              │
│  • Tooltip with Live Odds               │              │
└────────────────────┬────────────────────┘              │
                     │                                   │
                     ▼                                   │
┌─────────────────────────────────────────┐              │
│         NEXT.JS API SERVER              │              │
│                                         │              │
│  /api/search-market                     │              │
│    └─ Gemini AI matching                │              │
│    └─ Polymarket API fetch              │              │
│                                         │              │
│  /api/actions/bet (Solana Blink)        │──────────────┤
│    └─ GET: Blink metadata + odds        │              │
│    └─ POST: Transaction builder         │              │
│                                         │              │
│  /api/markets                           │              │
│    └─ List all markets                  │              │
└────────────────────┬────────────────────┘              │
                     │                                   │
                     ▼                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ANCHOR SMART CONTRACT                         │
│                    Program ID: BMLPwQE7...oXbpj9sX              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ initialize  │  │  place_bet  │  │ resolve_market + claim  │  │
│  │   market    │  │             │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                  │
│  Accounts:                                                       │
│  • Market PDA (betting pool state)                              │
│  • UserBet PDA (individual bets)                                │
│  • Vault (USDC escrow)                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User scrolls Twitter** → Extension scans tweets
2. **AI matches tweet** → Polymarket market found
3. **Bet button appears** → Shows live odds from Polymarket
4. **User clicks Bet** → Opens Solana Blink (Dialect)
5. **User signs transaction** → USDC transferred to on-chain vault
6. **Market resolves** → Winners claim proportional payouts

---

## 🎯 Features

- **🐦 Twitter Integration**: Automatically detects bettable claims in tweets
- **🤖 AI Matching**: Gemini AI matches tweets to Polymarket prediction markets
- **⚡ Solana Blinks**: One-click betting with Solana Actions
- **💰 USDC Betting**: Bet with stablecoins, winners take the pool
- **📊 Live Odds**: Real-time odds from Polymarket displayed inline
- **📱 Mobile Ready**: Responsive Blink preview pages
- **🔐 Admin Dashboard**: Initialize and resolve markets

---

## 🔗 Deployed Contracts

| Network | Program ID | Status | Explorer |
|---------|------------|--------|----------|
| **Devnet** | `BMLPwQE7THXBWM72ihnEJ63mjvw2Bmg7Ert2oXbpj9sX` | ✅ Live | [View](https://explorer.solana.com/address/BMLPwQE7THXBWM72ihnEJ63mjvw2Bmg7Ert2oXbpj9sX?cluster=devnet) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Chrome Browser
- (Optional) Rust & Anchor CLI for smart contract deployment

### 1. Install Dependencies
```bash
git clone https://github.com/kushwahaamar-dev/truth.git
cd truth
npm install
```

### 2. Configure Environment

Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=BMLPwQE7THXBWM72ihnEJ63mjvw2Bmg7Ert2oXbpj9sX
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Run the Web Server
```bash
cd apps/web
npm run dev
```

### 4. Build & Load Extension
```bash
cd apps/extension
npm run build
```
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `apps/extension/build/chrome-mv3-prod`
5. Browse Twitter/X and look for ⚡ Bet buttons!

---

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
│       │   │   ├── search-market/ # AI tweet matching
│       │   │   ├── markets/       # Market listing
│       │   │   └── admin/         # Admin endpoints
│       │   ├── admin/             # Admin dashboard
│       │   └── blink/[marketId]/  # Mobile Blink preview
│       └── lib/
│           ├── gemini.ts          # AI matching
│           ├── polymarket.ts      # Market data
│           └── polymarket-odds.ts # Live odds
│
├── ENV_SETUP.md               # Environment setup guide
└── README.md                  # This file
```

---

## 🎨 Tech Stack

| Component | Technology |
|-----------|------------|
| Smart Contract | Anchor (Rust) on Solana |
| Web Server | Next.js 14 (App Router) |
| Extension | Plasmo (React) |
| AI Matching | Google Gemini 1.5 Flash |
| Prediction Data | Polymarket API |
| Token | USDC (SPL Token) |
| Blinks | @solana/actions |

---

## 📡 API Reference

### Solana Actions (Blinks)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/actions/bet?marketId=xxx` | Blink metadata with live odds |
| `POST` | `/api/actions/bet?marketId=xxx&side=yes&amount=10` | Transaction payload |

### Backend APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/markets` | List all markets from Polymarket |
| `POST` | `/api/search-market` | AI match tweet → market |
| `POST` | `/api/admin/initialize` | Create new market (auth) |

---

## 🔐 Smart Contract

### Instructions

1. `initialize_market(external_id)` - Create betting pool linked to Polymarket
2. `place_bet(amount, side_yes)` - Deposit USDC, record bet direction
3. `resolve_market(outcome_yes)` - Admin closes market with outcome
4. `claim_winnings()` - Winners withdraw proportional payouts

### Accounts

```rust
pub struct Market {
    pub authority: Pubkey,      // Admin
    pub external_id: String,    // Polymarket market ID
    pub total_yes: u64,         // USDC on YES
    pub total_no: u64,          // USDC on NO
    pub resolved: bool,
    pub outcome: Option<bool>,
    pub bump: u8,
}

pub struct UserBet {
    pub owner: Pubkey,
    pub amount_yes: u64,
    pub amount_no: u64,
    pub claimed: bool,
    pub bump: u8,
}
```

---

## 🧪 Testing

### Test the Blink API
```bash
curl "http://localhost:3000/api/actions/bet?marketId=btc-100k-2025"
```

### Test in Dialect Viewer
```
https://dial.to/?action=solana-action:http://localhost:3000/api/actions/bet?marketId=btc-100k-2025
```

---

## 👥 Team

| Name | Role | GitHub |
|------|------|--------|
| Amar Kushwaha | Solo Developer | [@kushwahaamar-dev](https://github.com/kushwahaamar-dev) |

---

## 📄 License

MIT License - Built for MBC 2025 Hackathon

---

<p align="center">
  <strong>TruthBlink</strong> - Where Web2 meets Web3 prediction markets ⚡
  <br><br>
  <a href="https://github.com/kushwahaamar-dev/truth">GitHub</a> •
  <a href="https://explorer.solana.com/address/BMLPwQE7THXBWM72ihnEJ63mjvw2Bmg7Ert2oXbpj9sX?cluster=devnet">Solana Explorer</a>
</p>

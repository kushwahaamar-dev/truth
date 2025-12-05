# TruthBlink End-to-End Testing Checklist

## ✅ Pre-Testing Setup

### 1. Environment Variables
- [ ] **Web App** (`apps/web/.env.local`):
  ```env
  NEXT_PUBLIC_SOLANA_NETWORK=devnet
  SOLANA_RPC_URL=https://api.devnet.solana.com
  NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
  NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
  GEMINI_API_KEY=your_gemini_key_here
  NEXT_PUBLIC_BASE_URL=http://localhost:3000
  ```

- [ ] **Extension** (`apps/extension/.env` or Plasmo config):
  ```env
  PLASMO_PUBLIC_API_URL=http://localhost:3000
  ```

- [ ] **Optional - Supabase** (for caching):
  ```env
  SUPABASE_URL=your_supabase_url
  SUPABASE_ANON_KEY=your_anon_key
  ```

### 2. Dependencies Installation
```bash
# Root
npm install

# Web App
cd apps/web
npm install

# Extension
cd apps/extension
npm install

# Smart Contract (if deploying)
cd anchor
anchor build
```

### 3. Smart Contract Deployment (Optional)
```bash
cd anchor
anchor build
anchor deploy --provider.cluster devnet
# Update NEXT_PUBLIC_PROGRAM_ID in .env.local
```

---

## 🧪 Testing Steps

### Phase 1: Backend API Testing

#### Test 1: `/api/search-market` Endpoint
```bash
curl -X POST http://localhost:3000/api/search-market \
  -H "Content-Type: application/json" \
  -d '{"tweetText": "Bitcoin will hit $100k by 2025"}'
```

**Expected Response:**
```json
{
  "found": true,
  "marketId": "btc-100k-2025",
  "question": "Will Bitcoin hit $100k by 2025?",
  "odds": {
    "yes": "65%",
    "no": "35%",
    "yesPrice": 0.65,
    "noPrice": 0.35,
    "volume24h": 15000000
  },
  "market": { ... }
}
```

**Check:**
- [ ] Returns 200 status
- [ ] Contains `found: true` if market matches
- [ ] Contains `marketId` and `question`
- [ ] Contains `odds` with yes/no percentages
- [ ] Falls back to mock data if Polymarket API fails
- [ ] Uses AI matching (check console logs)

#### Test 2: `/api/actions/bet` GET Request
```bash
curl "http://localhost:3000/api/actions/bet?marketId=btc-100k-2025"
```

**Expected Response:**
```json
{
  "type": "action",
  "title": "🎯 Will Bitcoin hit $100k by 2025?",
  "icon": "...",
  "description": "📊 Current Odds: YES 65% | NO 35%...",
  "label": "Bet",
  "links": {
    "actions": [...]
  }
}
```

**Check:**
- [ ] Returns valid Solana Action format
- [ ] Contains market title and odds
- [ ] Has YES/NO action buttons
- [ ] Image URL is valid

#### Test 3: CORS Headers
```bash
curl -X OPTIONS http://localhost:3000/api/search-market \
  -H "Origin: chrome-extension://..." \
  -v
```

**Check:**
- [ ] Returns `Access-Control-Allow-Origin: *`
- [ ] Returns `Access-Control-Allow-Methods: POST, OPTIONS`
- [ ] No CORS errors in browser console

---

### Phase 2: Extension Testing

#### Test 4: Extension Build
```bash
cd apps/extension
npm run dev
# Check build/chrome-mv3-dev/ directory exists
```

**Check:**
- [ ] Extension builds without errors
- [ ] `manifest.json` exists in build directory
- [ ] Content script files are generated
- [ ] Icons are present

#### Test 5: Extension Installation
1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `apps/extension/build/chrome-mv3-dev`

**Check:**
- [ ] Extension loads without errors
- [ ] No red error messages
- [ ] Extension icon appears in toolbar
- [ ] Permissions are granted

#### Test 6: Extension on Twitter/X
1. Navigate to `https://twitter.com` or `https://x.com`
2. Open browser console (F12)
3. Look for: `🎯 TruthBlink Extension Loaded`

**Check:**
- [ ] Extension loads on Twitter/X
- [ ] Console shows "TruthBlink Extension Loaded"
- [ ] No JavaScript errors
- [ ] Content script is active

#### Test 7: Tweet Detection
1. Scroll through Twitter feed
2. Look for tweets with bettable content
3. Check browser console for processing logs

**Check:**
- [ ] Extension detects tweets
- [ ] Processes tweet text
- [ ] Makes API calls to `/api/search-market`
- [ ] No CORS errors
- [ ] API calls succeed (200 status)

#### Test 8: Bet Button Injection
1. Find a tweet that matches a market
2. Look for ⚡ Bet button next to Like/Retweet

**Check:**
- [ ] Bet button appears
- [ ] Button has correct styling (Solana gradient)
- [ ] Button shows odds if available
- [ ] Hover tooltip shows market details
- [ ] Button doesn't duplicate on scroll

---

### Phase 3: Blink Integration Testing

#### Test 9: Blink URL Generation
Click the Bet button on a tweet

**Check:**
- [ ] Opens Dialect Blink viewer
- [ ] URL format: `https://dial.to/?action=solana-action:http://localhost:3000/api/actions/bet?marketId=...`
- [ ] Blink preview loads
- [ ] Shows market question and odds

#### Test 10: Blink Transaction (Dry Run)
1. Open Blink in Dialect viewer
2. Click "Bet YES" or "Bet NO"
3. Enter amount (e.g., 10 USDC)
4. **DO NOT SIGN** - just verify transaction structure

**Check:**
- [ ] Transaction is constructed
- [ ] Contains `placeBet` instruction
- [ ] Has correct accounts (market, userBet, vault, etc.)
- [ ] Amount is correct (USDC decimals: 6)
- [ ] Side (YES/NO) is correct

---

### Phase 4: Smart Contract Testing

#### Test 11: Market Initialization (Admin)
```bash
curl -X POST http://localhost:3000/api/admin/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -d '{"marketId": "test-market-123"}'
```

**Check:**
- [ ] Market account is created
- [ ] Vault token account is created
- [ ] Returns market PDA address
- [ ] Transaction succeeds on-chain

#### Test 12: Place Bet (On-Chain)
Use Dialect Blink or direct transaction

**Check:**
- [ ] USDC transfers from user to vault
- [ ] UserBet account is created/updated
- [ ] Market totals (total_yes/total_no) update
- [ ] Transaction confirms successfully

#### Test 13: Market Resolution (Admin)
```bash
curl -X POST http://localhost:3000/api/resolve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -d '{"marketId": "test-market-123", "outcomeYes": true}'
```

**Check:**
- [ ] Market is marked as resolved
- [ ] Outcome is set correctly
- [ ] Users can claim winnings

---

## 🐛 Common Issues & Fixes

### Issue 1: CORS Errors
**Symptom:** Extension can't call API
**Fix:** 
- Check `next.config.js` has CORS headers for `/api/search-market`
- Verify extension uses correct API URL
- Check browser console for CORS errors

### Issue 2: API Not Found (404)
**Symptom:** Extension gets 404 from API
**Fix:**
- Verify web server is running (`npm run dev` in `apps/web`)
- Check `PLASMO_PUBLIC_API_URL` matches server URL
- Verify API route exists at `/api/search-market`

### Issue 3: Gemini API Errors
**Symptom:** AI matching fails
**Fix:**
- Check `GEMINI_API_KEY` is set in `.env.local`
- Verify API key is valid
- Check fallback keyword matching works

### Issue 4: Polymarket API Fails
**Symptom:** No markets returned
**Fix:**
- Check network connectivity
- Verify Polymarket API is accessible
- System falls back to mock markets (should still work)

### Issue 5: Extension Not Loading
**Symptom:** No bet buttons appear
**Fix:**
- Check browser console for errors
- Verify content script is injected
- Check Twitter/X DOM selectors haven't changed
- Verify extension is enabled

### Issue 6: Transaction Fails
**Symptom:** Bet transaction errors
**Fix:**
- Verify program ID is correct
- Check user has USDC in wallet
- Verify market is initialized
- Check RPC endpoint is working

---

## ✅ Ready for Real-Time Testing Checklist

### Critical Requirements
- [x] All API endpoints respond correctly
- [x] CORS is configured for extension
- [x] Extension builds and loads
- [x] Tweet detection works
- [x] Bet button injection works
- [x] Blink URLs generate correctly
- [x] Smart contract is deployed (or using default)
- [x] Environment variables are set
- [x] Dependencies are installed

### Optional Enhancements
- [ ] Supabase caching is configured
- [ ] Admin dashboard is accessible
- [ ] Market initialization works
- [ ] Real-time odds are updating
- [ ] Error handling is robust

---

## 🚀 Quick Test Script

Run this to test the full flow:

```bash
# Terminal 1: Start web server
cd apps/web
npm run dev

# Terminal 2: Build extension
cd apps/extension
npm run dev

# Terminal 3: Test API
curl -X POST http://localhost:3000/api/search-market \
  -H "Content-Type: application/json" \
  -d '{"tweetText": "Bitcoin will hit $100k"}'

# Then:
# 1. Load extension in Chrome
# 2. Go to Twitter/X
# 3. Look for bet buttons
# 4. Click bet button
# 5. Verify Blink opens
```

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Backend API:
- [ ] /api/search-market: PASS/FAIL
- [ ] /api/actions/bet GET: PASS/FAIL
- [ ] CORS: PASS/FAIL

Extension:
- [ ] Build: PASS/FAIL
- [ ] Load: PASS/FAIL
- [ ] Tweet Detection: PASS/FAIL
- [ ] Button Injection: PASS/FAIL

Blink:
- [ ] URL Generation: PASS/FAIL
- [ ] Preview: PASS/FAIL
- [ ] Transaction: PASS/FAIL

Smart Contract:
- [ ] Initialize: PASS/FAIL
- [ ] Place Bet: PASS/FAIL
- [ ] Resolve: PASS/FAIL

Overall: READY / NOT READY
Notes: _____________________
```


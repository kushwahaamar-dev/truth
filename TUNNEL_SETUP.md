# Fixing Empty Dialect Page Issue

## Problem
When clicking bet options, Dialect shows an empty page because:
1. **Dialect (`dial.to`) cannot access `localhost:3000`** - it's a different origin
2. **Relative URLs** in action hrefs (already fixed)
3. **Network isolation** - localhost is not accessible from external domains

## Solution: Use a Public Tunnel

### Option 1: Using ngrok (Recommended)

1. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start tunnel:**
   ```bash
   ngrok http 3000
   ```

3. **Update `.env.local`:**
   ```env
   NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io
   ```

4. **Restart server:**
   ```bash
   cd apps/web
   npm run dev
   ```

5. **Test with new URL:**
   ```
   https://dial.to/?action=solana-action:https://your-ngrok-url.ngrok.io/api/actions/bet?marketId=95949
   ```

### Option 2: Using localtunnel

1. **Install:**
   ```bash
   npm install -g localtunnel
   ```

2. **Start tunnel:**
   ```bash
   lt --port 3000
   ```

3. **Update `.env.local`** with the provided URL

### Option 3: Deploy to Public URL

Deploy to Vercel, Railway, or similar:
```bash
cd apps/web
vercel deploy
```

Then update `NEXT_PUBLIC_BASE_URL` to your deployment URL.

## Quick Test

After setting up tunnel, test:
```bash
curl "https://your-tunnel-url/api/actions/bet?marketId=95949"
```

Then try in Dialect:
```
https://dial.to/?action=solana-action:https://your-tunnel-url/api/actions/bet?marketId=95949
```

## Alternative: Use Custom Preview Page

Instead of Dialect, you can use your own preview page at:
```
http://localhost:3000/blink/95949
```

This works locally without needing a tunnel!


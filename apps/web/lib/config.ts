/**
 * TruthBlink Configuration
 * 
 * This file contains network-specific configuration for both Devnet and Mainnet deployments.
 */

export type NetworkConfig = {
  name: "devnet" | "mainnet-beta";
  rpcUrl: string;
  programId: string;
  usdcMint: string;
  explorerUrl: string;
};

export const DEVNET_CONFIG: NetworkConfig = {
  name: "devnet",
  rpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  programId: process.env.NEXT_PUBLIC_PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS",
  // Devnet USDC (use SPL Token faucet to get test tokens)
  usdcMint: process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  explorerUrl: "https://explorer.solana.com/?cluster=devnet",
};

export const MAINNET_CONFIG: NetworkConfig = {
  name: "mainnet-beta",
  rpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  // TODO: Update with deployed mainnet program ID
  programId: process.env.NEXT_PUBLIC_PROGRAM_ID || "REPLACE_WITH_MAINNET_PROGRAM_ID",
  // Official USDC on Solana Mainnet
  usdcMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  explorerUrl: "https://explorer.solana.com",
};

// Determine which network to use based on environment
export function getNetworkConfig(): NetworkConfig {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  
  if (network === "mainnet-beta" || network === "mainnet") {
    return MAINNET_CONFIG;
  }
  
  return DEVNET_CONFIG;
}

// Helius RPC endpoints (recommended for production)
export const HELIUS_DEVNET = (apiKey: string) => 
  `https://devnet.helius-rpc.com/?api-key=${apiKey}`;

export const HELIUS_MAINNET = (apiKey: string) => 
  `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

// Recommended RPC providers for mainnet
export const RECOMMENDED_RPC_PROVIDERS = [
  {
    name: "Helius",
    url: "https://helius.dev",
    description: "Best for Solana Actions/Blinks, includes webhooks and DAS API",
  },
  {
    name: "QuickNode",
    url: "https://quicknode.com",
    description: "Enterprise-grade infrastructure",
  },
  {
    name: "Triton (RPC Pool)",
    url: "https://triton.one",
    description: "Decentralized RPC network",
  },
];

// Deployment checklist for mainnet
export const MAINNET_CHECKLIST = `
## Mainnet Deployment Checklist

### 1. Smart Contract
- [ ] Audit the Anchor program
- [ ] Deploy to mainnet with \`anchor deploy --provider.cluster mainnet\`
- [ ] Update PROGRAM_ID in config
- [ ] Verify program on Solana Explorer

### 2. Environment Variables
\`\`\`env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_PROGRAM_ID=YOUR_MAINNET_PROGRAM_ID
NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
ADMIN_PRIVATE_KEY=YOUR_ADMIN_KEY
\`\`\`

### 3. Security
- [ ] Secure admin key in hardware wallet or KMS
- [ ] Enable rate limiting on API routes
- [ ] Set up monitoring and alerting
- [ ] Configure CORS properly for production domain

### 4. Testing
- [ ] Test with small amounts first
- [ ] Verify USDC transfers work correctly
- [ ] Test market resolution flow
- [ ] Test claim winnings flow

### 5. Monitoring
- [ ] Set up Helius webhooks for transaction monitoring
- [ ] Configure error tracking (Sentry)
- [ ] Set up uptime monitoring
`;


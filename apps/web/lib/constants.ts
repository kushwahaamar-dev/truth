import { PublicKey } from "@solana/web3.js";

// Program ID - Deployed to Solana Devnet for MBC 2025 Hackathon
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "BMLPwQE7THXBWM72ihnEJ63mjvw2Bmg7Ert2oXbpj9sX"
);

// USDC Mint (Devnet)
export const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

// Admin Public Key (for UI display, not signing)
export const ADMIN_PUBKEY = new PublicKey(
  process.env.NEXT_PUBLIC_ADMIN_PUBKEY || "11111111111111111111111111111111"
);

// Base URL for the application
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Solana RPC URL
export const SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

// PDA Seeds
export const MARKET_SEED = "market";
export const BET_SEED = "bet";
export const VAULT_SEED = "vault";

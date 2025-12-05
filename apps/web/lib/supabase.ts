import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Initialize Supabase client (optional - for caching)
let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("Supabase not configured - caching disabled");
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

// Types for cached data
export interface CachedMarketMapping {
  id: string;
  tweet_id: string;
  tweet_text: string;
  market_id: string;
  market_question: string;
  confidence: number;
  created_at: string;
  expires_at: string;
}

export interface CachedMarketData {
  id: string;
  market_id: string;
  question: string;
  yes_price: number;
  no_price: number;
  volume_24h: number;
  end_date: string;
  updated_at: string;
}

// Cache tweet -> market mappings
export async function getCachedMapping(
  tweetId: string
): Promise<CachedMarketMapping | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("market_mappings")
      .select("*")
      .eq("tweet_id", tweetId)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) return null;
    return data as CachedMarketMapping;
  } catch {
    return null;
  }
}

export async function setCachedMapping(
  tweetId: string,
  tweetText: string,
  marketId: string,
  marketQuestion: string,
  confidence: number = 0.8
): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24hr cache

  try {
    await client.from("market_mappings").upsert({
      tweet_id: tweetId,
      tweet_text: tweetText.substring(0, 500), // Limit text length
      market_id: marketId,
      market_question: marketQuestion,
      confidence,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to cache mapping:", error);
  }
}

// Cache market odds data
export async function getCachedMarketOdds(
  marketId: string
): Promise<CachedMarketData | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const { data, error } = await client
      .from("market_odds")
      .select("*")
      .eq("market_id", marketId)
      .gt("updated_at", fiveMinutesAgo.toISOString())
      .single();

    if (error || !data) return null;
    return data as CachedMarketData;
  } catch {
    return null;
  }
}

export async function setCachedMarketOdds(
  marketId: string,
  data: {
    question: string;
    yesPrice: number;
    noPrice: number;
    volume24h: number;
    endDate: string;
  }
): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  try {
    await client.from("market_odds").upsert({
      market_id: marketId,
      question: data.question,
      yes_price: data.yesPrice,
      no_price: data.noPrice,
      volume_24h: data.volume24h,
      end_date: data.endDate,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to cache odds:", error);
  }
}

// SQL to create tables (run this in Supabase SQL Editor)
export const SUPABASE_SCHEMA = `
-- Market mappings cache (tweet -> market)
CREATE TABLE IF NOT EXISTS market_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tweet_id TEXT UNIQUE NOT NULL,
  tweet_text TEXT,
  market_id TEXT NOT NULL,
  market_question TEXT,
  confidence REAL DEFAULT 0.8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mappings_tweet ON market_mappings(tweet_id);
CREATE INDEX IF NOT EXISTS idx_mappings_expires ON market_mappings(expires_at);

-- Market odds cache
CREATE TABLE IF NOT EXISTS market_odds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT UNIQUE NOT NULL,
  question TEXT,
  yes_price REAL,
  no_price REAL,
  volume_24h REAL,
  end_date TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_odds_market ON market_odds(market_id);
CREATE INDEX IF NOT EXISTS idx_odds_updated ON market_odds(updated_at);

-- Enable RLS
ALTER TABLE market_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_odds ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write for now (in production, add proper auth)
CREATE POLICY "Allow all for market_mappings" ON market_mappings FOR ALL USING (true);
CREATE POLICY "Allow all for market_odds" ON market_odds FOR ALL USING (true);
`;


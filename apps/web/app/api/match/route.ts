import { NextResponse } from "next/server";
import { fetchTopMarkets } from "@/lib/polymarket";
import { findMatchingMarket } from "@/lib/gemini";
import { getCachedMapping, setCachedMapping } from "@/lib/supabase";
import { fetchMarketOdds, formatOdds, formatVolume } from "@/lib/polymarket-odds";
import { BASE_URL } from "@/lib/constants";

// POST /api/match
// Body: { tweetText: string, tweetId: string }
export async function POST(req: Request) {
  try {
    const { tweetText, tweetId } = await req.json();

    if (!tweetText) {
      return NextResponse.json({ error: "Missing tweetText" }, { status: 400 });
    }

    console.log(`Matching tweet: ${tweetText.substring(0, 50)}...`);

    // 1. Check Supabase Cache first
    if (tweetId) {
      const cached = await getCachedMapping(tweetId);
      if (cached) {
        console.log(`Cache hit for tweet ${tweetId}`);
        
        // Fetch live odds for cached market
        const odds = await fetchMarketOdds(cached.market_id);
        
        return NextResponse.json({
          found: true,
          cached: true,
          marketId: cached.market_id,
          question: cached.market_question,
          odds: odds ? {
            yes: formatOdds(odds.yesPrice),
            no: formatOdds(odds.noPrice),
            volume: formatVolume(odds.volume24h),
          } : null,
          blinkUrl: `${BASE_URL}/api/actions/bet?marketId=${cached.market_id}`,
        });
      }
    }

    // 2. Fetch Active Markets
    const markets = await fetchTopMarkets();

    // 3. AI Match
    const match = await findMatchingMarket(tweetText, markets);

    if (match) {
      // 4. Cache the mapping
      if (tweetId) {
        await setCachedMapping(tweetId, tweetText, match.id, match.question);
      }

      // 5. Fetch live odds
      const odds = await fetchMarketOdds(match.id);

      return NextResponse.json({
        found: true,
        cached: false,
        marketId: match.id,
        question: match.question,
        odds: odds ? {
          yes: formatOdds(odds.yesPrice),
          no: formatOdds(odds.noPrice),
          volume: formatVolume(odds.volume24h),
        } : null,
        blinkUrl: `${BASE_URL}/api/actions/bet?marketId=${match.id}`,
      });
    } else {
      return NextResponse.json({ found: false });
    }
  } catch (error) {
    console.error("Match API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { findMatchingMarket } from "@/lib/gemini";
import { fetchMarketOdds, formatOdds, formatVolume, fetchEventOutcomes } from "@/lib/polymarket-odds";

// Polymarket Gamma API endpoint for public search
const POLYMARKET_GAMMA_API = "https://gamma-api.polymarket.com";

// High-traffic mock markets for common prediction topics
// These ensure the extension always has relevant markets for testing
const DEMO_MARKETS = [
  {
    id: "demo-btc-100k-2025",
    question: "Will Bitcoin hit $100,000 by end of 2025?",
    volume: 50000000,
    outcomes: ["Yes", "No"],
    endDate: "2025-12-31T23:59:59Z",
    image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/bitcoin.jpg",
  },
  {
    id: "demo-eth-10k",
    question: "Will Ethereum reach $10,000?",
    volume: 25000000,
    outcomes: ["Yes", "No"],
    endDate: "2025-12-31T23:59:59Z",
    image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/ethereum.jpg",
  },
  {
    id: "demo-solana-500",
    question: "Will Solana hit $500 in 2025?",
    volume: 15000000,
    outcomes: ["Yes", "No"],
    endDate: "2025-12-31T23:59:59Z",
    image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/solana.jpg",
  },
  {
    id: "demo-trump-2028",
    question: "Will Trump run for president in 2028?",
    volume: 30000000,
    outcomes: ["Yes", "No"],
    endDate: "2028-11-05T23:59:59Z",
  },
  {
    id: "demo-fed-rate-2025",
    question: "Will the Fed cut interest rates in Q1 2025?",
    volume: 20000000,
    outcomes: ["Yes", "No"],
    endDate: "2025-03-31T23:59:59Z",
  },
  {
    id: "demo-ai-agi-2026",
    question: "Will AGI be achieved by 2026?",
    volume: 10000000,
    outcomes: ["Yes", "No"],
    endDate: "2026-12-31T23:59:59Z",
  },
  {
    id: "demo-spacex-mars",
    question: "Will SpaceX send humans to Mars by 2030?",
    volume: 8000000,
    outcomes: ["Yes", "No"],
    endDate: "2030-12-31T23:59:59Z",
  },
  {
    id: "demo-recession-2025",
    question: "Will the US enter a recession in 2025?",
    volume: 18000000,
    outcomes: ["Yes", "No"],
    endDate: "2025-12-31T23:59:59Z",
  },
  {
    id: "demo-openai-gpt5",
    question: "Will OpenAI release GPT-5 in 2025?",
    volume: 12000000,
    outcomes: ["Yes", "No"],
    endDate: "2025-12-31T23:59:59Z",
  },
  {
    id: "demo-tesla-fsd",
    question: "Will Tesla achieve Level 4 Full Self-Driving by 2025?",
    volume: 9000000,
    outcomes: ["Yes", "No"],
    endDate: "2025-12-31T23:59:59Z",
  },
];

interface PolymarketEvent {
  id: string;
  title: string;
  question?: string;
  volume_24h?: number;
  volume?: number;
  end_date?: string;
  end_date_iso?: string;
  image?: string;
  markets?: Array<{
    outcomes?: string;
    outcomePrices?: string[];
  }>;
}

/**
 * POST /api/search-market
 * Body: { tweetText: string }
 * 
 * Maps a random string of text to a Polymarket ID using AI matching.
 * Returns Market ID and current Odds.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
  try {
    const { tweetText } = await req.json();

    if (!tweetText || typeof tweetText !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid tweetText" },
        { status: 400 }
      );
    }

    console.log(`[search-market] Processing tweet text: ${tweetText.substring(0, 50)}...`);

    // Step 1: Fetch active markets from Polymarket Gamma API
    // Using public-search endpoint or events endpoint
    let markets: Array<{
      id: string;
      question: string;
      volume: number;
      outcomes: string[];
      endDate: string;
      image?: string;
    }> = [];

    try {
      // Fetch markets from multiple Polymarket API endpoints for diversity
      // This gets politics, crypto, sports, entertainment, and current events
      const endpoints = [
        // All active events (no ordering - catches everything including conference championships)
        `${POLYMARKET_GAMMA_API}/events?limit=500&active=true&closed=false`,
        // High volume events (most popular) - includes politics, major sports, etc.
        `${POLYMARKET_GAMMA_API}/events?limit=200&active=true&closed=false&order=volume&ascending=false`,
      ];

      const allEvents: PolymarketEvent[] = [];

      // Fetch from all endpoints in parallel
      const responses = await Promise.allSettled(
        endpoints.map(endpoint =>
          fetch(endpoint, {
            headers: { Accept: "application/json" },
            next: { revalidate: 300 },
          }).then(res => res.ok ? res.json() : [])
        )
      );

      for (const result of responses) {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          allEvents.push(...result.value);
        }
      }

      console.log(`[search-market] Fetched ${allEvents.length} events from Polymarket API`);

      // Also try to fetch individual markets for more granular matching
      try {
        const marketsResponse = await fetch(
          `${POLYMARKET_GAMMA_API}/markets?limit=50&active=true&closed=false`,
          {
            headers: { Accept: "application/json" },
            next: { revalidate: 300 },
          }
        );
        if (marketsResponse.ok) {
          const marketsData = await marketsResponse.json();
          if (Array.isArray(marketsData)) {
            // Convert market format to event format
            for (const m of marketsData) {
              allEvents.push({
                id: m.id || m.condition_id,
                title: m.question || m.title,
                question: m.question,
                volume_24h: m.volume24hr || m.volume_24h,
                volume: m.volumeNum || m.volume,
                end_date_iso: m.endDate || m.end_date_iso,
                image: m.image,
                markets: [{ outcomes: m.outcomes, outcomePrices: m.outcomePrices }],
              });
            }
            console.log(`[search-market] Added ${marketsData.length} individual markets`);
          }
        }
      } catch (e) {
        console.log("[search-market] Individual markets fetch failed, continuing with events");
      }

      // Process all events into our market format
      markets = allEvents.map((event) => {
        let outcomes: string[] = ["Yes", "No"];
        try {
          const marketData = event.markets?.[0];
          if (marketData?.outcomes) {
            if (typeof marketData.outcomes === 'string') {
              outcomes = JSON.parse(marketData.outcomes);
            } else if (Array.isArray(marketData.outcomes)) {
              outcomes = marketData.outcomes;
            }
          }
        } catch {
          // Keep default outcomes
        }

        return {
          id: String(event.id || ""),
          question: String(event.title || event.question || ""),
          volume: Number(event.volume_24h || event.volume || 0),
          outcomes,
          endDate: String(event.end_date || event.end_date_iso || ""),
          image: event.image,
        };
      }).filter(m => m.question && m.question.length > 10); // Filter out empty/short questions

    } catch (error) {
      console.error("[search-market] Error fetching markets:", error);
    }

    // Remove duplicates by question similarity (keep first occurrence)
    const seen = new Set<string>();
    markets = markets.filter(m => {
      const key = m.question.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const liveMarketCount = markets.length;
    
    // Add demo markets as fallback only if we have few live markets
    if (markets.length < 20) {
      const demoToAdd = DEMO_MARKETS.filter(demo => {
        const key = demo.question.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
        return !seen.has(key);
      });
      markets = [...markets, ...demoToAdd];
    }

    console.log(`[search-market] Searching ${markets.length} markets (${liveMarketCount} live + ${markets.length - liveMarketCount} demo fallback)`);

    // Step 2: AI Matching - Send Tweet Text + Top 20 Polymarket Results to AI
    // Ask: "Which of these markets matches this tweet? Return Market ID."
    const matchedMarket = await findMatchingMarket(tweetText, markets);

    if (!matchedMarket) {
      return NextResponse.json({
        found: false,
        message: "No matching market found for this tweet",
      });
    }

    console.log(`[search-market] AI matched to market: ${matchedMarket.question}`);

    // Step 3: Fetch full event details with all outcomes
    const eventDetails = await fetchEventOutcomes(matchedMarket.id);
    const odds = await fetchMarketOdds(matchedMarket.id);

    // Build Polymarket URL using slug (only for real markets, not demo)
    const polymarketUrl = matchedMarket.id.startsWith('demo-') 
      ? null 
      : `https://polymarket.com/event/${eventDetails?.slug || matchedMarket.id}`;

    // Use actual Polymarket title if available
    const title = eventDetails?.title || matchedMarket.question;

    // Step 4: Return Market ID, all outcomes with odds, and Polymarket URL
    return NextResponse.json({
      found: true,
      marketId: matchedMarket.id,
      question: title,
      polymarketUrl,
      // All outcomes with their odds (sorted by probability)
      outcomes: eventDetails?.outcomes || [
        { name: "Yes", price: odds?.yesPrice || 0.5, percentage: formatOdds(odds?.yesPrice || 0.5) },
        { name: "No", price: odds?.noPrice || 0.5, percentage: formatOdds(odds?.noPrice || 0.5) },
      ],
      // Legacy odds format for backward compatibility
      odds: odds
        ? {
            yes: formatOdds(odds.yesPrice),
            no: formatOdds(odds.noPrice),
            yesPrice: odds.yesPrice,
            noPrice: odds.noPrice,
            volume24h: odds.volume24h,
            volume: formatVolume(odds.volume24h),
          }
        : null,
      market: {
        id: matchedMarket.id,
        question: title,
        volume: eventDetails?.volume24h || matchedMarket.volume,
        endDate: eventDetails?.endDate || matchedMarket.endDate,
        image: eventDetails?.image || matchedMarket.image,
      },
    });
  } catch (error) {
    console.error("[search-market] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


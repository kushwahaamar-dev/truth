import { getCachedMarketOdds, setCachedMarketOdds } from "./supabase";

export interface MarketOdds {
  marketId: string;
  question: string;
  yesPrice: number; // 0-1 (e.g., 0.65 = 65%)
  noPrice: number;
  volume24h: number;
  endDate: string;
  lastUpdated: Date;
}

// Polymarket CLOB API endpoints
const POLYMARKET_CLOB_API = "https://clob.polymarket.com";
const POLYMARKET_GAMMA_API = "https://gamma-api.polymarket.com";

/**
 * Fetch real-time odds from Polymarket
 */
export async function fetchMarketOdds(marketId: string): Promise<MarketOdds | null> {
  // Check cache first
  const cached = await getCachedMarketOdds(marketId);
  if (cached) {
    return {
      marketId: cached.market_id,
      question: cached.question,
      yesPrice: cached.yes_price,
      noPrice: cached.no_price,
      volume24h: cached.volume_24h,
      endDate: cached.end_date,
      lastUpdated: new Date(cached.updated_at),
    };
  }

  try {
    // Try GAMMA API first (for event-level data)
    const gammaRes = await fetch(
      `${POLYMARKET_GAMMA_API}/events/${marketId}`,
      { next: { revalidate: 60 } }
    );

    if (gammaRes.ok) {
      const event = await gammaRes.json();
      
      // Extract market data from first market in event
      const market = event.markets?.[0];
      if (market) {
        // Parse outcomePrices - it's a JSON string array
        let yesPrice = 0.5;
        let noPrice = 0.5;
        try {
          if (market.outcomePrices) {
            const prices = typeof market.outcomePrices === 'string' 
              ? JSON.parse(market.outcomePrices)
              : market.outcomePrices;
            yesPrice = parseFloat(prices[0] || "0.5");
            noPrice = parseFloat(prices[1] || prices[0] || "0.5");
          }
        } catch (e) {
          console.warn("Failed to parse outcomePrices:", e);
        }

        // Get volume from various possible fields
        const volume24h = parseFloat(
          event.volume24hr || 
          event.volume24h || 
          event.volume || 
          market.volumeNum || 
          market.volume || 
          "0"
        );

        const odds: MarketOdds = {
          marketId,
          question: event.title || market.question || "",
          yesPrice,
          noPrice,
          volume24h,
          endDate: event.endDate || market.endDate || market.endDateIso || "",
          lastUpdated: new Date(),
        };

        // Cache the result
        await setCachedMarketOdds(marketId, {
          question: odds.question,
          yesPrice: odds.yesPrice,
          noPrice: odds.noPrice,
          volume24h: odds.volume24h,
          endDate: odds.endDate,
        });

        return odds;
      }
    }

    // Fallback to CLOB API for token-level data
    const clobRes = await fetch(
      `${POLYMARKET_CLOB_API}/markets/${marketId}`,
      { next: { revalidate: 60 } }
    );

    if (clobRes.ok) {
      const data = await clobRes.json();
      
      const odds: MarketOdds = {
        marketId,
        question: data.question || "",
        yesPrice: data.tokens?.[0]?.price || 0.5,
        noPrice: data.tokens?.[1]?.price || 0.5,
        volume24h: data.volume_24h || 0,
        endDate: data.end_date_iso || "",
        lastUpdated: new Date(),
      };

      await setCachedMarketOdds(marketId, {
        question: odds.question,
        yesPrice: odds.yesPrice,
        noPrice: odds.noPrice,
        volume24h: odds.volume24h,
        endDate: odds.endDate,
      });

      return odds;
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch market odds:", error);
    return null;
  }
}

/**
 * Format odds as percentage string
 */
export function formatOdds(price: number): string {
  return `${Math.round(price * 100)}%`;
}

/**
 * Format volume with abbreviation
 */
export function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(1)}M`;
  } else if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(1)}K`;
  }
  return `$${volume.toFixed(0)}`;
}

/**
 * Calculate implied probability from market odds
 */
export function getImpliedProbability(yesPrice: number, noPrice: number): {
  yes: number;
  no: number;
  spread: number;
} {
  const total = yesPrice + noPrice;
  return {
    yes: yesPrice / total,
    no: noPrice / total,
    spread: Math.abs(total - 1), // Market spread/vig
  };
}

/**
 * Outcome with odds
 */
export interface OutcomeOdds {
  name: string;
  price: number;
  percentage: string;
}

/**
 * Full event details with all outcomes
 */
export interface EventDetails {
  id: string;
  slug: string;
  title: string;
  image?: string;
  volume24h: number;
  endDate: string;
  outcomes: OutcomeOdds[];
}

/**
 * Fetch all outcomes for an event from Polymarket
 */
export async function fetchEventOutcomes(eventId: string): Promise<EventDetails | null> {
  try {
    const res = await fetch(
      `${POLYMARKET_GAMMA_API}/events/${eventId}`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) return null;

    const event = await res.json();
    const markets = event.markets || [];
    
    // Extract outcomes from all markets
    const outcomes: OutcomeOdds[] = [];
    
    // Check if this is a multi-market event (like Big 12 Championship with one market per team)
    const isMultiMarketEvent = markets.length > 2;
    
    if (isMultiMarketEvent) {
      // Multi-outcome market: extract team/option names from each market
      for (const market of markets) {
        const question = market.question || "";
        let outcomeName = "";
        
        // Pattern matchers for different question formats
        // "Will Kansas State win the 2025 Big 12 Championship Game?" -> "Kansas State"
        // "Will Bitcoin reach $120,000 by December 31, 2025?" -> "$120,000"
        // "Will Trump deport 250,000-500,000 people?" -> "250K-500K"
        // "Will Ethereum dip to $3,000 by December 31?" -> "$3,000 (dip)"
        
        const willWinMatch = question.match(/Will (.+?) win/i);
        const reachPriceMatch = question.match(/reach \$?([\d,]+)/i);
        const dipPriceMatch = question.match(/dip to \$?([\d,]+)/i);
        const deportMatch = question.match(/deport ([\d,]+-[\d,]+|less than [\d,]+|[\d,]+ or more)/i);
        const moreOrLessMatch = question.match(/(more|less) than ([\d,]+)/i);
        
        if (willWinMatch) {
          // Remove "the" prefix from team names
          outcomeName = willWinMatch[1].replace(/^the\s+/i, '');
        } else if (reachPriceMatch) {
          outcomeName = `$${reachPriceMatch[1]}+`;
        } else if (dipPriceMatch) {
          outcomeName = `≤$${dipPriceMatch[1]}`;
        } else if (deportMatch) {
          // Clean up numbers: "250,000-500,000" -> "250K-500K"
          outcomeName = deportMatch[1]
            .replace(/,000,000/g, 'M')
            .replace(/,000/g, 'K')
            .replace(/less than /i, '<')
            .replace(/ or more/i, '+');
        } else if (moreOrLessMatch) {
          const symbol = moreOrLessMatch[1].toLowerCase() === 'more' ? '>' : '<';
          outcomeName = `${symbol}${moreOrLessMatch[2].replace(/,000,000/g, 'M').replace(/,000/g, 'K')}`;
        } else if (question.match(/(.+?) out as (.+?) CEO/i)) {
          // CEO markets: "Dan Clancy out as Twitch CEO" -> "Dan Clancy (Twitch)"
          const ceoMatch = question.match(/(.+?) out as (.+?) CEO/i);
          if (ceoMatch) {
            outcomeName = `${ceoMatch[1]} (${ceoMatch[2]})`;
          }
        } else {
          // Fallback: try to get from outcomes array if it's not Yes/No
          try {
            const marketOutcomes = typeof market.outcomes === 'string' 
              ? JSON.parse(market.outcomes) 
              : market.outcomes;
            if (marketOutcomes && marketOutcomes[0] && marketOutcomes[0] !== "Yes") {
              outcomeName = marketOutcomes[0];
            }
          } catch {}
          
          // Last resort: truncate the question
          if (!outcomeName) {
            outcomeName = question.length > 30 ? question.substring(0, 30) + '...' : question;
          }
        }
        
        // Get the YES price (probability of this outcome)
        let yesPrice = 0;
        try {
          const prices = typeof market.outcomePrices === 'string'
            ? JSON.parse(market.outcomePrices)
            : market.outcomePrices;
          yesPrice = parseFloat(prices?.[0] || "0");
        } catch {}
        
        // Only add if we have a meaningful price
        if (yesPrice > 0.001) {
          outcomes.push({
            name: outcomeName.trim(),
            price: yesPrice,
            percentage: formatOdds(yesPrice),
          });
        }
      }
      
      // Sort by probability (highest first)
      outcomes.sort((a, b) => b.price - a.price);
    } else if (markets.length > 0) {
      // Simple Yes/No market: use actual outcomes from the market
      const market = markets[0];
      try {
        const marketOutcomes = typeof market.outcomes === 'string' 
          ? JSON.parse(market.outcomes) 
          : market.outcomes || ["Yes", "No"];
        const prices = typeof market.outcomePrices === 'string'
          ? JSON.parse(market.outcomePrices)
          : market.outcomePrices || ["0.5", "0.5"];
        
        for (let i = 0; i < marketOutcomes.length; i++) {
          const price = parseFloat(prices[i] || "0");
          outcomes.push({
            name: marketOutcomes[i], // Use actual outcome name (Yes/No)
            price,
            percentage: formatOdds(price),
          });
        }
      } catch {}
    }

    return {
      id: eventId,
      slug: event.slug || event.ticker || eventId,
      title: event.title || event.question || "",
      image: event.image,
      volume24h: parseFloat(event.volume24hr || event.volume || "0"),
      endDate: event.endDate || "",
      outcomes,
    };
  } catch (error) {
    console.error("Failed to fetch event outcomes:", error);
    return null;
  }
}


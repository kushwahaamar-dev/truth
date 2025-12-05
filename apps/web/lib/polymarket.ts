export interface PolyMarket {
  id: string;
  question: string;
  volume: number;
  outcomes: string[];
  endDate: string;
  image?: string;
}

// Mock data for development/demo
const MOCK_MARKETS: PolyMarket[] = [
  {
    id: "btc-100k-2025",
    question: "Will Bitcoin hit $100k by 2025?",
    volume: 15000000,
    outcomes: ["Yes", "No"],
    endDate: "2025-12-31",
    image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800",
  },
  {
    id: "eth-10k",
    question: "Will Ethereum reach $10,000?",
    volume: 8000000,
    outcomes: ["Yes", "No"],
    endDate: "2025-06-30",
    image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800",
  },
  {
    id: "solana-500",
    question: "Will Solana hit $500?",
    volume: 5000000,
    outcomes: ["Yes", "No"],
    endDate: "2025-06-30",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
  },
  {
    id: "trump-2024",
    question: "Will Trump win the 2024 presidential election?",
    volume: 50000000,
    outcomes: ["Yes", "No"],
    endDate: "2024-11-05",
  },
  {
    id: "fed-rate-cut",
    question: "Will the Fed cut rates in December 2024?",
    volume: 12000000,
    outcomes: ["Yes", "No"],
    endDate: "2024-12-31",
  },
  {
    id: "spacex-starship",
    question: "Will SpaceX Starship reach orbit by end of 2024?",
    volume: 3000000,
    outcomes: ["Yes", "No"],
    endDate: "2024-12-31",
  },
  {
    id: "ai-agi-2025",
    question: "Will AGI be achieved by 2025?",
    volume: 2000000,
    outcomes: ["Yes", "No"],
    endDate: "2025-12-31",
  },
];

export async function fetchTopMarkets(): Promise<PolyMarket[]> {
  // Try real Polymarket API first
  const endpoint =
    "https://gamma-api.polymarket.com/events?limit=50&active=true&closed=false&order=volume";

  try {
    const res = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      console.warn(
        `Polymarket API returned ${res.status}, falling back to mock data`
      );
      return MOCK_MARKETS;
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.warn("Polymarket API returned empty data, using mock markets");
      return MOCK_MARKETS;
    }

    // Map raw API response to our interface
    return data.map((event: Record<string, unknown>) => {
      let outcomes: string[] = ["Yes", "No"];
      try {
        const markets = event.markets as Array<{ outcomes?: string }>;
        if (markets?.[0]?.outcomes) {
          outcomes = JSON.parse(markets[0].outcomes);
        }
      } catch {
        // Keep default outcomes
      }

      // Get the first market from the event
      const market = (event.markets as Array<any>)?.[0];
      
      return {
        id: String(event.id || market?.id || ""),
        question: String(event.title || market?.question || event.question || ""),
        volume: Number(
          event.volume24hr || 
          event.volume24h || 
          event.volume || 
          market?.volumeNum || 
          market?.volume || 
          0
        ),
        outcomes,
        endDate: String(
          event.endDate || 
          market?.endDate || 
          market?.endDateIso || 
          event.end_date || 
          event.end_date_iso || 
          ""
        ),
        image: (event.image || market?.image) as string | undefined,
      };
    });
  } catch (error) {
    console.error("Polymarket Fetch Error:", error);
    console.log("Using mock markets for development");
    return MOCK_MARKETS;
  }
}

export async function getMarketById(
  marketId: string
): Promise<PolyMarket | null> {
  const markets = await fetchTopMarkets();
  return markets.find((m) => m.id === marketId) || null;
}

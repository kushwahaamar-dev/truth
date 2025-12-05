import { NextResponse } from "next/server";
import { fetchTopMarkets, getMarketById } from "@/lib/polymarket";

// GET /api/markets - List all markets
// GET /api/markets?id=xxx - Get a specific market
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const marketId = url.searchParams.get("id");

    if (marketId) {
      const market = await getMarketById(marketId);
      if (!market) {
        return NextResponse.json({ error: "Market not found" }, { status: 404 });
      }
      return NextResponse.json(market);
    }

    const markets = await fetchTopMarkets();
    return NextResponse.json(markets);
  } catch (error) {
    console.error("Markets API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}



"use client";

import { useState, useEffect } from "react";
import { BASE_URL } from "@/lib/constants";

interface Market {
  id: string;
  question: string;
  volume: number;
  outcomes: string[];
  endDate: string;
  image?: string;
}

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/markets")
      .then((res) => res.json())
      .then((data) => {
        setMarkets(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getBlinkUrl = (marketId: string) => {
    const actionUrl = `${BASE_URL}/api/actions/bet?marketId=${marketId}`;
    return `https://dial.to/?action=solana-action:${encodeURIComponent(actionUrl)}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-sm text-gray-300">Live on Solana Devnet</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                Truth
              </span>
              <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                Blink
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Bet on viral claims directly from Twitter/X using{" "}
              <span className="text-purple-400 font-semibold">Solana Blinks</span>.
              Place USDC bets on prediction markets without leaving your feed.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="#markets"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold hover:opacity-90 transition-opacity"
              >
                View Markets
              </a>
              <a
                href="https://github.com/truthblink"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors"
              >
                GitHub →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            How TruthBlink Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Browse Twitter",
                desc: "Our extension scans tweets in your feed",
                icon: "🐦",
              },
              {
                step: "02",
                title: "AI Matching",
                desc: "Gemini AI matches tweets to prediction markets",
                icon: "🤖",
              },
              {
                step: "03",
                title: "Click Bet",
                desc: "A Blink button appears on matched tweets",
                icon: "⚡",
              },
              {
                step: "04",
                title: "Win USDC",
                desc: "Place bets and win from the pool",
                icon: "💰",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-xs font-mono text-purple-400 mb-2">
                  STEP {item.step}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <section id="markets" className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Active Markets
          </h2>
          <p className="text-center text-gray-400 mb-12">
            Click any market to open the Solana Blink and place your bet
          </p>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market) => (
                <div
                  key={market.id}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border transition-all duration-300 cursor-pointer ${
                    selectedMarket === market.id
                      ? "border-purple-500 shadow-lg shadow-purple-500/20"
                      : "border-white/10 hover:border-white/20"
                  }`}
                  onClick={() =>
                    setSelectedMarket(
                      selectedMarket === market.id ? null : market.id
                    )
                  }
                >
                  {/* Market Image */}
                  <div className="h-32 bg-gradient-to-br from-purple-900/50 to-cyan-900/50 flex items-center justify-center">
                    <span className="text-5xl">
                      {market.question.includes("Bitcoin")
                        ? "₿"
                        : market.question.includes("Ethereum")
                        ? "Ξ"
                        : market.question.includes("Solana")
                        ? "◎"
                        : "🎯"}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-3 line-clamp-2">
                      {market.question}
                    </h3>

                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <span>
                        Vol: ${(market.volume / 1_000_000).toFixed(1)}M
                      </span>
                      <span>
                        Ends:{" "}
                        {new Date(market.endDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {selectedMarket === market.id && (
                      <div className="pt-4 border-t border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <a
                          href={getBlinkUrl(market.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-center hover:opacity-90 transition-opacity"
                        >
                          ✅ Bet YES
                        </a>
                        <a
                          href={getBlinkUrl(market.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-center hover:opacity-90 transition-opacity"
                        >
                          ❌ Bet NO
                        </a>
                        <p className="text-xs text-gray-500 text-center">
                          Opens in Dialect Blink viewer
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                TruthBlink
              </span>
              <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                BETA
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Built for Solana Hackathon 2024 • Powered by Solana Blinks & Gemini AI
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

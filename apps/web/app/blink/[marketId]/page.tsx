"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BASE_URL } from "@/lib/constants";

interface MarketData {
  title: string;
  description: string;
  icon: string;
  odds?: {
    yes: string;
    no: string;
    volume: string;
  };
}

export default function BlinkPreview() {
  const params = useParams();
  const marketId = params.marketId as string;
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSide, setSelectedSide] = useState<"yes" | "no" | null>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    fetch(`/api/actions/bet?marketId=${marketId}`)
      .then((res) => res.json())
      .then((data) => {
        setMarket({
          title: data.title || "Market",
          description: data.description || "",
          icon: data.icon || "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [marketId]);

  const getDialectUrl = () => {
    const actionUrl = `${BASE_URL}/api/actions/bet?marketId=${marketId}`;
    return `https://dial.to/?action=solana-action:${encodeURIComponent(actionUrl)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 flex items-center justify-center p-4">
      {/* Mobile-optimized Blink Card */}
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10">
          {/* Header Image */}
          <div className="relative h-48 sm:h-56 bg-gradient-to-br from-purple-600/50 to-cyan-600/50">
            {market?.icon && (
              <img
                src={market.icon}
                alt=""
                className="w-full h-full object-cover opacity-60"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
            
            {/* Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-medium text-white">Live Market</span>
            </div>

            {/* Logo */}
            <div className="absolute top-4 right-4 text-white/80">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {market?.title}
            </h1>

            {/* Description */}
            {market?.description && (
              <p className="text-sm text-gray-400 whitespace-pre-line">
                {market.description}
              </p>
            )}

            {/* Odds Display */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedSide("yes")}
                className={`relative p-4 rounded-2xl border-2 transition-all ${
                  selectedSide === "yes"
                    ? "border-green-500 bg-green-500/10"
                    : "border-white/10 bg-white/5 hover:border-green-500/50"
                }`}
              >
                <div className="text-3xl font-black text-green-400">YES</div>
                <div className="text-xs text-gray-400 mt-1">Click to bet</div>
                {selectedSide === "yes" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>

              <button
                onClick={() => setSelectedSide("no")}
                className={`relative p-4 rounded-2xl border-2 transition-all ${
                  selectedSide === "no"
                    ? "border-red-500 bg-red-500/10"
                    : "border-white/10 bg-white/5 hover:border-red-500/50"
                }`}
              >
                <div className="text-3xl font-black text-red-400">NO</div>
                <div className="text-xs text-gray-400 mt-1">Click to bet</div>
                {selectedSide === "no" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>

            {/* Amount Input */}
            {selectedSide && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-gray-300">
                  Bet Amount (USDC)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-medium placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2">
                  {[5, 10, 25, 50, 100].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val.toString())}
                      className="flex-1 py-2 px-3 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-colors"
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <a
              href={getDialectUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full py-4 rounded-2xl font-bold text-lg text-center transition-all ${
                selectedSide && amount
                  ? selectedSide === "yes"
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:opacity-90"
                    : "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:opacity-90"
                  : "bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:opacity-90"
              }`}
            >
              {selectedSide && amount
                ? `Bet $${amount} on ${selectedSide.toUpperCase()}`
                : "Open in Wallet →"}
            </a>

            {/* Footer */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="text-xs text-gray-500">Powered by</span>
              <span className="text-xs font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                TruthBlink
              </span>
              <span className="text-xs text-gray-500">on Solana</span>
            </div>
          </div>
        </div>

        {/* Mobile hint */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Connect your Solana wallet to place bets
        </p>
      </div>
    </div>
  );
}


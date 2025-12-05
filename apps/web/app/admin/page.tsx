"use client";

import { useState } from "react";

interface ApiResponse {
  success?: boolean;
  error?: string;
  signature?: string;
  marketId?: string;
  marketPda?: string;
  outcome?: string;
}

export default function AdminDashboard() {
  const [apiKey, setApiKey] = useState("");
  const [marketId, setMarketId] = useState("");
  const [outcome, setOutcome] = useState<"yes" | "no">("yes");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const initializeMarket = async () => {
    if (!apiKey || !marketId) {
      setResult({ error: "API Key and Market ID required" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ marketId }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Request failed" });
    }
    setLoading(false);
  };

  const resolveMarket = async () => {
    if (!apiKey || !marketId) {
      setResult({ error: "API Key and Market ID required" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ marketId, outcomeYes: outcome === "yes" }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Request failed" });
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400">Manage TruthBlink markets</p>
          </div>
        </div>

        {/* API Key Input */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Admin API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your ADMIN_API_KEY"
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Market ID Input */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Market ID
          </label>
          <input
            type="text"
            value={marketId}
            onChange={(e) => setMarketId(e.target.value)}
            placeholder="e.g., btc-100k-2025"
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={initializeMarket}
            disabled={loading}
            className="py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "Loading..." : "🆕 Initialize Market"}
          </button>

          <div className="flex gap-2">
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as "yes" | "no")}
              aria-label="Winning outcome"
              className="flex-1 px-4 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none"
            >
              <option value="yes">YES Wins</option>
              <option value="no">NO Wins</option>
            </select>
            <button
              onClick={resolveMarket}
              disabled={loading}
              className="py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              ✅ Resolve
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`p-6 rounded-2xl ${
              result.error
                ? "bg-red-500/10 border border-red-500/30"
                : "bg-green-500/10 border border-green-500/30"
            }`}
          >
            <h3
              className={`font-bold mb-2 ${
                result.error ? "text-red-400" : "text-green-400"
              }`}
            >
              {result.error ? "❌ Error" : "✅ Success"}
            </h3>
            <pre className="text-sm text-gray-300 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
          <h3 className="font-bold text-white mb-4">📖 How to Use</h3>
          <ol className="space-y-2 text-sm text-gray-400">
            <li>1. Set ADMIN_API_KEY and ADMIN_PRIVATE_KEY in .env.local</li>
            <li>2. Enter your API key above</li>
            <li>3. Enter a unique Market ID (e.g., "btc-100k-2025")</li>
            <li>4. Click "Initialize Market" to create on-chain</li>
            <li>5. When ready, select outcome and click "Resolve"</li>
          </ol>
        </div>
      </div>
    </main>
  );
}


import React, { useState, useEffect } from "react";
import "./popup.css";

interface Market {
  id: string;
  question: string;
  volume: number;
}

function Popup() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.PLASMO_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    fetch(`${API_BASE}/api/markets`)
      .then((res) => res.json())
      .then((data) => {
        setMarkets(data.slice(0, 5)); // Show top 5
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load markets");
        setLoading(false);
      });
  }, []);

  const openBlink = (marketId: string) => {
    const blinkUrl = `${API_BASE}/api/actions/bet?marketId=${marketId}`;
    const dialectUrl = `https://dial.to/?action=solana-action:${encodeURIComponent(blinkUrl)}`;
    chrome.tabs.create({ url: dialectUrl });
  };

  const openDashboard = () => {
    chrome.tabs.create({ url: API_BASE });
  };

  return (
    <div className="popup-container">
      {/* Header */}
      <header className="popup-header">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span>TruthBlink</span>
        </div>
        <div className="badge">BETA</div>
      </header>

      {/* Content */}
      <main className="popup-content">
        <h2>🔥 Trending Markets</h2>

        {loading && (
          <div className="loading">
            <div className="spinner" />
            <span>Loading markets...</span>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {!loading && !error && (
          <div className="markets-list">
            {markets.map((market) => (
              <button
                key={market.id}
                className="market-item"
                onClick={() => openBlink(market.id)}
              >
                <span className="market-question">
                  {market.question.length > 50
                    ? market.question.substring(0, 50) + "..."
                    : market.question}
                </span>
                <span className="market-volume">
                  ${(market.volume / 1_000_000).toFixed(1)}M
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="popup-footer">
        <button className="footer-btn" onClick={openDashboard}>
          Open Dashboard
        </button>
        <a
          href="https://github.com/truthblink"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}

export default Popup;


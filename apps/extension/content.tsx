import type { PlasmoCSConfig } from "plasmo";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*", "https://x.com/*"],
  all_frames: true,
};

// Configuration - Update for production
const API_BASE = process.env.PLASMO_PUBLIC_API_URL || "http://localhost:3000";

// Helper to find tweet text
const getTweetText = (article: HTMLElement): string | null => {
  const textNode = article.querySelector('[data-testid="tweetText"]');
  return textNode ? textNode.textContent : null;
};

// Extract tweet ID from article element
const getTweetId = (article: HTMLElement): string | null => {
  const timeElement = article.querySelector("time");
  const linkElement = timeElement?.closest("a");
  if (linkElement?.href) {
    const parts = linkElement.href.split("/");
    return parts[parts.length - 1] || null;
  }
  return null;
};

interface OutcomeOdds {
  name: string;
  price: number;
  percentage: string;
}

interface MatchResult {
  found: boolean;
  marketId?: string;
  question?: string;
  blinkUrl?: string;
  polymarketUrl?: string;
  outcomes?: OutcomeOdds[];
  odds?: {
    yes: string;
    no: string;
    volume: string;
    volume24h?: number;
  };
  market?: {
    id: string;
    question: string;
    volume: number;
    endDate: string;
    image?: string;
  };
}

// Process a single tweet
const processTweet = async (article: HTMLElement) => {
  // Skip if already processed
  if (article.dataset.truthblinkProcessed) return;
  article.dataset.truthblinkProcessed = "true";

  const text = getTweetText(article);
  if (!text) {
    console.log("🔍 TruthBlink: No text found in tweet");
    return;
  }
  
  if (text.length < 15) {
    console.log("🔍 TruthBlink: Tweet too short:", text.substring(0, 30));
    return;
  }

  const tweetId = getTweetId(article);
  console.log(`🔍 TruthBlink: Processing tweet ${tweetId}: "${text.substring(0, 50)}..."`);

  try {
    // Use /api/search-market as specified in the plan
    const response = await fetch(`${API_BASE}/api/search-market`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tweetText: text }),
    });

    if (!response.ok) {
      console.log(`🔍 TruthBlink: API error ${response.status} for tweet ${tweetId}`);
      return;
    }

    const data: MatchResult = await response.json();
    console.log(`🔍 TruthBlink: API response for "${text.substring(0, 30)}...":`, data.found ? `MATCHED: ${data.question}` : "No match");

    if (data.found && data.marketId) {
      // Construct blinkUrl from marketId if not provided
      const blinkUrl = data.blinkUrl || `${API_BASE}/api/actions/bet?marketId=${data.marketId}`;
      console.log(`✅ TruthBlink: Injecting button for market: ${data.question}`);
      injectButton(article, { ...data, blinkUrl });
    }
  } catch (error) {
    console.error("❌ TruthBlink: Failed to process tweet", error);
  }
};

// Inject the Bet button into the tweet's action bar
const injectButton = (article: HTMLElement, data: MatchResult) => {
  const actionGroup = article.querySelector('[role="group"]');
  if (!actionGroup) return;

  // Check if button already exists
  if (actionGroup.querySelector(".tb-bet-container")) return;

  const container = document.createElement("div");
  container.className = "tb-bet-container";
  actionGroup.appendChild(container);

  const root = createRoot(container);
  root.render(
    <BetButton
      blinkUrl={data.blinkUrl!}
      question={data.question || ""}
      outcomes={data.outcomes}
      odds={data.odds}
      polymarketUrl={data.polymarketUrl}
    />
  );
};

// Bet Button Component
const BetButton = ({
  blinkUrl,
  question,
  outcomes,
  odds,
  polymarketUrl,
}: {
  blinkUrl: string;
  question: string;
  outcomes?: OutcomeOdds[];
  odds?: { yes: string; no: string; volume: string };
  polymarketUrl?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Build Dialect Blink URL
    const dialectUrl = `https://dial.to/?action=solana-action:${encodeURIComponent(
      blinkUrl
    )}`;
    
    console.log("🎯 TruthBlink: Opening Dialect URL:", dialectUrl);
    
    // Try multiple methods to open the URL
    try {
      // Method 1: Create an anchor element and click it (most reliable)
      const link = document.createElement('a');
      link.href = dialectUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("🎯 TruthBlink: Error opening URL:", err);
      // Fallback: try window.open
      const newWindow = window.open(dialectUrl, '_blank');
      if (!newWindow) {
        // If popup blocked, navigate directly
        console.log("🎯 TruthBlink: Popup blocked, navigating directly");
        window.location.href = dialectUrl;
      }
    }
  };

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const tooltipWidth = 300;
      
      // Calculate estimated height based on outcomes
      const outcomeCount = outcomes?.length || 2;
      const tooltipHeight = 180 + Math.min(outcomeCount, 6) * 32;
      
      // Position tooltip above the button, centered horizontally
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      let top = rect.top - tooltipHeight - 16;
      
      // Keep tooltip within viewport
      const padding = 16;
      
      // Horizontal bounds
      if (left < padding) {
        left = padding;
      } else if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding;
      }
      
      // If not enough room above, show below
      if (top < padding) {
        top = rect.bottom + 16;
      }
      
      // Ensure tooltip doesn't go below viewport
      if (top + tooltipHeight > window.innerHeight - padding) {
        top = window.innerHeight - tooltipHeight - padding;
      }
      
      setTooltipPos({ top, left });
    }
    setIsHovered(true);
  };

  return (
    <div
      className="tb-bet-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button 
        ref={buttonRef}
        type="button" 
        className="tb-bet-button" 
        onClick={handleClick}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ position: 'relative', zIndex: 10 }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span>Bet</span>
        {outcomes && outcomes.length > 0 && (
          <span className="tb-bet-odds">{outcomes[0].percentage}</span>
        )}
        {!outcomes && odds && <span className="tb-bet-odds">{odds.yes}</span>}
      </button>
      {isHovered && (
        <div 
          className="tb-tooltip"
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
        >
          <span className="tb-tooltip-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            PREDICTION MARKET
          </span>
          <span className="tb-tooltip-text">{question}</span>
          {outcomes && outcomes.length > 0 ? (
            <div className="tb-tooltip-odds">
              {outcomes.slice(0, 6).map((outcome, index) => (
                <div className="tb-odds-row" key={index}>
                  <span className="tb-odds-label">{outcome.name}</span>
                  <span className={`tb-odds-value ${outcome.price > 0.5 ? 'tb-odds-yes' : outcome.price > 0.2 ? 'tb-odds-mid' : 'tb-odds-no'}`}>
                    {outcome.percentage}
                  </span>
                </div>
              ))}
              {outcomes.length > 6 && (
                <div className="tb-odds-more">+{outcomes.length - 6} more options</div>
              )}
              {odds?.volume && (
                <div className="tb-odds-volume">
                  Volume: {odds.volume}
                </div>
              )}
            </div>
          ) : odds && (
            <div className="tb-tooltip-odds">
              <div className="tb-odds-row">
                <span className="tb-odds-label">YES</span>
                <span className="tb-odds-value tb-odds-yes">{odds.yes}</span>
              </div>
              <div className="tb-odds-row">
                <span className="tb-odds-label">NO</span>
                <span className="tb-odds-value tb-odds-no">{odds.no}</span>
              </div>
              {odds.volume && (
              <div className="tb-odds-volume">
                  Volume: {odds.volume}
              </div>
              )}
            </div>
          )}
          {polymarketUrl && (
            <a 
              href={polymarketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tb-polymarket-link"
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              View on Polymarket
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// Debounced processing queue
let processQueue: HTMLElement[] = [];
let processTimeout: NodeJS.Timeout | null = null;

const queueTweet = (article: HTMLElement) => {
  if (!processQueue.includes(article)) {
    processQueue.push(article);
  }

  if (processTimeout) clearTimeout(processTimeout);

  processTimeout = setTimeout(() => {
    const batch = processQueue.splice(0, 5); // Process 5 at a time
    batch.forEach(processTweet);
  }, 500); // 500ms debounce
};

// Mutation Observer to detect new tweets
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof HTMLElement) {
        // Check if the node itself is an article
        if (node.tagName === "ARTICLE") {
          queueTweet(node);
        }
        // Check for articles within the added node
        const articles = node.querySelectorAll("article");
        articles.forEach((article) => queueTweet(article as HTMLElement));
      }
    }
  }
});

// Initialize observer when page loads
const init = () => {
  console.log("🎯 TruthBlink Extension Loaded");
  console.log("🎯 API Base:", API_BASE);
  
  // Process existing tweets immediately
  const articles = document.querySelectorAll("article");
  console.log(`🎯 Found ${articles.length} tweets on page`);
  
  articles.forEach((article) => {
    queueTweet(article as HTMLElement);
  });

  // Watch for new tweets
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also re-scan periodically for dynamically loaded content
  setInterval(() => {
    const newArticles = document.querySelectorAll("article:not([data-truthblink-processed])");
    if (newArticles.length > 0) {
      console.log(`🎯 Found ${newArticles.length} new tweets`);
      newArticles.forEach((article) => {
        queueTweet(article as HTMLElement);
      });
    }
  }, 2000); // Check every 2 seconds
};

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Plasmo expects a default React component export for inline/overlay mounts.
// We do all DOM manipulation manually above, so this component renders nothing.
const PlaceholderContent = () => null;

export default PlaceholderContent;

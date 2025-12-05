import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const marketId = searchParams.get("marketId") || "unknown";
  const title = searchParams.get("title") || "Bet on the Truth";
  const yesOdds = searchParams.get("yes") || "50%";
  const noOdds = searchParams.get("no") || "50%";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#14F195"
            strokeWidth="2"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            TruthBlink
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            maxWidth: "80%",
            lineHeight: 1.3,
            marginBottom: "40px",
          }}
        >
          {title}
        </div>

        {/* Odds */}
        <div
          style={{
            display: "flex",
            gap: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "24px 48px",
              background: "rgba(20, 241, 149, 0.1)",
              border: "2px solid rgba(20, 241, 149, 0.3)",
              borderRadius: "16px",
            }}
          >
            <span style={{ fontSize: "24px", color: "#888", marginBottom: "8px" }}>
              YES
            </span>
            <span style={{ fontSize: "48px", fontWeight: "bold", color: "#14F195" }}>
              {yesOdds}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "24px 48px",
              background: "rgba(255, 107, 107, 0.1)",
              border: "2px solid rgba(255, 107, 107, 0.3)",
              borderRadius: "16px",
            }}
          >
            <span style={{ fontSize: "24px", color: "#888", marginBottom: "8px" }}>
              NO
            </span>
            <span style={{ fontSize: "48px", fontWeight: "bold", color: "#FF6B6B" }}>
              {noOdds}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#666",
            fontSize: "18px",
          }}
        >
          <span>Powered by Solana Blinks</span>
          <span style={{ color: "#9945FF" }}>⚡</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}


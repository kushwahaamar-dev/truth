import { GoogleGenerativeAI } from "@google/generative-ai";
import { PolyMarket } from "./polymarket";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function findMatchingMarket(
  tweetText: string,
  markets: PolyMarket[]
): Promise<PolyMarket | null> {
  if (!markets.length) return null;

  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not configured, using keyword matching fallback");
    return fallbackMatch(tweetText, markets);
  }

  const marketsList = markets
    .map((m) => `- ID: ${m.id} | Question: ${m.question}`)
    .join("\n");

  const prompt = `You are a prediction market matchmaker for a decentralized betting platform.

I will give you a Tweet text and a list of active prediction markets.
Your goal is to identify if the Tweet is discussing the SPECIFIC event in one of the markets.

Rules:
1. Return ONLY the ID of the matching market (nothing else).
2. If no market matches with high confidence, return exactly "null".
3. Be strict. Vague or tangential matches should be rejected.
4. The tweet must be making a claim or discussing the specific event/outcome.

Tweet: "${tweetText}"

Active Markets:
${marketsList}

Your response (just the market ID or "null"):`;

  try {
    // Try different model names as Google updates them frequently
    const modelNames = [
      "gemini-2.0-flash-exp",
      "gemini-1.5-flash-latest", 
      "gemini-1.5-flash-001",
      "gemini-pro"
    ];
    
    let result;
    let lastError;
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(prompt);
        console.log(`Successfully used Gemini model: ${modelName}`);
        break;
      } catch (e: any) {
        lastError = e;
        console.log(`Model ${modelName} failed, trying next...`);
        continue;
      }
    }
    
    if (!result) {
      throw lastError || new Error("All Gemini models failed");
    }
    
    const response = result.response;
    const text = response.text().trim();

    if (!text || text.toLowerCase() === "null") return null;

    // Clean up response and find matching market
    const matchedId = text.replace(/['"]/g, "").trim();
    const market = markets.find((m) => m.id === matchedId);

    if (market) {
      console.log(`AI matched tweet to market: ${market.question}`);
    }

    return market || null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback to keyword matching
    return fallbackMatch(tweetText, markets);
  }
}

// Crypto asset mappings for smart matching
const CRYPTO_ALIASES: Record<string, string[]> = {
  'bitcoin': ['bitcoin', 'btc', '$btc'],
  'ethereum': ['ethereum', 'eth', '$eth', 'ether'],
  'solana': ['solana', 'sol', '$sol'],
  'xrp': ['xrp', '$xrp', 'ripple'],
  'dogecoin': ['doge', 'dogecoin', '$doge'],
};

// Price-related keywords that suggest interest in price markets
const PRICE_KEYWORDS = [
  'pump', 'dump', 'moon', 'crash', 'bullish', 'bearish',
  'surge', 'plunge', 'rally', 'ath', 'all time high',
  'price', 'hit', '100k', '150k', '200k', '$', 'target',
  '2025', 'prediction', 'year', 'end of', 'eoy'
];

// STRICT keyword-based fallback - only match when HIGHLY confident
function fallbackMatch(
  tweetText: string,
  markets: PolyMarket[]
): PolyMarket | null {
  const lowerText = tweetText.toLowerCase();

  // === CRYPTO MATCHING ===
  // Match if tweet mentions crypto AND has price/prediction context
  const hasPriceKeyword = PRICE_KEYWORDS.some(kw => lowerText.includes(kw));
  
  for (const [cryptoName, aliases] of Object.entries(CRYPTO_ALIASES)) {
    const tweetHasCrypto = aliases.some(alias => {
      // Must be a word boundary match, not partial
      const regex = new RegExp(`\\b${alias.replace('$', '\\$')}\\b`, 'i');
      return regex.test(lowerText);
    });
    
    if (tweetHasCrypto && hasPriceKeyword) {
      // First try to match "What price will X hit" markets
      const priceMarket = markets.find(m => {
        const q = m.question.toLowerCase();
        return q.includes(cryptoName) && (q.includes('price') || q.includes('hit'));
      });
      if (priceMarket) {
        console.log(`Crypto price match: ${priceMarket.question}`);
        return priceMarket;
      }
      
      // Fallback to any crypto-related market
      const cryptoMarket = markets.find(m => {
        const q = m.question.toLowerCase();
        return q.includes(cryptoName);
      });
      if (cryptoMarket) {
        console.log(`Crypto match: ${cryptoMarket.question}`);
        return cryptoMarket;
      }
    }
  }

  // === TRUMP MATCHING ===
  // Match tweets about Trump to Trump-related markets
  const trumpKeywords = ['trump', 'donald', 'maga', '47', 'potus'];
  const hasTrumpContext = trumpKeywords.some(kw => lowerText.includes(kw));
  
  if (hasTrumpContext) {
    // Look for specific Trump topics
    if (lowerText.includes('deport') || lowerText.includes('immigration') || lowerText.includes('border')) {
      const deportMarket = markets.find(m => m.question.toLowerCase().includes('trump') && m.question.toLowerCase().includes('deport'));
      if (deportMarket) {
        console.log(`Trump deportation match: ${deportMarket.question}`);
        return deportMarket;
      }
    }
    if (lowerText.includes('cabinet') || lowerText.includes('secretary') || lowerText.includes('appointment')) {
      const cabinetMarket = markets.find(m => m.question.toLowerCase().includes('trump') && (m.question.toLowerCase().includes('cabinet') || m.question.toLowerCase().includes('secretary')));
      if (cabinetMarket) {
        console.log(`Trump cabinet match: ${cabinetMarket.question}`);
        return cabinetMarket;
      }
    }
    // General Trump market
    const trumpMarket = markets.find(m => m.question.toLowerCase().includes('trump'));
    if (trumpMarket) {
      console.log(`Trump match: ${trumpMarket.question}`);
      return trumpMarket;
    }
  }

  // === POLITICAL MATCHING ===
  const politicalKeywords = ['election', 'president', 'vote', 'democrat', 'republican', 'nominee', 'candidate', '2028', '2024', 'congress', 'senate'];
  const hasPoliticalContext = politicalKeywords.filter(kw => lowerText.includes(kw)).length >= 1;
  
  if (hasPoliticalContext) {
    const politicalMarket = markets.find(m => {
      const q = m.question.toLowerCase();
      return (q.includes('election') || q.includes('president') || q.includes('nominee') || q.includes('congress') || q.includes('senate'));
    });
    if (politicalMarket) {
      console.log(`Political match: ${politicalMarket.question}`);
      return politicalMarket;
    }
  }

  // === FED/ECONOMY MATCHING ===
  const fedKeywords = ['fed', 'federal reserve', 'interest rate', 'rate cut', 'rate hike', 'fomc', 'powell', 'recession', 'inflation'];
  const hasFedContext = fedKeywords.some(kw => lowerText.includes(kw));
  
  if (hasFedContext) {
    // Specific rate cut/hike matching
    if (lowerText.includes('cut') || lowerText.includes('hike')) {
      const rateMarket = markets.find(m => {
        const q = m.question.toLowerCase();
        return (q.includes('fed') && q.includes('rate')) || q.includes('rate cut') || q.includes('rate hike');
      });
      if (rateMarket) {
        console.log(`Fed rate match: ${rateMarket.question}`);
        return rateMarket;
      }
    }
    // General fed/economy market
    const fedMarket = markets.find(m => {
      const q = m.question.toLowerCase();
      return q.includes('fed') || q.includes('recession') || q.includes('inflation');
    });
    if (fedMarket) {
      console.log(`Fed/Economy match: ${fedMarket.question}`);
      return fedMarket;
    }
  }
  
  // === AI/TECH MATCHING ===
  const aiKeywords = ['ai', 'artificial intelligence', 'openai', 'chatgpt', 'gpt', 'claude', 'gemini', 'llm'];
  const hasAIContext = aiKeywords.some(kw => lowerText.includes(kw));
  
  if (hasAIContext) {
    const aiMarket = markets.find(m => {
      const q = m.question.toLowerCase();
      return q.includes('ai') || q.includes('artificial intelligence') || q.includes('openai');
    });
    if (aiMarket) {
      console.log(`AI/Tech match: ${aiMarket.question}`);
      return aiMarket;
    }
  }
  
  // === CEO/COMPANY MATCHING ===
  const ceoKeywords = ['ceo', 'fired', 'resign', 'step down', 'leadership'];
  const hasCEOContext = ceoKeywords.some(kw => lowerText.includes(kw));
  
  if (hasCEOContext) {
    const ceoMarket = markets.find(m => m.question.toLowerCase().includes('ceo'));
    if (ceoMarket) {
      console.log(`CEO match: ${ceoMarket.question}`);
      return ceoMarket;
    }
  }

  // === SPORTS MATCHING (VERY strict) ===
  // Only match if tweet EXPLICITLY mentions BOTH teams in a vs market
  for (const market of markets) {
    const marketQuestion = market.question.toLowerCase();
    
    // Only check "vs" markets
    if (!marketQuestion.includes(' vs ') && !marketQuestion.includes(' vs. ')) {
      continue;
    }
    
    const parts = marketQuestion.split(/\s+vs\.?\s+/);
    if (parts.length !== 2) continue;
    
    // Extract team names (words longer than 3 chars)
    const team1Words = parts[0].split(/\s+/).filter(w => w.length > 4);
    const team2Words = parts[1].split(/\s+/).filter(w => w.length > 4);
    
    // Helper to escape regex special characters
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // BOTH teams must be mentioned in the tweet
    const team1Match = team1Words.some(w => {
      try {
        const regex = new RegExp(`\\b${escapeRegex(w)}\\b`, 'i');
        return regex.test(lowerText);
      } catch { return false; }
    });
    const team2Match = team2Words.some(w => {
      try {
        const regex = new RegExp(`\\b${escapeRegex(w)}\\b`, 'i');
        return regex.test(lowerText);
      } catch { return false; }
    });
    
    if (team1Match && team2Match) {
      console.log(`Sports match (both teams): ${market.question}`);
      return market;
    }
  }

  // === SUPER BOWL / MAJOR EVENTS (strict) ===
  if (lowerText.includes('super bowl') || lowerText.includes('superbowl')) {
    const sbMarket = markets.find(m => m.question.toLowerCase().includes('super bowl'));
    if (sbMarket) {
      console.log(`Super Bowl match: ${sbMarket.question}`);
      return sbMarket;
    }
  }

  // === COLLEGE FOOTBALL CONFERENCES ===
  // Normalize text: "big12" -> "big 12", etc.
  const normalizedText = lowerText
    .replace(/big12/g, 'big 12')
    .replace(/big10/g, 'big 10')
    .replace(/sec\b/g, 'sec ')
    .replace(/acc\b/g, 'acc ');
  
  // Conference mappings
  const conferenceKeywords: Record<string, string[]> = {
    'big 12': ['big 12', 'big12', 'byu', 'tcu', 'texas tech', 'ttu', 'oklahoma state', 'kansas state', 'iowa state', 'cincinnati', 'ucf', 'houston'],
    'sec': ['sec', 'alabama', 'georgia', 'lsu', 'tennessee', 'texas', 'oklahoma', 'florida', 'auburn', 'ole miss'],
    'big 10': ['big 10', 'big10', 'ohio state', 'michigan', 'penn state', 'wisconsin', 'iowa', 'oregon', 'usc'],
    'acc': ['acc', 'clemson', 'florida state', 'miami', 'nc state', 'duke', 'louisville', 'virginia tech'],
  };
  
  // Check if tweet is about college football championship
  const cfbKeywords = ['championship', 'title', 'title game', 'playoff', 'cfp', 'ranked', 'top 10', 'top 12', 'make the playoff'];
  const hasCFBContext = cfbKeywords.some(kw => normalizedText.includes(kw));
  
  if (hasCFBContext) {
    for (const [conference, teams] of Object.entries(conferenceKeywords)) {
      const mentionsConference = teams.some(team => normalizedText.includes(team));
      if (mentionsConference) {
        // Find the conference championship market
        const confMarket = markets.find(m => {
          const q = m.question.toLowerCase();
          return q.includes(conference) && (q.includes('championship') || q.includes('winner'));
        });
        if (confMarket) {
          console.log(`College Football Conference match: ${confMarket.question}`);
          return confMarket;
        }
        // Or match to College Football Champion if discussing playoffs
        if (normalizedText.includes('playoff') || normalizedText.includes('cfp')) {
          const cfpMarket = markets.find(m => m.question.toLowerCase().includes('college football champion'));
          if (cfpMarket) {
            console.log(`College Football Playoff match: ${cfpMarket.question}`);
            return cfpMarket;
          }
        }
      }
    }
  }

  // === NFL CONFERENCES ===
  const nfcTeams = ['eagles', 'cowboys', 'commanders', '49ers', 'seahawks', 'rams', 'cardinals', 'packers', 'bears', 'lions', 'vikings', 'saints', 'falcons', 'panthers', 'buccaneers'];
  const afcTeams = ['chiefs', 'bills', 'dolphins', 'jets', 'patriots', 'ravens', 'bengals', 'steelers', 'browns', 'texans', 'colts', 'jaguars', 'titans', 'broncos', 'raiders', 'chargers'];
  
  if (lowerText.includes('nfc') || nfcTeams.some(t => lowerText.includes(t))) {
    if (lowerText.includes('champion') || lowerText.includes('super bowl') || lowerText.includes('playoff')) {
      const nfcMarket = markets.find(m => m.question.toLowerCase().includes('nfc champion'));
      if (nfcMarket) {
        console.log(`NFC Championship match: ${nfcMarket.question}`);
        return nfcMarket;
      }
    }
  }
  
  if (lowerText.includes('afc') || afcTeams.some(t => lowerText.includes(t))) {
    if (lowerText.includes('champion') || lowerText.includes('super bowl') || lowerText.includes('playoff')) {
      const afcMarket = markets.find(m => m.question.toLowerCase().includes('afc champion'));
      if (afcMarket) {
        console.log(`AFC Championship match: ${afcMarket.question}`);
        return afcMarket;
      }
    }
  }

  // === PREMIER LEAGUE / CHAMPIONS LEAGUE ===
  const plTeams = ['arsenal', 'manchester city', 'man city', 'liverpool', 'chelsea', 'tottenham', 'spurs', 'manchester united', 'man united'];
  if (plTeams.some(t => lowerText.includes(t)) && (lowerText.includes('title') || lowerText.includes('champion') || lowerText.includes('league'))) {
    const plMarket = markets.find(m => m.question.toLowerCase().includes('premier league'));
    if (plMarket) {
      console.log(`Premier League match: ${plMarket.question}`);
      return plMarket;
    }
  }

  // === NO MATCH - be conservative ===
  // Don't match random tweets to random markets
  console.log(`No confident match found for: "${lowerText.substring(0, 50)}..."`);
  return null;
}


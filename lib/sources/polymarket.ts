import { fetchJson } from "./util";

/**
 * Prediction-market probabilities from the public Polymarket Gamma API.
 * We pull the most liquid open markets and keyword-match the three macro
 * questions the dashboard tracks. When nothing matches (or the request
 * fails) representative probabilities are used.
 */
export interface PolymarketData {
  bojHikeProbability: number;
  usdjpy160Probability: number;
  cpiAbove2Probability: number;
  live: boolean;
}

const FALLBACK: PolymarketData = {
  bojHikeProbability: 0.58,
  usdjpy160Probability: 0.27,
  cpiAbove2Probability: 0.62,
  live: false,
};

interface GammaMarket {
  question?: string;
  outcomes?: string;
  outcomePrices?: string;
}

function yesProbability(market: GammaMarket): number | null {
  try {
    const outcomes = JSON.parse(market.outcomes ?? "[]") as string[];
    const prices = JSON.parse(market.outcomePrices ?? "[]") as string[];
    const yesIndex = outcomes.findIndex((o) => o.toLowerCase() === "yes");
    const idx = yesIndex >= 0 ? yesIndex : 0;
    const p = Number.parseFloat(prices[idx] ?? "");
    return Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : null;
  } catch {
    return null;
  }
}

function matchProbability(
  markets: GammaMarket[],
  keywords: string[],
): number | null {
  for (const market of markets) {
    const q = (market.question ?? "").toLowerCase();
    if (keywords.every((kw) => q.includes(kw))) {
      const p = yesProbability(market);
      if (p !== null) return p;
    }
  }
  return null;
}

export async function getPolymarketData(): Promise<PolymarketData> {
  try {
    const markets = await fetchJson<GammaMarket[]>(
      "https://gamma-api.polymarket.com/markets?closed=false&limit=400&order=volumeNum&ascending=false",
    );
    const list = Array.isArray(markets) ? markets : [];
    const bojHike =
      matchProbability(list, ["bank of japan", "hike"]) ??
      matchProbability(list, ["boj", "rate"]);
    const usdjpy160 =
      matchProbability(list, ["usd/jpy", "160"]) ??
      matchProbability(list, ["yen", "160"]);
    const cpiAbove2 =
      matchProbability(list, ["japan", "inflation"]) ??
      matchProbability(list, ["japan", "cpi"]);

    const live = bojHike !== null || usdjpy160 !== null || cpiAbove2 !== null;
    return {
      bojHikeProbability: bojHike ?? FALLBACK.bojHikeProbability,
      usdjpy160Probability: usdjpy160 ?? FALLBACK.usdjpy160Probability,
      cpiAbove2Probability: cpiAbove2 ?? FALLBACK.cpiAbove2Probability,
      live,
    };
  } catch {
    return FALLBACK;
  }
}

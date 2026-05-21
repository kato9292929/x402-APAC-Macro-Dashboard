import { fetchJson, toNumber } from "./util";

/**
 * Onchain smart-money signal from the Nansen API: net stablecoin flow into
 * APAC-associated wallets, DeFi TVL momentum (a risk-on / risk-off proxy)
 * and the directional smart-money exposure read. Falls back to a curated
 * representative dataset when NANSEN_API_KEY is absent or the call fails.
 */
export type RiskSentiment = "RISK_ON" | "NEUTRAL" | "RISK_OFF";

export interface NansenData {
  stablecoinNetFlowUsdM: number;
  defiTvlChangePct: number;
  smartMoneyApacExposureChange: number;
  riskSentiment: RiskSentiment;
  live: boolean;
}

const FALLBACK: NansenData = {
  stablecoinNetFlowUsdM: 218,
  defiTvlChangePct: 3.4,
  smartMoneyApacExposureChange: 6.5,
  riskSentiment: "RISK_ON",
  live: false,
};

function classifySentiment(tvlChange: number, netFlow: number): RiskSentiment {
  const score = tvlChange + netFlow / 200;
  if (score >= 2.5) return "RISK_ON";
  if (score <= -2.5) return "RISK_OFF";
  return "NEUTRAL";
}

export async function getNansenData(): Promise<NansenData> {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    return FALLBACK;
  }
  try {
    const raw = await fetchJson<Record<string, unknown>>(
      "https://api.nansen.ai/v1/smart-money/apac-macro",
      { headers: { apiKey } },
    );
    const stablecoinNetFlowUsdM = toNumber(
      raw.stablecoinNetFlowUsdM,
      FALLBACK.stablecoinNetFlowUsdM,
    );
    const defiTvlChangePct = toNumber(raw.defiTvlChangePct, FALLBACK.defiTvlChangePct);
    const smartMoneyApacExposureChange = toNumber(
      raw.smartMoneyApacExposureChange,
      FALLBACK.smartMoneyApacExposureChange,
    );
    return {
      stablecoinNetFlowUsdM,
      defiTvlChangePct,
      smartMoneyApacExposureChange,
      riskSentiment: classifySentiment(defiTvlChangePct, stablecoinNetFlowUsdM),
      live: true,
    };
  } catch {
    return FALLBACK;
  }
}

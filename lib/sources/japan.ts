import { fetchJson, toNumber } from "./util";

/**
 * Macro inputs sourced from the Japan Data API: Bank of Japan policy rate and
 * the JGB yield curve, APAC currency crosses, and the Japanese real-estate
 * price feed. When JAPAN_DATA_API_URL is not configured (or the request
 * fails) the dashboard falls back to a curated representative dataset so the
 * UI and the x402-gated endpoints always return a coherent snapshot.
 */
export interface JapanData {
  policyRate: number;
  jgb10y: number;
  jgb2y: number;
  usPolicyRate: number;
  us10y: number;
  usdjpy: number;
  usdsgd: number;
  usdkrw: number;
  audusd: number;
  tokyoPriceIndexYoY: number;
  osakaPriceIndexYoY: number;
  fukuokaPriceIndexYoY: number;
  realEstate3mPct: number;
  realEstate12mPct: number;
  rentalYield: number;
  transactionVolumeChange: number;
  cpi: number;
  coreCpi: number;
  ppi: number;
  importPrices: number;
  live: boolean;
}

const FALLBACK: JapanData = {
  policyRate: 0.5,
  jgb10y: 1.58,
  jgb2y: 0.72,
  usPolicyRate: 4.5,
  us10y: 4.25,
  usdjpy: 152.3,
  usdsgd: 1.335,
  usdkrw: 1372,
  audusd: 0.648,
  tokyoPriceIndexYoY: 8.7,
  osakaPriceIndexYoY: 5.4,
  fukuokaPriceIndexYoY: 6.1,
  realEstate3mPct: 1.8,
  realEstate12mPct: 8.7,
  rentalYield: 3.6,
  transactionVolumeChange: 4.2,
  cpi: 2.1,
  coreCpi: 2.0,
  ppi: 1.8,
  importPrices: 0.9,
  live: false,
};

export async function getJapanData(): Promise<JapanData> {
  const base = process.env.JAPAN_DATA_API_URL;
  if (!base) {
    return FALLBACK;
  }
  try {
    const raw = await fetchJson<Record<string, unknown>>(
      `${base.replace(/\/$/, "")}/macro/apac`,
    );
    return {
      policyRate: toNumber(raw.policyRate, FALLBACK.policyRate),
      jgb10y: toNumber(raw.jgb10y, FALLBACK.jgb10y),
      jgb2y: toNumber(raw.jgb2y, FALLBACK.jgb2y),
      usPolicyRate: toNumber(raw.usPolicyRate, FALLBACK.usPolicyRate),
      us10y: toNumber(raw.us10y, FALLBACK.us10y),
      usdjpy: toNumber(raw.usdjpy, FALLBACK.usdjpy),
      usdsgd: toNumber(raw.usdsgd, FALLBACK.usdsgd),
      usdkrw: toNumber(raw.usdkrw, FALLBACK.usdkrw),
      audusd: toNumber(raw.audusd, FALLBACK.audusd),
      tokyoPriceIndexYoY: toNumber(raw.tokyoPriceIndexYoY, FALLBACK.tokyoPriceIndexYoY),
      osakaPriceIndexYoY: toNumber(raw.osakaPriceIndexYoY, FALLBACK.osakaPriceIndexYoY),
      fukuokaPriceIndexYoY: toNumber(raw.fukuokaPriceIndexYoY, FALLBACK.fukuokaPriceIndexYoY),
      realEstate3mPct: toNumber(raw.realEstate3mPct, FALLBACK.realEstate3mPct),
      realEstate12mPct: toNumber(raw.realEstate12mPct, FALLBACK.realEstate12mPct),
      rentalYield: toNumber(raw.rentalYield, FALLBACK.rentalYield),
      transactionVolumeChange: toNumber(
        raw.transactionVolumeChange,
        FALLBACK.transactionVolumeChange,
      ),
      cpi: toNumber(raw.cpi, FALLBACK.cpi),
      coreCpi: toNumber(raw.coreCpi, FALLBACK.coreCpi),
      ppi: toNumber(raw.ppi, FALLBACK.ppi),
      importPrices: toNumber(raw.importPrices, FALLBACK.importPrices),
      live: true,
    };
  } catch {
    return FALLBACK;
  }
}

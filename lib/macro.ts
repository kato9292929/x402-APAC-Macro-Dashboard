import type {
  DataMode,
  MacroSnapshot,
  PanelData,
  PanelKey,
  PanelSummary,
  Regime,
} from "./types";
import { getJapanData, type JapanData } from "./sources/japan";
import { getEstatData } from "./sources/estat";
import { getPolymarketData, type PolymarketData } from "./sources/polymarket";
import { getNansenData, type NansenData } from "./sources/nansen";

const REFRESH_TTL_MS = 30 * 60 * 1000;

let cache: { snapshot: MacroSnapshot; builtAt: number } | null = null;

const clamp = (n: number, lo = -2, hi = 2): number =>
  Math.max(lo, Math.min(hi, n));

const round1 = (n: number): number => Math.round(n * 10) / 10;

const round2 = (n: number): number => Math.round(n * 100) / 100;

const signed = (n: number, digits = 1): string =>
  `${n >= 0 ? "+" : ""}${n.toFixed(digits)}`;

function panelScore(parts: number[]): number {
  const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
  return round1(clamp(avg));
}

function buildRatesPanel(jp: JapanData, pm: PolymarketData): PanelData {
  const expectedInflation = jp.coreCpi + 0.3;
  const realRate = round1(jp.jgb10y - expectedInflation);
  const yieldSpread = round2(jp.jgb10y - jp.jgb2y);

  const realRateScore = clamp(-realRate * 0.6);
  const spreadScore = clamp(yieldSpread * 1.1);
  const policyScore = clamp((pm.bojHikeProbability - 0.5) * 4);
  const score = panelScore([realRateScore, spreadScore, policyScore]);

  const trend =
    pm.bojHikeProbability > 0.55
      ? "TIGHTENING"
      : pm.bojHikeProbability < 0.4
        ? "EASING"
        : "NEUTRAL";

  return {
    key: "rates",
    title: "Interest Rates",
    titleJa: "金利・金融政策",
    score,
    trend,
    keyMetric: `実質金利: ${realRate.toFixed(1)}%`,
    metrics: [
      {
        label: "実質金利（名目 - 期待インフレ）",
        value: `${realRate.toFixed(1)}%`,
        score: round1(realRateScore),
      },
      {
        label: "利回りスプレッド（10年 - 2年）",
        value: `${yieldSpread.toFixed(2)}%`,
        score: round1(spreadScore),
      },
      {
        label: "政策期待パス（Polymarket 利上げ確率）",
        value: `${Math.round(pm.bojHikeProbability * 100)}%`,
        score: round1(policyScore),
      },
    ],
    dataPoints: [
      { label: "日銀政策金利", value: `${jp.policyRate.toFixed(2)}%` },
      { label: "JGB 10年利回り", value: `${jp.jgb10y.toFixed(2)}%` },
      { label: "JGB 2年利回り", value: `${jp.jgb2y.toFixed(2)}%` },
      {
        label: "日銀利上げ確率（2026年内）",
        value: `${Math.round(pm.bojHikeProbability * 100)}%`,
      },
    ],
    sources: ["Japan Data API", "e-Stat", "Polymarket"],
    commentary:
      `実質金利は${realRate.toFixed(1)}%で${realRate < 0 ? "依然マイナス圏" : "プラス転換"}。` +
      `イールドカーブは${yieldSpread > 0 ? "スティープ化" : "フラット化"}し、` +
      `Polymarketの利上げ確率${Math.round(pm.bojHikeProbability * 100)}%が政策正常化を織り込む。`,
    price: "$0.20",
  };
}

function buildFxPanel(jp: JapanData, pm: PolymarketData, ns: NansenData): PanelData {
  const rateDiff = round2(jp.us10y - jp.jgb10y);

  const rateDiffScore = clamp(-(rateDiff - 2.0) * 0.6);
  const flowScore = clamp(ns.stablecoinNetFlowUsdM / 300);
  const fxProbScore = clamp(-(pm.usdjpy160Probability - 0.25) * 6);
  const score = panelScore([rateDiffScore, flowScore, fxProbScore]);

  const trend =
    jp.usdjpy >= 150
      ? "YEN_WEAKNESS"
      : jp.usdjpy <= 140
        ? "YEN_STRENGTH"
        : "STABLE";

  return {
    key: "fx",
    title: "Currency",
    titleJa: "為替",
    score,
    trend,
    keyMetric: `USD/JPY: ${jp.usdjpy.toFixed(1)}`,
    metrics: [
      {
        label: "金利差（日米10年スプレッド）",
        value: `${rateDiff.toFixed(2)}%`,
        score: round1(rateDiffScore),
      },
      {
        label: "ステーブルコインネットフロー（APACウォレット）",
        value: `${signed(ns.stablecoinNetFlowUsdM, 0)}M USD`,
        score: round1(flowScore),
      },
      {
        label: "Polymarket為替確率（USD/JPY > 160）",
        value: `${Math.round(pm.usdjpy160Probability * 100)}%`,
        score: round1(fxProbScore),
      },
    ],
    dataPoints: [
      { label: "USD/JPY", value: jp.usdjpy.toFixed(1) },
      { label: "USD/SGD", value: jp.usdsgd.toFixed(3) },
      { label: "USD/KRW", value: jp.usdkrw.toFixed(0) },
      { label: "AUD/USD", value: jp.audusd.toFixed(3) },
    ],
    sources: ["Japan Data API", "Nansen API", "Polymarket"],
    commentary:
      `日米金利差${rateDiff.toFixed(2)}%が円${jp.usdjpy >= 150 ? "安" : "高"}圧力の主因。` +
      `APACウォレットのステーブルコインフローは${signed(ns.stablecoinNetFlowUsdM, 0)}M USDで、` +
      `オンチェーン資金は${ns.stablecoinNetFlowUsdM >= 0 ? "流入" : "流出"}基調。`,
    price: "$0.20",
  };
}

function buildRealEstatePanel(jp: JapanData): PanelData {
  const rentYieldSpread = round2(jp.rentalYield - jp.jgb10y);

  const priceScore = clamp(jp.realEstate12mPct / 8);
  const yieldSpreadScore = clamp(rentYieldSpread * 0.45);
  const volumeScore = clamp(jp.transactionVolumeChange / 12);
  const score = panelScore([priceScore, yieldSpreadScore, volumeScore]);

  const trend =
    jp.realEstate12mPct >= 6
      ? "RISING"
      : jp.realEstate12mPct <= 0
        ? "COOLING"
        : "STABLE";

  return {
    key: "realestate",
    title: "Real Estate",
    titleJa: "不動産",
    score,
    trend,
    keyMetric: `東京: ${signed(jp.tokyoPriceIndexYoY)}% YoY`,
    metrics: [
      {
        label: "価格変動率（3ヶ月 / 12ヶ月）",
        value: `${signed(jp.realEstate3mPct)}% / ${signed(jp.realEstate12mPct)}%`,
        score: round1(priceScore),
      },
      {
        label: "賃料利回り vs 国債利回りスプレッド",
        value: `${rentYieldSpread.toFixed(2)}%`,
        score: round1(yieldSpreadScore),
      },
      {
        label: "取引量変化（前年比）",
        value: `${signed(jp.transactionVolumeChange)}%`,
        score: round1(volumeScore),
      },
    ],
    dataPoints: [
      { label: "東京 価格指数 YoY", value: `${signed(jp.tokyoPriceIndexYoY)}%` },
      { label: "大阪 価格指数 YoY", value: `${signed(jp.osakaPriceIndexYoY)}%` },
      { label: "福岡 価格指数 YoY", value: `${signed(jp.fukuokaPriceIndexYoY)}%` },
      { label: "平均賃料利回り", value: `${jp.rentalYield.toFixed(2)}%` },
    ],
    sources: ["Japan Data API", "x402 Oracle (APAC不動産)", "国土交通省API"],
    commentary:
      `東京は前年比${signed(jp.tokyoPriceIndexYoY)}%と底堅く、賃料利回りは国債を` +
      `${rentYieldSpread.toFixed(2)}%上回る。取引量は${signed(jp.transactionVolumeChange)}%で` +
      `${jp.transactionVolumeChange >= 0 ? "需要が継続" : "減速の兆し"}。`,
    price: "$0.20",
  };
}

function buildInflationPanel(
  jp: JapanData,
  pm: PolymarketData,
  ns: NansenData,
): PanelData {
  const coreScore = clamp(-(jp.coreCpi - 2.0) * 1.5);
  const expScore = clamp(-(pm.cpiAbove2Probability - 0.5) * 3);
  const sentimentBase =
    ns.riskSentiment === "RISK_ON"
      ? 0.8
      : ns.riskSentiment === "RISK_OFF"
        ? -0.8
        : 0;
  const onchainScore = clamp(sentimentBase + ns.defiTvlChangePct / 15);
  const score = panelScore([coreScore, expScore, onchainScore]);

  const trend =
    jp.cpi > 2.3 ? "RISING" : jp.cpi < 1.5 ? "BELOW_TARGET" : "MODERATING";

  const sentimentJa: Record<NansenData["riskSentiment"], string> = {
    RISK_ON: "リスクオン",
    NEUTRAL: "中立",
    RISK_OFF: "リスクオフ",
  };

  return {
    key: "inflation",
    title: "Inflation & Macro",
    titleJa: "インフレ・マクロ",
    score,
    trend,
    keyMetric: `CPI: ${jp.cpi.toFixed(1)}%`,
    metrics: [
      {
        label: "コアインフレ（コアCPI）",
        value: `${jp.coreCpi.toFixed(1)}%`,
        score: round1(coreScore),
      },
      {
        label: "期待インフレ（Polymarket: CPI > 2%）",
        value: `${Math.round(pm.cpiAbove2Probability * 100)}%`,
        score: round1(expScore),
      },
      {
        label: "オンチェーンリスクセンチメント（Nansen）",
        value: `${sentimentJa[ns.riskSentiment]} / TVL ${signed(ns.defiTvlChangePct)}%`,
        score: round1(onchainScore),
      },
    ],
    dataPoints: [
      { label: "総合CPI", value: `${jp.cpi.toFixed(1)}%` },
      { label: "コアCPI", value: `${jp.coreCpi.toFixed(1)}%` },
      { label: "PPI（企業物価）", value: `${jp.ppi.toFixed(1)}%` },
      { label: "輸入物価指数", value: `${signed(jp.importPrices)}%` },
    ],
    sources: ["Japan Data API", "e-Stat", "Nansen API", "Polymarket"],
    commentary:
      `コアCPIは${jp.coreCpi.toFixed(1)}%で日銀目標近辺。Polymarketの「CPI>2%」確率は` +
      `${Math.round(pm.cpiAbove2Probability * 100)}%。Nansenのオンチェーン指標は` +
      `${sentimentJa[ns.riskSentiment]}で、DeFi TVLは${signed(ns.defiTvlChangePct)}%。`,
    price: "$0.20",
  };
}

function regimeFor(score: number): Regime {
  if (score >= 0.5) return "RISK_ON";
  if (score <= -0.5) return "RISK_OFF";
  return "RISK_NEUTRAL";
}

function summarize(panel: PanelData): PanelSummary {
  return { score: panel.score, trend: panel.trend, keyMetric: panel.keyMetric };
}

function onchainSignalText(ns: NansenData): string {
  const direction =
    ns.smartMoneyApacExposureChange > 0
      ? "増加"
      : ns.smartMoneyApacExposureChange < 0
        ? "縮小"
        : "横ばい";
  return (
    `スマートマネーのAPACエクスポージャーは${signed(ns.smartMoneyApacExposureChange)}%で${direction}中。` +
    `ステーブルコインネットフロー ${signed(ns.stablecoinNetFlowUsdM, 0)}M USD、DeFi TVL ${signed(ns.defiTvlChangePct)}%。`
  );
}

async function buildSnapshot(): Promise<MacroSnapshot> {
  const [jp, estat, pm, ns] = await Promise.all([
    getJapanData(),
    getEstatData(),
    getPolymarketData(),
    getNansenData(),
  ]);

  if (estat.live) {
    if (estat.cpi !== null) jp.cpi = estat.cpi;
    if (estat.coreCpi !== null) jp.coreCpi = estat.coreCpi;
    if (estat.ppi !== null) jp.ppi = estat.ppi;
  }

  const rates = buildRatesPanel(jp, pm);
  const fx = buildFxPanel(jp, pm, ns);
  const realestate = buildRealEstatePanel(jp);
  const inflation = buildInflationPanel(jp, pm, ns);

  const overallScore = round1(
    (rates.score + fx.score + realestate.score + inflation.score) / 4,
  );

  const liveFlags = [jp.live, estat.live, pm.live, ns.live];
  const liveCount = liveFlags.filter(Boolean).length;
  const dataMode: DataMode =
    liveCount === liveFlags.length
      ? "live"
      : liveCount === 0
        ? "fallback"
        : "partial";

  const panelDetails: Record<PanelKey, PanelData> = {
    rates,
    fx,
    realestate,
    inflation,
  };

  return {
    updatedAt: new Date().toISOString(),
    overallScore,
    regime: regimeFor(overallScore),
    onchainSignal: onchainSignalText(ns),
    dataMode,
    panels: {
      rates: summarize(rates),
      fx: summarize(fx),
      realestate: summarize(realestate),
      inflation: summarize(inflation),
    },
    panelDetails,
  };
}

/**
 * Returns the current macro snapshot, refreshing the underlying data sources
 * at most once every 30 minutes (real-time cadence requirement).
 */
export async function getSnapshot(): Promise<MacroSnapshot> {
  if (cache && Date.now() - cache.builtAt < REFRESH_TTL_MS) {
    return cache.snapshot;
  }
  const snapshot = await buildSnapshot();
  cache = { snapshot, builtAt: Date.now() };
  return snapshot;
}

export const PANEL_KEYS: PanelKey[] = ["rates", "fx", "realestate", "inflation"];

export function isPanelKey(value: unknown): value is PanelKey {
  return (
    typeof value === "string" && (PANEL_KEYS as string[]).includes(value)
  );
}

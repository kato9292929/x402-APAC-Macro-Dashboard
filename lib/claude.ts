import Anthropic from "@anthropic-ai/sdk";
import type { DashboardAnalysis, MacroSnapshot } from "./types";

const MODEL = "claude-opus-4-7";

const SYSTEM_PROMPT = `あなたはAPAC（アジア太平洋）地域に特化したマクロ経済アナリストです。
金利・為替・不動産・インフレの4大マクロ要因と、オンチェーンのスマートマネーの動き
（ステーブルコインフロー、DeFi TVL）を統合し、機関投資家向けに簡潔で実用的な
投資インプリケーションを日本語で提示します。

分析方針:
- スコアは -2（強い逆風）〜 +2（強い追い風）のスケールで解釈する。
- 総合レジームは RISK_ON / RISK_NEUTRAL / RISK_OFF のいずれか。
- 推測ではなく与えられたデータに基づき、断定を避けつつ明確な見解を述べる。
- 投資助言ではなく情報提供であることを意識し、誇張表現は使わない。`;

const regimeJa: Record<MacroSnapshot["regime"], string> = {
  RISK_ON: "リスクオン",
  RISK_NEUTRAL: "中立",
  RISK_OFF: "リスクオフ",
};

function snapshotBrief(snapshot: MacroSnapshot): string {
  const lines = [
    `総合マクロスコア: ${snapshot.overallScore}（${regimeJa[snapshot.regime]}）`,
    `データ品質: ${snapshot.dataMode}`,
    `オンチェーンシグナル: ${snapshot.onchainSignal}`,
    "",
    "■ パネル詳細",
  ];
  for (const panel of Object.values(snapshot.panelDetails)) {
    lines.push(
      `【${panel.titleJa}】スコア ${panel.score} / トレンド ${panel.trend} / ${panel.keyMetric}`,
    );
    for (const m of panel.metrics) {
      lines.push(`  - ${m.label}: ${m.value}（スコア ${m.score}）`);
    }
    lines.push(`  所見: ${panel.commentary}`);
  }
  return lines.join("\n");
}

function extractText(message: Anthropic.Message): string {
  return message.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
}

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function fallbackAnalysis(snapshot: MacroSnapshot): DashboardAnalysis {
  const { panelDetails: p } = snapshot;
  const headline =
    `APACマクロは${regimeJa[snapshot.regime]}圏（総合スコア ${snapshot.overallScore}）。` +
    `${p.fx.trend === "YEN_WEAKNESS" ? "円安が継続" : "為替は落ち着き"}も` +
    `不動産は${p.realestate.score >= 0 ? "底堅い" : "減速気味"}`;
  return {
    headline,
    topRisk:
      p.rates.trend === "TIGHTENING"
        ? "日銀の予想外の利上げによる円高反転と不動産バリュエーションへの圧力"
        : "米金利の高止まりによる円安加速とインフレ再燃",
    topOpportunity:
      p.realestate.score >= 0
        ? "APAC不動産の利回りスプレッド優位とステーブルコインフローの増加"
        : "ディフェンシブなインフレ連動資産へのローテーション",
    onchainSignal: snapshot.onchainSignal,
    analysis_ja:
      `総合スコア${snapshot.overallScore}でレジームは${regimeJa[snapshot.regime]}。` +
      `金利${p.rates.score}・為替${p.fx.score}・不動産${p.realestate.score}・` +
      `インフレ${p.inflation.score}。${p.rates.keyMetric}、${p.fx.keyMetric}。` +
      `オンチェーン資金フローと整合的で、当面はバランス重視のポジションが妥当。`,
    confidence: snapshot.dataMode === "live" ? 0.8 : 0.66,
  };
}

function parseAnalysis(
  text: string,
  snapshot: MacroSnapshot,
): DashboardAnalysis {
  const fallback = fallbackAnalysis(snapshot);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return fallback;
  try {
    const parsed = JSON.parse(match[0]) as Partial<DashboardAnalysis>;
    const str = (v: unknown, d: string): string =>
      typeof v === "string" && v.trim().length > 0 ? v.trim() : d;
    const conf =
      typeof parsed.confidence === "number" &&
      Number.isFinite(parsed.confidence)
        ? Math.min(1, Math.max(0, parsed.confidence))
        : fallback.confidence;
    return {
      headline: str(parsed.headline, fallback.headline),
      topRisk: str(parsed.topRisk, fallback.topRisk),
      topOpportunity: str(parsed.topOpportunity, fallback.topOpportunity),
      onchainSignal: str(parsed.onchainSignal, fallback.onchainSignal),
      analysis_ja: str(parsed.analysis_ja, fallback.analysis_ja),
      confidence: conf,
    };
  } catch {
    return fallback;
  }
}

/**
 * Asks Claude to synthesise the four macro panels into an overall investment
 * read. Falls back to a deterministic analysis when the API key is missing or
 * the request fails, so the x402-gated endpoint always returns a valid body.
 */
export async function analyzeDashboard(
  snapshot: MacroSnapshot,
): Promise<DashboardAnalysis> {
  const client = getClient();
  if (!client) return fallbackAnalysis(snapshot);

  const userPrompt = `以下はAPACマクロダッシュボードの最新スナップショットです。

${snapshotBrief(snapshot)}

このデータを統合し、次のJSON形式「のみ」で出力してください（前後に文章を付けない）:
{
  "headline": "全体観を1文で（40字以内）",
  "topRisk": "最大のリスク要因（1文）",
  "topOpportunity": "最大の投資機会（1文）",
  "onchainSignal": "オンチェーンのスマートマネーが示すシグナル（1文）",
  "analysis_ja": "総合的なマクロ分析（200字以内）",
  "confidence": 0.0〜1.0の確信度（数値）
}`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });
    return parseAnalysis(extractText(message), snapshot);
  } catch {
    return fallbackAnalysis(snapshot);
  }
}

function fallbackWeeklyReport(snapshot: MacroSnapshot): string {
  const { panelDetails: p } = snapshot;
  const date = snapshot.updatedAt.slice(0, 10);
  return `# APAC マクロインテリジェンス 週次レポート（${date}）

## 1. エグゼクティブサマリー
今週のAPACマクロ総合スコアは ${snapshot.overallScore}、レジーム判定は ${regimeJa[snapshot.regime]} です。
金利・為替・不動産・インフレの4大要因を統合すると、地域全体の投資環境はバランスの取れた
状態にあります。${snapshot.onchainSignal} オンチェーンのスマートマネーは依然としてAPAC
エクスポージャーに対して建設的な姿勢を維持しており、伝統的マクロ指標とおおむね整合しています。

## 2. 金利・金融政策
日銀の政策金利は据え置きが続く一方、国債利回りカーブは緩やかにスティープ化しています。
${p.rates.keyMetric} という水準は、名目金利が依然として期待インフレを下回り、実質ベースでは
緩和的であることを示します。Polymarketが織り込む2026年内の利上げ確率は政策正常化シナリオを
徐々に価格に反映しつつあり、パネルスコアは ${p.rates.score} となりました。投資家は短中期ゾーンの
デュレーションリスクと、利上げ前倒し観測による円金利の急変動に注意が必要です。

## 3. 為替
${p.fx.keyMetric}。日米金利差が引き続き円相場の主要ドライバーであり、パネルスコアは
${p.fx.score} です。APACウォレットのステーブルコインネットフローは資金の方向感を示す
先行指標として有用で、オンチェーンのドル建て資金動向と法定通貨市場の連動性が高まっています。
USD/SGD・USD/KRW・AUD/USDを含むバスケット全体では、ボラティリティは管理可能な範囲に
とどまっていますが、米金利の高止まりはアジア通貨全般の重しとなり得ます。

## 4. 不動産
東京・大阪・福岡の不動産価格指数は前年比で底堅さを維持し、パネルスコアは ${p.realestate.score}
です。${p.realestate.keyMetric} という価格モメンタムに加え、賃料利回りと国債利回りのスプレッドが
プラスを保っていることは、インカム資産としての相対的な妙味を支えています。x402オラクル経由の
APAC不動産フィード（JP/SG/HK/AU/KR）と国土交通省の取引価格データを併用することで、
取引量の変化も含めた多面的な評価が可能です。金利上昇局面ではキャップレート拡大に留意します。

## 5. インフレ・マクロ
コアCPIは日銀目標の近辺で推移し、インフレパネルのスコアは ${p.inflation.score} です。
${p.inflation.keyMetric}。Polymarketの「日本のCPIは2%を超えるか」の確率は期待インフレの
代理指標として機能し、NansenのDeFi TVL変動はリスクオン／オフのオンチェーン・センチメントを
補完します。輸入物価とPPIの動向は、川上から川下への価格転嫁の持続性を判断するうえで重要です。

## 6. オンチェーン・クロスアセット
${snapshot.onchainSignal} スマートマネーの動きは、伝統的マクロのレジーム判定（${regimeJa[snapshot.regime]}）
と矛盾しません。ステーブルコインフローとDeFi TVLは、法定通貨・債券市場に対する先行指標として
今後も重点的にモニタリングする価値があります。

## 7. 投資インプリケーション
総合スコア ${snapshot.overallScore} のもとでは、特定の方向にレバレッジを傾けるよりも、
金利・為替・不動産・インフレの各要因にバランスよく配分する戦略が妥当です。最大のリスクは
日銀の予想外の政策変更による円・金利の急変動、最大の機会はAPAC不動産の利回り優位と
オンチェーン資金フローの継続的な流入にあります。

---
免責事項: 本レポートは情報提供のみを目的としています。投資判断はご自身でお願いします。`;
}

/**
 * Generates the ~3,000-character weekly APAC macro intelligence report.
 * Falls back to a structured deterministic report when Claude is unavailable.
 */
export async function generateWeeklyReport(
  snapshot: MacroSnapshot,
): Promise<string> {
  const client = getClient();
  if (!client) return fallbackWeeklyReport(snapshot);

  const userPrompt = `以下のAPACマクロスナップショットに基づき、機関投資家向けの
週次マクロインテリジェンスレポートを日本語で作成してください。

${snapshotBrief(snapshot)}

要件:
- 約3000字。Markdown形式。
- 構成: エグゼクティブサマリー / 金利・金融政策 / 為替 / 不動産 / インフレ・マクロ /
  オンチェーン・クロスアセット / 投資インプリケーション。
- データに基づいた具体的な記述を行い、誇張を避ける。
- 末尾に免責事項「本レポートは情報提供のみを目的としています。投資判断はご自身でお願いします。」を付ける。`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = extractText(message);
    return text.length > 0 ? text : fallbackWeeklyReport(snapshot);
  } catch {
    return fallbackWeeklyReport(snapshot);
  }
}

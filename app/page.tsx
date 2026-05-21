import { getSnapshot } from "@/lib/macro";
import { Providers } from "./providers";
import { WalletButton } from "@/components/WalletButton";
import { PaymentSelector } from "@/components/PaymentSelector";
import type { PanelData, Regime } from "@/lib/types";

export const dynamic = "force-dynamic";

const REGIME_LABEL: Record<Regime, string> = {
  RISK_ON: "RISK ON",
  RISK_NEUTRAL: "RISK NEUTRAL",
  RISK_OFF: "RISK OFF",
};

const TREND_LABEL: Record<string, string> = {
  TIGHTENING: "金融引き締め",
  EASING: "金融緩和",
  NEUTRAL: "中立",
  YEN_WEAKNESS: "円安",
  YEN_STRENGTH: "円高",
  STABLE: "横ばい",
  RISING: "上昇",
  COOLING: "減速",
  MODERATING: "鈍化",
  BELOW_TARGET: "目標未達",
};

function scoreColor(score: number): string {
  if (score >= 0.5) return "var(--pos)";
  if (score <= -0.5) return "var(--neg)";
  return "var(--neutral)";
}

function trendArrow(trend: string): string {
  if (["TIGHTENING", "RISING", "YEN_WEAKNESS"].includes(trend)) return "▲";
  if (["EASING", "COOLING", "BELOW_TARGET", "YEN_STRENGTH"].includes(trend)) {
    return "▼";
  }
  return "▬";
}

function signedScore(score: number): string {
  return `${score > 0 ? "+" : ""}${score.toFixed(1)}`;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, ((score + 2) / 4) * 100));
  return (
    <div>
      <div className="score-bar">
        <span className="zero" />
        <span
          className="marker"
          style={{ left: `${pct}%`, background: scoreColor(score) }}
        />
      </div>
      <div className="score-bar-legend">
        <span>-2</span>
        <span>0</span>
        <span>+2</span>
      </div>
    </div>
  );
}

function PanelCard({ panel }: { panel: PanelData }) {
  return (
    <article className="panel-card">
      <div className="panel-head">
        <div>
          <div className="panel-title-ja">{panel.titleJa}</div>
          <div className="panel-title-en">{panel.title}</div>
        </div>
        <div className="panel-trend">
          <span className="trend-arrow" style={{ color: scoreColor(panel.score) }}>
            {trendArrow(panel.trend)}
          </span>
          {TREND_LABEL[panel.trend] ?? panel.trend}
        </div>
      </div>

      <div className="panel-score-row">
        <span className="panel-score" style={{ color: scoreColor(panel.score) }}>
          {signedScore(panel.score)}
        </span>
        <span className="panel-keymetric">{panel.keyMetric}</span>
      </div>

      <div className="panel-bar">
        <ScoreBar score={panel.score} />
      </div>

      <div className="metric-list">
        {panel.metrics.map((m) => (
          <div className="metric-row" key={m.label}>
            <span className="metric-label">{m.label}</span>
            <span className="metric-value">{m.value}</span>
            <span
              className="metric-chip"
              style={{
                color: scoreColor(m.score),
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${scoreColor(m.score)}`,
              }}
            >
              {signedScore(m.score)}
            </span>
          </div>
        ))}
      </div>

      <div className="datapoints">
        {panel.dataPoints.map((dp) => (
          <div className="datapoint" key={dp.label}>
            <span className="dp-label">{dp.label}</span>
            <span className="dp-value">{dp.value}</span>
          </div>
        ))}
      </div>

      <div className="panel-foot">
        <span className="sources">出典: {panel.sources.join(" / ")}</span>
        <span className="detail-cta">詳細 {panel.price}</span>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const snapshot = await getSnapshot();
  const panels = Object.values(snapshot.panelDetails);
  const updated = new Date(snapshot.updatedAt);
  const updatedLabel = `${updated.toISOString().slice(0, 16).replace("T", " ")} UTC`;

  return (
    <Providers>
    <div className="page">
      <header className="site-header">
        <div>
          <div className="brand-mark">x402 · APAC MACRO</div>
          <div className="brand-sub">APAC-native macro intelligence, x402-gated</div>
        </div>
        <WalletButton />
      </header>

      <section className="hero">
        <h1>
          APAC MACRO <span className="accent">INTELLIGENCE</span>
        </h1>
        <p>
          金利・為替・不動産・インフレ — APACの4大マクロをリアルタイムで追跡する。
          Japan Data API、Nansenのオンチェーンデータ、Polymarketの予測市場を
          Claudeが統合し、投資インプリケーションを分析します。
        </p>
        <div className="hero-meta">
          <span className="tag">4-Panel Macro Grid</span>
          <span className="tag">Onchain Smart Money</span>
          <span className="tag muted">30分ごと更新</span>
          <span className="tag muted">最終更新 {updatedLabel}</span>
          <span className="tag muted">データ品質: {snapshot.dataMode}</span>
        </div>
      </section>

      <section className="section">
        <div className="section-label">Overall Macro Score</div>
        <div className="overall-card">
          <div className="overall-score">
            <div
              className="value"
              style={{ color: scoreColor(snapshot.overallScore) }}
            >
              {signedScore(snapshot.overallScore)}
            </div>
            <div className="scale">スケール -2 〜 +2</div>
            <div className={`regime-badge regime-${snapshot.regime}`}>
              {REGIME_LABEL[snapshot.regime]}
            </div>
          </div>
          <div className="overall-detail">
            <h2>
              APACマクロは
              {snapshot.regime === "RISK_ON"
                ? "リスクオン圏"
                : snapshot.regime === "RISK_OFF"
                  ? "リスクオフ圏"
                  : "中立圏"}
              。4大マクロ要因を統合スコアリング
            </h2>
            <p className="onchain">
              <strong>オンチェーンシグナル（Nansen）:</strong>{" "}
              {snapshot.onchainSignal}
            </p>
            <div className="overall-bar-wrap">
              <ScoreBar score={snapshot.overallScore} />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-label">Macro Panels — 4 Factor Grid</div>
        <div className="panel-grid">
          {panels.map((panel) => (
            <PanelCard key={panel.key} panel={panel} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-label">Pricing — x402 Micropayments</div>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="price-name">ダッシュボード全体</div>
            <div className="price-value">$0.30</div>
            <div className="price-endpoint">GET /api/macro/dashboard</div>
            <p className="price-desc">
              4パネル全データ + Claudeによる総合マクロスコアと投資インプリケーション分析。
            </p>
          </div>
          <div className="price-card">
            <div className="price-name">パネル詳細</div>
            <div className="price-value">$0.20</div>
            <div className="price-endpoint">POST /api/macro/panel</div>
            <p className="price-desc">
              特定パネル（rates / fx / realestate / inflation）の詳細データと指標スコア。
            </p>
          </div>
          <div className="price-card">
            <div className="price-name">週次レポート</div>
            <div className="price-value">$3.00</div>
            <div className="price-endpoint">GET /api/macro/weekly</div>
            <p className="price-desc">
              週次APACマクロインテリジェンスレポート（約3,000字）をClaudeが生成。
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-label">Payment Methods — Multi-chain</div>
        <p className="pay-intro">
          決済はSolana・Base・Polygon・BNB Chainに対応。デフォルトはSolana（USDC）です。
          チェーンを選択すると、対応トークンと決済エンドポイントが切り替わります。
        </p>
        <PaymentSelector />
      </section>

      <div className="disclaimer">
        免責事項: 本ツールは情報提供のみを目的としています。投資判断はご自身でお願いします。
      </div>

      <footer className="site-footer">
        <span>x402 APAC Macro Intelligence Dashboard</span>
        <span>Multi-chain x402 · Powered by Claude</span>
      </footer>
    </div>
    </Providers>
  );
}

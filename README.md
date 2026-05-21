# x402 APAC Macro Intelligence Dashboard

> 金利・為替・不動産・インフレ — APACの4大マクロをリアルタイムで追跡する x402 ゲート型ダッシュボード。

An APAC-native macroeconomic intelligence dashboard that combines the **Japan Data API**,
**e-Stat**, **Nansen** onchain data and **Polymarket** prediction markets. Claude
synthesises the four macro factors into an overall score and investment implications.
Inspired by vivienna.btc's macro dashboard approach, but APAC-focused and x402-gated.

---

## English

### Concept

The dashboard tracks APAC's four macro factors (interest rates, currency, real estate,
inflation) in real time and combines them with onchain smart-money activity so Claude
can analyse the investment implications. Where vivienna.btc covers the four global
macro factors (US Treasuries, USD, gold, inflation), this is APAC-specific.

### The four macro panels

| Panel | Japanese | Score inputs |
| --- | --- | --- |
| **Interest Rates** | 金利・金融政策 | Real rate (nominal − expected inflation), 10y–2y yield spread, policy-expectation path (Polymarket) |
| **Currency** | 為替 | JP/US rate differential, APAC stablecoin net flow (Nansen), Polymarket FX probability |
| **Real Estate** | 不動産 | Price change (3m / 12m), rental yield vs JGB spread, transaction-volume change |
| **Inflation & Macro** | インフレ・マクロ | Core inflation, expected inflation (Polymarket), onchain risk sentiment (Nansen) |

Each panel is scored on a **−2 … +2** scale. The overall score maps to a regime:
`RISK_ON` / `RISK_NEUTRAL` / `RISK_OFF`. Data refreshes every 30 minutes.

### Data sources

- **Japan Data API** — BoJ policy rate, JGB yield curve, USD/JPY · USD/SGD · USD/KRW · USD/AUD, regional real-estate price indices
- **e-Stat** — Japanese CPI / PPI
- **Polymarket** — prediction-market probabilities (BoJ hike, USD/JPY > 160, Japan CPI > 2%)
- **Nansen** — APAC stablecoin flows, DeFi TVL momentum, smart-money exposure
- **x402 Oracle** — APAC real-estate price feed (JP / SG / HK / AU / KR)

Every source attempts a live request and falls back to a curated representative
dataset, so the UI and the API stay coherent even without configured keys.

### x402-gated API

| Endpoint | Method | Price | Description |
| --- | --- | --- | --- |
| `/api/macro/dashboard` | GET | **$0.30** | All four panels + Claude overall analysis |
| `/api/macro/panel` | POST | **$0.20** | Detail for one panel — body `{ "panel": "rates" \| "fx" \| "realestate" \| "inflation" }` |
| `/api/macro/weekly` | GET | **$3.00** | Weekly APAC macro intelligence report (~3,000 chars) |

Payments settle on **Base, Solana, Polygon or BNB Chain** — see *Multi-chain
payments* below. Requests without a valid payment receive HTTP 402.

#### `/api/macro/dashboard` response

```json
{
  "updatedAt": "2026-05-21T00:00:00Z",
  "overallScore": 0.3,
  "regime": "RISK_NEUTRAL",
  "panels": {
    "rates":      { "score": 0.5,  "trend": "TIGHTENING",   "keyMetric": "実質金利: -0.8%" },
    "fx":         { "score": -0.2, "trend": "YEN_WEAKNESS",  "keyMetric": "USD/JPY: 152.3" },
    "realestate": { "score": 0.7,  "trend": "STABLE",        "keyMetric": "東京: +8.7% YoY" },
    "inflation":  { "score": 0.1,  "trend": "MODERATING",    "keyMetric": "CPI: 2.1%" }
  },
  "analysis": {
    "headline": "APACマクロは中立圏。円安継続も不動産は底堅い",
    "topRisk": "日銀の予想外利上げによる円高反転",
    "topOpportunity": "Solanaステーブルコインフローが増加",
    "onchainSignal": "スマートマネーがAPACエクスポージャーを増加中",
    "analysis_ja": "200字以内の総合分析",
    "confidence": 0.75
  }
}
```

### Multi-chain payments

Payments are accepted on four chains. The original endpoints stay **Base / USDC**;
each additional chain is a sub-route — existing `route.ts` files are unchanged.

| Chain | Token(s) | Route | Gating |
| --- | --- | --- | --- |
| **Base** | USDC | `/api/macro/{endpoint}` | `paymentMiddleware` |
| **Solana** | USDC | `/api/macro/{endpoint}/solana` | manual x402 402 |
| **Polygon** | USDC · JPYC | `/api/macro/{endpoint}/polygon` | `withX402` (`network: "polygon"`) |
| **BNB Chain** | USDT | `/api/macro/{endpoint}/bnb` | manual x402 402 |

- The chain selector on the landing page defaults to **Solana**.
- **Solana** → USDC only (the JPYC tab is shown disabled / grayed out).
- **BNB Chain** → USDT only.
- On **Polygon**, request JPYC pricing by adding `?token=jpyc` to the sub-route.
- BNB Chain uses a manual 402 (`network: "eip155:56"`): the x402 `Network` enum
  has no `bnb`/`bsc` value, so `withX402` cannot be used for it.

Token contracts:

| Token | Chain | Contract |
| --- | --- | --- |
| USDC | Solana | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| JPYC | Polygon | `0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB` |
| USDT | BNB Chain | `0x55d398326f99059fF775485246999027B3197955` |

Wallet connection uses RainbowKit / wagmi for the EVM chains and the Solana
wallet adapter (Phantom · Solflare) for Solana.

### Tech stack

Next.js 15 · React 19 · `x402-next` · `@anthropic-ai/sdk` (Claude `claude-opus-4-7`) ·
viem · wagmi · RainbowKit · TanStack Query · Solana wallet adapter.

### Environment variables

```
# Data sources
NANSEN_API_KEY=
ANTHROPIC_API_KEY=
ESTAT_API_KEY=
JAPAN_DATA_API_URL=

# Payment wallets
WALLET_ADDRESS=                  # EVM receiving wallet (Base / Polygon / BNB)
SOLANA_WALLET_ADDRESS=           # Solana receiving wallet (base58)

# x402 facilitator
FACILITATOR_URL=https://api.developer.coinbase.com/rpc/v1/base/facilitator
POLYGON_FACILITATOR_URL=         # Polygon-capable facilitator (falls back to FACILITATOR_URL)

# RPC endpoints
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
BNB_RPC_URL=https://bsc-dataseed.binance.org/

# Wallet / token contracts
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=placeholder
NEXT_PUBLIC_JPYC_CONTRACT=0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB
NEXT_PUBLIC_USDT_BNB_CONTRACT=0x55d398326f99059fF775485246999027B3197955
JPYC_EIP712_NAME=JPYC            # verify against the deployed JPYC contract
JPYC_EIP712_VERSION=1            # verify against the deployed JPYC contract
```

Without keys the dashboard runs on the fallback dataset. Copy `.env.example` to
`.env.local` and fill in your values.

### Local development

```bash
npm install        # .npmrc sets legacy-peer-deps
npm run build      # run before every commit
npm run dev        # http://localhost:3000
```

### Deploy

Designed for **Vercel**. Set the environment variables above in the project settings.

### Disclaimer

This tool is for informational purposes only. Make your own investment decisions.

---

## 日本語

### コンセプト

APACの4つのマクロ要因（金利・為替・不動産・インフレ）をリアルタイムで追跡し、
オンチェーンのスマートマネーの動きと組み合わせて、Claude が投資インプリケーションを
分析します。vivienna.btc が「米債・ドル・金・インフレ」の四大マクロをカバーしているのに
対し、本ダッシュボードは APAC 特化です。

### 4つのマクロパネル

| パネル | 英語 | スコア指標 |
| --- | --- | --- |
| **金利・金融政策** | Interest Rates | 実質金利（名目 − 期待インフレ）、利回りスプレッド（10年−2年）、政策期待パス（Polymarket） |
| **為替** | Currency | 日米金利差、APACステーブルコインネットフロー（Nansen）、Polymarket為替確率 |
| **不動産** | Real Estate | 価格変動率（3ヶ月 / 12ヶ月）、賃料利回り vs 国債利回りスプレッド、取引量変化 |
| **インフレ・マクロ** | Inflation & Macro | コアインフレ、期待インフレ（Polymarket）、オンチェーンリスクセンチメント（Nansen） |

各パネルは **−2 〜 +2** のスケールで自動スコアリングされます。総合スコアは
`RISK_ON` / `RISK_NEUTRAL` / `RISK_OFF` のレジーム判定に対応します。データは
30分ごとに更新されます。

### データソース

- **Japan Data API** — 日銀政策金利、国債利回りカーブ、USD/JPY・USD/SGD・USD/KRW・USD/AUD、各地域の不動産価格指数
- **e-Stat** — 日本のCPI・PPI
- **Polymarket** — 予測市場の確率（日銀利上げ、USD/JPY>160、日本のCPI>2%）
- **Nansen** — APACステーブルコインフロー、DeFi TVL変動、スマートマネーのエクスポージャー
- **x402 Oracle** — APAC不動産価格フィード（JP / SG / HK / AU / KR）

各ソースはライブ取得を試み、失敗した場合は代表的なフォールバックデータを使用します。
これにより、APIキーが未設定でも UI と API は常に整合した結果を返します。

### x402ゲート型API

| エンドポイント | メソッド | 価格 | 説明 |
| --- | --- | --- | --- |
| `/api/macro/dashboard` | GET | **$0.30** | 4パネル全データ + Claudeの総合分析 |
| `/api/macro/panel` | POST | **$0.20** | 特定パネルの詳細 — ボディ `{ "panel": "rates" \| "fx" \| "realestate" \| "inflation" }` |
| `/api/macro/weekly` | GET | **$3.00** | 週次APACマクロインテリジェンスレポート（約3,000字） |

決済は **Base・Solana・Polygon・BNB Chain** に対応（詳細は「マルチチェーン決済」を
参照）。有効な支払いのないリクエストには HTTP 402 が返されます。

### 価格

- ダッシュボード全体: **$0.30**
- パネル詳細: **$0.20**
- 週次レポート: **$3.00**

### マルチチェーン決済

決済は4つのチェーンに対応しています。既存エンドポイントは **Base / USDC** のまま、
各チェーンはサブルートとして追加されます（既存の `route.ts` は変更しません）。

| チェーン | トークン | ルート | ゲーティング |
| --- | --- | --- | --- |
| **Base** | USDC | `/api/macro/{endpoint}` | `paymentMiddleware` |
| **Solana** | USDC | `/api/macro/{endpoint}/solana` | 手動 x402 402 |
| **Polygon** | USDC・JPYC | `/api/macro/{endpoint}/polygon` | `withX402`（`network: "polygon"`） |
| **BNB Chain** | USDT | `/api/macro/{endpoint}/bnb` | 手動 x402 402 |

- ランディングページのチェーンセレクターはデフォルトで **Solana**。
- **Solana** → USDCのみ（JPYCタブは無効・グレーアウト表示）。
- **BNB Chain** → USDTのみ。
- **Polygon** で JPYC 決済を行う場合はサブルートに `?token=jpyc` を付与。
- BNB Chain は手動402（`network: "eip155:56"`）を使用します。x402の `Network`
  列挙型に `bnb`/`bsc` がないため `withX402` は利用できません。

トークンコントラクト:

| トークン | チェーン | コントラクト |
| --- | --- | --- |
| USDC | Solana | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| JPYC | Polygon | `0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB` |
| USDT | BNB Chain | `0x55d398326f99059fF775485246999027B3197955` |

ウォレット接続は EVM チェーンで RainbowKit / wagmi、Solana で Solana ウォレット
アダプター（Phantom・Solflare）を使用します。

### 技術スタック

Next.js 15 · React 19 · `x402-next` · `@anthropic-ai/sdk`（Claude `claude-opus-4-7`）·
viem · wagmi · RainbowKit · TanStack Query · Solana ウォレットアダプター。

### 環境変数

```
# Data sources
NANSEN_API_KEY=
ANTHROPIC_API_KEY=
ESTAT_API_KEY=
JAPAN_DATA_API_URL=

# Payment wallets
WALLET_ADDRESS=                  # EVM receiving wallet (Base / Polygon / BNB)
SOLANA_WALLET_ADDRESS=           # Solana receiving wallet (base58)

# x402 facilitator
FACILITATOR_URL=https://api.developer.coinbase.com/rpc/v1/base/facilitator
POLYGON_FACILITATOR_URL=         # Polygon-capable facilitator (falls back to FACILITATOR_URL)

# RPC endpoints
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
BNB_RPC_URL=https://bsc-dataseed.binance.org/

# Wallet / token contracts
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=placeholder
NEXT_PUBLIC_JPYC_CONTRACT=0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB
NEXT_PUBLIC_USDT_BNB_CONTRACT=0x55d398326f99059fF775485246999027B3197955
JPYC_EIP712_NAME=JPYC            # verify against the deployed JPYC contract
JPYC_EIP712_VERSION=1            # verify against the deployed JPYC contract
```

APIキーが未設定の場合はフォールバックデータで動作します。`.env.example` を
`.env.local` にコピーして値を設定してください。

### ローカル開発

```bash
npm install        # .npmrc で legacy-peer-deps を設定
npm run build      # コミット前に毎回実行
npm run dev        # http://localhost:3000
```

### デプロイ

**Vercel** へのデプロイを想定しています。上記の環境変数をプロジェクト設定に登録してください。

### 免責事項

本ツールは情報提供のみを目的としています。投資判断はご自身でお願いします。

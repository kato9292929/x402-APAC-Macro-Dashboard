"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// Solana wallet adapter is always loaded client-side only (ssr: false).
const SolanaConnectButton = dynamic(
  () => import("@/components/SolanaConnectButton"),
  { ssr: false },
);

type ChainId = "solana" | "base" | "polygon" | "bnb";

interface ChainInfo {
  id: ChainId;
  label: string;
  network: string;
  tokens: string[];
  disabledTokens: string[];
  routeSuffix: string;
  settlement: string;
  banner?: string;
}

const CHAINS: ChainInfo[] = [
  {
    id: "solana",
    label: "Solana",
    network: "solana-mainnet",
    tokens: ["USDC"],
    disabledTokens: ["JPYC"],
    routeSuffix: "/solana",
    settlement: "Manual x402 (HTTP 402)",
    banner: "SolanaネットワークではUSDC決済のみご利用いただけます",
  },
  {
    id: "base",
    label: "Base",
    network: "base",
    tokens: ["USDC", "JPYC"],
    disabledTokens: [],
    routeSuffix: "",
    settlement: "paymentMiddleware (x402-next)",
  },
  {
    id: "polygon",
    label: "Polygon",
    network: "polygon",
    tokens: ["USDC", "JPYC"],
    disabledTokens: [],
    routeSuffix: "/polygon",
    settlement: "withX402 (x402-next)",
  },
  {
    id: "bnb",
    label: "BNB Chain",
    network: "eip155:56",
    tokens: ["USDT"],
    disabledTokens: [],
    routeSuffix: "/bnb",
    settlement: "Manual x402 (HTTP 402)",
    banner: "BNB ChainではUSDT決済のみご利用いただけます",
  },
];

const JPYC =
  process.env.NEXT_PUBLIC_JPYC_CONTRACT ??
  "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB";
const USDT_BNB =
  process.env.NEXT_PUBLIC_USDT_BNB_CONTRACT ??
  "0x55d398326f99059fF775485246999027B3197955";

const ASSET: Record<string, string> = {
  "solana:USDC": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "base:USDC": "Native USDC (Base)",
  "base:JPYC": JPYC,
  "polygon:USDC": "Native USDC (Polygon)",
  "polygon:JPYC": JPYC,
  "bnb:USDT": USDT_BNB,
};

const ENDPOINTS = [
  { method: "GET", path: "dashboard", price: "$0.30" },
  { method: "POST", path: "panel", price: "$0.20" },
  { method: "GET", path: "weekly", price: "$3.00" },
];

export function PaymentSelector() {
  const [chainId, setChainId] = useState<ChainId>("solana");
  const [token, setToken] = useState<string>("USDC");

  const chain = CHAINS.find((c) => c.id === chainId) ?? CHAINS[0];

  function selectChain(next: ChainInfo) {
    setChainId(next.id);
    setToken(next.tokens[0]);
  }

  const allTokens = [...chain.tokens, ...chain.disabledTokens];
  const asset = ASSET[`${chainId}:${token}`] ?? "—";
  const tokenQuery =
    chainId === "polygon" && token === "JPYC" ? "?token=jpyc" : "";

  return (
    <div className="pay-selector">
      <div className="chain-tabs">
        {CHAINS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chain-tab${c.id === chainId ? " active" : ""}`}
            onClick={() => selectChain(c)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="token-tabs">
        {allTokens.map((t) => {
          const disabled = chain.disabledTokens.includes(t);
          return (
            <button
              key={t}
              type="button"
              disabled={disabled}
              className={
                "token-tab" +
                (t === token && !disabled ? " active" : "") +
                (disabled ? " disabled" : "")
              }
              onClick={() => {
                if (!disabled) setToken(t);
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {chain.banner && <div className="pay-banner">{chain.banner}</div>}

      <div className="pay-grid">
        <div className="pay-info">
          <div className="pay-info-row">
            <span className="pi-label">ネットワーク</span>
            <span className="pi-value">{chain.network}</span>
          </div>
          <div className="pay-info-row">
            <span className="pi-label">トークン</span>
            <span className="pi-value">{token}</span>
          </div>
          <div className="pay-info-row">
            <span className="pi-label">アセット</span>
            <span className="pi-value mono">{asset}</span>
          </div>
          <div className="pay-info-row">
            <span className="pi-label">決済方式</span>
            <span className="pi-value">{chain.settlement}</span>
          </div>
        </div>

        <div className="pay-endpoints">
          {ENDPOINTS.map((e) => (
            <div className="pay-endpoint" key={e.path}>
              <span className="ep-method">{e.method}</span>
              <span className="ep-path mono">
                /api/macro/{e.path}
                {chain.routeSuffix}
                {tokenQuery}
              </span>
              <span className="ep-price">{e.price}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pay-connect">
        {chainId === "solana" ? (
          <SolanaConnectButton />
        ) : (
          <ConnectButton showBalance={false} chainStatus="icon" />
        )}
      </div>
    </div>
  );
}

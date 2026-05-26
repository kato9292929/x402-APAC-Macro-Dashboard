import { panelHandler } from "@/lib/macroHandlers";
import {
  SOLANA_USDC,
  PRICE_ATOMIC_6,
  ENDPOINT_DESCRIPTION,
  withManual402,
  corsPreflight,
} from "@/lib/payments";
import { SOLANA_NETWORK } from "@/lib/x402";

export const dynamic = "force-dynamic";

// POST /api/macro/panel/solana — Solana USDC, manual x402 v2 402 ($0.20).
export const POST = withManual402(panelHandler, {
  network: SOLANA_NETWORK,
  asset: SOLANA_USDC,
  amount: PRICE_ATOMIC_6.panel,
  description: ENDPOINT_DESCRIPTION.panel,
  payTo: process.env.SOLANA_WALLET_ADDRESS ?? "",
});

export function OPTIONS() {
  return corsPreflight();
}

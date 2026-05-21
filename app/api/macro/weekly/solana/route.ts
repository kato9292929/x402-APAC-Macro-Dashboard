import { weeklyHandler } from "@/lib/macroHandlers";
import {
  SOLANA_USDC,
  PRICE_ATOMIC_6,
  ENDPOINT_DESCRIPTION,
  withManual402,
  corsPreflight,
} from "@/lib/payments";

export const dynamic = "force-dynamic";

// GET /api/macro/weekly/solana — Solana USDC, manual x402 402 ($3.00).
export const GET = withManual402(weeklyHandler, {
  network: "solana-mainnet",
  asset: SOLANA_USDC,
  amount: PRICE_ATOMIC_6.weekly,
  description: ENDPOINT_DESCRIPTION.weekly,
  payTo: process.env.SOLANA_WALLET_ADDRESS ?? "",
});

export function OPTIONS() {
  return corsPreflight();
}

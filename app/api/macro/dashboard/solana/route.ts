import { dashboardHandler } from "@/lib/macroHandlers";
import {
  SOLANA_USDC,
  PRICE_ATOMIC_6,
  ENDPOINT_DESCRIPTION,
  withManual402,
  corsPreflight,
} from "@/lib/payments";

export const dynamic = "force-dynamic";

// GET /api/macro/dashboard/solana — Solana USDC, manual x402 402 ($0.30).
export const GET = withManual402(dashboardHandler, {
  network: "solana-mainnet",
  asset: SOLANA_USDC,
  amount: PRICE_ATOMIC_6.dashboard,
  description: ENDPOINT_DESCRIPTION.dashboard,
  payTo: process.env.SOLANA_WALLET_ADDRESS ?? "",
});

export function OPTIONS() {
  return corsPreflight();
}

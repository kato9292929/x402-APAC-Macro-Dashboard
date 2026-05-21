import { dashboardHandler } from "@/lib/macroHandlers";
import {
  USDT_BNB,
  PRICE_ATOMIC_18,
  ENDPOINT_DESCRIPTION,
  withManual402,
  corsPreflight,
} from "@/lib/payments";

export const dynamic = "force-dynamic";

// GET /api/macro/dashboard/bnb — BNB Chain USDT, manual x402 402 ($0.30).
// withX402 is not used: the x402 Network enum has no "bnb"/"bsc" value.
export const GET = withManual402(dashboardHandler, {
  network: "eip155:56",
  asset: USDT_BNB,
  amount: PRICE_ATOMIC_18.dashboard,
  description: ENDPOINT_DESCRIPTION.dashboard,
  payTo: process.env.WALLET_ADDRESS ?? "",
});

export function OPTIONS() {
  return corsPreflight();
}

import { weeklyHandler } from "@/lib/macroHandlers";
import {
  USDT_BNB,
  PRICE_ATOMIC_6,
  ENDPOINT_DESCRIPTION,
  withManual402,
  corsPreflight,
} from "@/lib/payments";

export const dynamic = "force-dynamic";

// GET /api/macro/weekly/bnb — BNB Chain USDT, manual x402 402 ($3.00).
// withX402 is not used: the x402 Network enum has no "bnb"/"bsc" value.
export const GET = withManual402(weeklyHandler, {
  network: "eip155:56",
  asset: USDT_BNB,
  amount: PRICE_ATOMIC_6.weekly,
  description: ENDPOINT_DESCRIPTION.weekly,
  payTo: process.env.WALLET_ADDRESS ?? "",
});

export function OPTIONS() {
  return corsPreflight();
}

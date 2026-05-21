import { panelHandler } from "@/lib/macroHandlers";
import {
  USDT_BNB,
  PRICE_ATOMIC_18,
  ENDPOINT_DESCRIPTION,
  withManual402,
  corsPreflight,
} from "@/lib/payments";

export const dynamic = "force-dynamic";

// POST /api/macro/panel/bnb — BNB Chain USDT, manual x402 402 ($0.20).
// withX402 is not used: the x402 Network enum has no "bnb"/"bsc" value.
export const POST = withManual402(panelHandler, {
  network: "eip155:56",
  asset: USDT_BNB,
  amount: PRICE_ATOMIC_18.panel,
  description: ENDPOINT_DESCRIPTION.panel,
  payTo: process.env.WALLET_ADDRESS ?? "",
});

export function OPTIONS() {
  return corsPreflight();
}

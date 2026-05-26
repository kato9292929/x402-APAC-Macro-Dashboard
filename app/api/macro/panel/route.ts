import { withX402 } from "@x402/next";
import { panelHandler } from "@/lib/macroHandlers";
import { x402Server, PAY_TO, BASE_NETWORK } from "@/lib/x402";
import { PRICE_USD, ENDPOINT_DESCRIPTION, corsPreflight } from "@/lib/payments";

export const dynamic = "force-dynamic";

// POST /api/macro/panel — Base USDC ($0.20), x402 v2 withX402.
export const POST = withX402(
  panelHandler,
  {
    accepts: [
      {
        scheme: "exact",
        payTo: PAY_TO,
        price: PRICE_USD.panel,
        network: BASE_NETWORK,
      },
    ],
    description: ENDPOINT_DESCRIPTION.panel,
    mimeType: "application/json",
  },
  x402Server,
);

export function OPTIONS() {
  return corsPreflight();
}

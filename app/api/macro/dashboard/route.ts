import { withX402 } from "@x402/next";
import { dashboardHandler } from "@/lib/macroHandlers";
import { x402Server, PAY_TO, BASE_NETWORK } from "@/lib/x402";
import { PRICE_USD, ENDPOINT_DESCRIPTION, corsPreflight } from "@/lib/payments";

export const dynamic = "force-dynamic";

// GET /api/macro/dashboard — Base USDC ($0.30), x402 v2 withX402.
export const GET = withX402(
  dashboardHandler,
  {
    accepts: [
      {
        scheme: "exact",
        payTo: PAY_TO,
        price: PRICE_USD.dashboard,
        network: BASE_NETWORK,
      },
    ],
    description: ENDPOINT_DESCRIPTION.dashboard,
    mimeType: "application/json",
  },
  x402Server,
);

export function OPTIONS() {
  return corsPreflight();
}

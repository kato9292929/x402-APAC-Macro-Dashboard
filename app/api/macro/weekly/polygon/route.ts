import { withX402 } from "@x402/next";
import { weeklyHandler } from "@/lib/macroHandlers";
import { x402Server, PAY_TO, POLYGON_NETWORK } from "@/lib/x402";
import { PRICE_USD, ENDPOINT_DESCRIPTION, corsPreflight } from "@/lib/payments";

export const dynamic = "force-dynamic";

// GET /api/macro/weekly/polygon — Polygon USDC ($3.00), x402 v2 withX402.
export const GET = withX402(
  weeklyHandler,
  {
    accepts: [
      {
        scheme: "exact",
        payTo: PAY_TO,
        price: PRICE_USD.weekly,
        network: POLYGON_NETWORK,
      },
    ],
    description: ENDPOINT_DESCRIPTION.weekly,
    mimeType: "application/json",
  },
  x402Server,
);

export function OPTIONS() {
  return corsPreflight();
}

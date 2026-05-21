import { withX402 } from "x402-next";
import { dashboardHandler } from "@/lib/macroHandlers";
import { polygonRouteConfig, polygonFacilitatorUrl, corsPreflight } from "@/lib/payments";

export const dynamic = "force-dynamic";

const payTo = (process.env.WALLET_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// GET /api/macro/dashboard/polygon — Polygon USDC (default) or JPYC (?token=jpyc).
export const GET = withX402(
  dashboardHandler,
  payTo,
  polygonRouteConfig("dashboard"),
  { url: polygonFacilitatorUrl },
);

export function OPTIONS() {
  return corsPreflight();
}

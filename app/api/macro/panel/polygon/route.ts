import { withX402 } from "x402-next";
import { panelHandler } from "@/lib/macroHandlers";
import { polygonRouteConfig, polygonFacilitatorUrl, corsPreflight } from "@/lib/payments";

export const dynamic = "force-dynamic";

const payTo = (process.env.WALLET_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// POST /api/macro/panel/polygon — Polygon USDC (default) or JPYC (?token=jpyc).
export const POST = withX402(
  panelHandler,
  payTo,
  polygonRouteConfig("panel"),
  { url: polygonFacilitatorUrl },
);

export function OPTIONS() {
  return corsPreflight();
}

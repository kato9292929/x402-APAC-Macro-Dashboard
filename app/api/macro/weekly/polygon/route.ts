import { withX402 } from "x402-next";
import { weeklyHandler } from "@/lib/macroHandlers";
import { polygonRouteConfig, facilitatorUrl, corsPreflight } from "@/lib/payments";

export const dynamic = "force-dynamic";

const payTo = (process.env.WALLET_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// GET /api/macro/weekly/polygon — Polygon USDC (default) or JPYC (?token=jpyc).
export const GET = withX402(
  weeklyHandler,
  payTo,
  polygonRouteConfig("weekly"),
  { url: facilitatorUrl },
);

export function OPTIONS() {
  return corsPreflight();
}

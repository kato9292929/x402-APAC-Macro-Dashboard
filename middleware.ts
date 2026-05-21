import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  manual402,
  BASE_USDC,
  PRICE_ATOMIC_6,
  ENDPOINT_DESCRIPTION,
  type EndpointKey,
} from "@/lib/payments";

/**
 * x402 payment gate for the Base USDC macro endpoints.
 *
 * A hand-built 402 envelope is used instead of x402-next's `paymentMiddleware`:
 * that wrapper bundles `@coinbase/cdp-sdk` (~1.3 MB) into the Edge runtime,
 * which exceeds Vercel's 1 MB Edge Function limit. Base settlement therefore
 * uses the same manual-402 model as the Solana / BNB sub-routes. The Polygon
 * sub-routes still use `withX402` — those run on the Node runtime, which has
 * no such size limit.
 */
const BASE_ROUTES: Record<string, EndpointKey> = {
  "/api/macro/dashboard": "dashboard",
  "/api/macro/panel": "panel",
  "/api/macro/weekly": "weekly",
};

export function middleware(req: NextRequest): NextResponse {
  const endpoint = BASE_ROUTES[req.nextUrl.pathname];
  if (!endpoint || req.headers.get("X-PAYMENT")) {
    return NextResponse.next();
  }
  return manual402(req, {
    network: "base",
    asset: BASE_USDC,
    amount: PRICE_ATOMIC_6[endpoint],
    description: ENDPOINT_DESCRIPTION[endpoint],
    payTo: process.env.WALLET_ADDRESS ?? "",
  });
}

export const config = {
  matcher: [
    "/api/macro/dashboard",
    "/api/macro/panel",
    "/api/macro/weekly",
  ],
};

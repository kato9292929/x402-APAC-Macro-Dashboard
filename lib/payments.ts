import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Manual x402 v2 helpers for the chains that the @x402/* SDK does not handle:
 *
 * - Solana — kept on a hand-built 402 envelope. (`@x402/svm` exists but no
 *   v2 reference pattern was provided for this migration, so the existing
 *   manual flow is preserved with a CAIP-2 network identifier.)
 * - BNB Chain — x402's Network type cannot express `bnb`/`bsc`, so the BNB
 *   manual envelope continues using `eip155:56`.
 *
 * Base and Polygon are gated by the v2 `withX402` wrapper from @x402/next
 * (see app/api/macro/<endpoint>/route.ts and .../polygon/route.ts).
 */

export const SOLANA_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDT_BNB =
  process.env.NEXT_PUBLIC_USDT_BNB_CONTRACT ??
  "0x55d398326f99059fF775485246999027B3197955";

export type EndpointKey = "dashboard" | "panel" | "weekly";

/** USD price per endpoint — used by the v2 withX402 routes. */
export const PRICE_USD: Record<EndpointKey, string> = {
  dashboard: "$0.30",
  panel: "$0.20",
  weekly: "$3.00",
};

/** Atomic amount for 6-decimal tokens (Solana USDC manual-402 envelopes). */
export const PRICE_ATOMIC_6: Record<EndpointKey, string> = {
  dashboard: "300000",
  panel: "200000",
  weekly: "3000000",
};

/** Atomic amount for 18-decimal tokens (BNB Chain USDT manual-402 envelopes). */
export const PRICE_ATOMIC_18: Record<EndpointKey, string> = {
  dashboard: "300000000000000000",
  panel: "200000000000000000",
  weekly: "3000000000000000000",
};

export const ENDPOINT_DESCRIPTION: Record<EndpointKey, string> = {
  dashboard: "APAC macro dashboard: four panels + Claude investment analysis",
  panel: "Detailed data for a single APAC macro panel",
  weekly: "Weekly APAC macro intelligence report (~3,000 chars)",
};

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-payment, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export interface Manual402Options {
  network: string;
  asset: string;
  amount: string;
  description: string;
  payTo: string;
}

/** Builds an x402-compliant HTTP 402 "Payment Required" response by hand. */
export function manual402(
  req: NextRequest,
  opts: Manual402Options,
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      x402Version: 2,
      error: "Payment Required",
      accepts: [
        {
          scheme: "exact",
          network: opts.network,
          maxAmountRequired: opts.amount,
          resource: req.url,
          description: opts.description,
          mimeType: "application/json",
          payTo: opts.payTo,
          maxTimeoutSeconds: 300,
          asset: opts.asset,
        },
      ],
    }),
    {
      status: 402,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    },
  );
}

type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * Wraps a handler with a manual x402 gate — used for Solana and BNB Chain,
 * which the @x402/* SDK family does not currently handle here. Requests
 * without an X-PAYMENT header receive an HTTP 402 envelope.
 */
export function withManual402(
  handler: RouteHandler,
  opts: Manual402Options,
): RouteHandler {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (!req.headers.get("X-PAYMENT")) {
      return manual402(req, opts);
    }
    return handler(req);
  };
}

/** CORS preflight response for cross-origin x402 clients. */
export function corsPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

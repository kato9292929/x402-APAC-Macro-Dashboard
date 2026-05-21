import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { RouteConfig } from "x402-next";

/**
 * Multi-chain payment configuration for the macro API.
 *
 * - Base    — existing root route.ts files, gated by paymentMiddleware (USDC).
 * - Solana  — manual x402 402 envelope (USDC). x402-next's facilitator network
 *             enum is EVM-oriented, so Solana is gated by hand.
 * - Polygon — withX402 wrapper, network "polygon" (USDC + JPYC).
 * - BNB     — manual x402 402 envelope (USDT). The x402 Network enum has no
 *             "bnb"/"bsc" value, so withX402 cannot type-check it; BNB is
 *             gated by hand with network "eip155:56".
 */

export const SOLANA_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const USDT_BNB =
  process.env.NEXT_PUBLIC_USDT_BNB_CONTRACT ??
  "0x55d398326f99059fF775485246999027B3197955";
export const JPYC_POLYGON =
  process.env.NEXT_PUBLIC_JPYC_CONTRACT ??
  "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB";

/**
 * JPYC EIP-712 domain for the x402 "exact" EVM scheme. Verify these against
 * the deployed JPYC contract — and confirm it supports EIP-3009
 * (transferWithAuthorization) — before enabling real JPYC settlement.
 */
export const JPYC_EIP712_NAME = process.env.JPYC_EIP712_NAME ?? "JPYC";
export const JPYC_EIP712_VERSION = process.env.JPYC_EIP712_VERSION ?? "1";

export type EndpointKey = "dashboard" | "panel" | "weekly";

/** USD price per endpoint — used by the Polygon withX402 USDC routes. */
export const PRICE_USD: Record<EndpointKey, string> = {
  dashboard: "$0.30",
  panel: "$0.20",
  weekly: "$3.00",
};

/** Atomic amount for 6-decimal stablecoins (Solana USDC manual-402 envelopes). */
export const PRICE_ATOMIC_6: Record<EndpointKey, string> = {
  dashboard: "300000",
  panel: "200000",
  weekly: "3000000",
};

/**
 * Atomic amount for 18-decimal tokens — BNB Chain USDT (`0x55d3...7955`) has
 * 18 decimals, so the manual-402 envelope cannot reuse the 6-decimal values.
 */
export const PRICE_ATOMIC_18: Record<EndpointKey, string> = {
  dashboard: "300000000000000000",
  panel: "200000000000000000",
  weekly: "3000000000000000000",
};

/**
 * JPYC is yen-pegged with 18 decimals. The USD prices are converted at an
 * approximate 160 JPY/USD rate; tune these before enabling real settlement.
 */
export const PRICE_JPY: Record<EndpointKey, number> = {
  dashboard: 48,
  panel: 32,
  weekly: 480,
};

export const ENDPOINT_DESCRIPTION: Record<EndpointKey, string> = {
  dashboard: "APAC macro dashboard: four panels + Claude investment analysis",
  panel: "Detailed data for a single APAC macro panel",
  weekly: "Weekly APAC macro intelligence report (~3,000 chars)",
};

/** JPYC atomic amount (18 decimals) for the given endpoint. */
export function jpycAtomic(endpoint: EndpointKey): string {
  return (BigInt(PRICE_JPY[endpoint]) * 10n ** 18n).toString();
}

export const facilitatorUrl = (process.env.FACILITATOR_URL ??
  "https://api.developer.coinbase.com/rpc/v1/base/facilitator") as `${string}://${string}`;

/**
 * Polygon settlement needs a Polygon-capable facilitator. Falls back to
 * FACILITATOR_URL, but the Base CDP facilitator does not settle Polygon —
 * set POLYGON_FACILITATOR_URL to a Polygon-capable facilitator in production.
 */
export const polygonFacilitatorUrl = (process.env.POLYGON_FACILITATOR_URL ??
  process.env.FACILITATOR_URL ??
  "https://api.developer.coinbase.com/rpc/v1/base/facilitator") as `${string}://${string}`;

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
      x402Version: 1,
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
 * which the x402-next facilitator network enum does not cover. Requests
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

/**
 * Builds the dynamic withX402 route config for a Polygon endpoint. The token
 * is chosen per-request via the `?token=` query param: `jpyc` selects JPYC
 * (18 decimals, EIP-712 asset), anything else defaults to native USDC.
 */
export function polygonRouteConfig(
  endpoint: EndpointKey,
): (req: NextRequest) => Promise<RouteConfig> {
  return async (req: NextRequest): Promise<RouteConfig> => {
    const token = new URL(req.url).searchParams.get("token");
    if (token === "jpyc") {
      return {
        price: {
          amount: jpycAtomic(endpoint),
          asset: {
            address: JPYC_POLYGON as `0x${string}`,
            decimals: 18,
            eip712: { name: JPYC_EIP712_NAME, version: JPYC_EIP712_VERSION },
          },
        },
        network: "polygon",
        config: { description: `${ENDPOINT_DESCRIPTION[endpoint]} (JPYC)` },
      };
    }
    return {
      price: PRICE_USD[endpoint],
      network: "polygon",
      config: { description: `${ENDPOINT_DESCRIPTION[endpoint]} (USDC)` },
    };
  };
}

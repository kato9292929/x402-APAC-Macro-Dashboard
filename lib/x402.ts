import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import type { FacilitatorConfig } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { createFacilitatorConfig } from "@coinbase/x402";

/**
 * x402 v2 server setup. Facilitator selection (in priority order):
 *   1. CDP API keys (CDP_API_KEY_ID + CDP_API_KEY_SECRET) — production CDP facilitator
 *   2. FACILITATOR_URL — explicit URL (community / self-hosted facilitator)
 *   3. defaults — built-in facilitator config
 *
 * `syncFacilitatorOnStart` is left at its default (true). Skipping it would
 * leave the resource server without supported kinds on Vercel runtime and
 * produce 500s on the first request.
 */

const DEFAULT_PAY_TO = "0xC67d94504696960bA0f2e7C3FeE703950734c00A";

export const PAY_TO = (process.env.WALLET_ADDRESS ?? DEFAULT_PAY_TO) as `0x${string}`;

// CAIP-2 network identifiers used by the v2 routes.
export const BASE_NETWORK = "eip155:8453" as const;
export const POLYGON_NETWORK = "eip155:137" as const;
export const BNB_NETWORK = "eip155:56" as const;
export const SOLANA_NETWORK =
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" as const;

function buildFacilitatorConfig(): FacilitatorConfig {
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;
  if (apiKeyId && apiKeySecret) {
    return createFacilitatorConfig(apiKeyId, apiKeySecret);
  }
  const url = process.env.FACILITATOR_URL;
  if (url && /^https?:\/\//.test(url)) {
    return { url: url as `${string}://${string}` };
  }
  return {};
}

const facilitatorClient = new HTTPFacilitatorClient(buildFacilitatorConfig());

export const x402Server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(x402Server);

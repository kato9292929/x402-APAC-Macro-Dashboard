import { paymentMiddleware } from "x402-next";

/**
 * x402 payment gating for the macro API. Each route is priced per the
 * dashboard's pricing model and settled on Base via the configured
 * facilitator. Requests without a valid payment receive HTTP 402.
 */
const payTo = (process.env.WALLET_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

const facilitatorUrl = (process.env.FACILITATOR_URL ??
  "https://api.developer.coinbase.com/rpc/v1/base/facilitator") as `${string}://${string}`;

export const middleware = paymentMiddleware(
  payTo,
  {
    "/api/macro/dashboard": {
      price: "$0.30",
      network: "base",
      config: {
        description:
          "APAC macro dashboard: all four panels plus Claude investment analysis",
      },
    },
    "/api/macro/panel": {
      price: "$0.20",
      network: "base",
      config: {
        description: "Detailed data for a single APAC macro panel",
      },
    },
    "/api/macro/weekly": {
      price: "$3.00",
      network: "base",
      config: {
        description: "Weekly APAC macro intelligence report (~3,000 chars)",
      },
    },
  },
  { url: facilitatorUrl },
);

export const config = {
  matcher: [
    "/api/macro/dashboard",
    "/api/macro/panel",
    "/api/macro/weekly",
  ],
};

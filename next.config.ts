import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["x402-next"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    // `pino` (pulled in transitively by WalletConnect) optionally requires
    // `pino-pretty`, a dev-only pretty-printer the app never uses. Aliasing it
    // to false resolves it to an empty module instead of a "not found" warning.
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "pino-pretty": false,
    };
    // x402-next's facilitator SDK (axios / jose, via @coinbase/cdp-sdk) reports
    // Node APIs the Edge runtime lacks. Those code paths are not exercised by
    // the payment flow used here, so the warnings are silenced.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /node_modules[\\/](jose|axios)[\\/]/ },
    ];
    return config;
  },
};

export default nextConfig;

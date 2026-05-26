import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    return config;
  },
};

export default nextConfig;

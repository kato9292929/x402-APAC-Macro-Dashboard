"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import SolanaWalletProviders from "./SolanaWalletProviders";

/**
 * Self-contained Solana connect button. The wallet-adapter providers are
 * scoped to just this button so the rest of the app keeps server-side
 * rendering — this component is always dynamically imported with ssr:false.
 */
export default function SolanaConnectButton() {
  return (
    <SolanaWalletProviders>
      <WalletMultiButton />
    </SolanaWalletProviders>
  );
}

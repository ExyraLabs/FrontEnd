"use client";

import { wagmiAdapter, projectId } from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit, useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { mainnet, arbitrum } from "@reown/appkit/networks";
import React, { useState, type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { CopilotKit } from "@copilotkit/react-core";
import Modal from "../Modal";

// Set up queryClient
const queryClient = new QueryClient();

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Where CopilotKit will proxy requests to. If you're using Copilot Cloud, this environment variable will be empty.
const runtimeUrl = process.env.NEXT_PUBLIC_COPILOTKIT_RUNTIME_URL;
// When using Copilot Cloud, all we need is the publicApiKey.
const publicApiKey = process.env.NEXT_PUBLIC_COPILOT_API_KEY;

// Set up metadata
const metadata = {
  name: "Fraktia",
  description:
    "Build powerful AI agents visually with Fraktia's no-code flow builder",
  url: "https://fraktia.ai", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, arbitrum],
  defaultNetwork: mainnet,
  metadata: metadata,
  features: {
    connectMethodsOrder: ["wallet"],
    email: false, // default to true
    analytics: true, // Optional - defaults to your Cloud configuration
  },
});

function WalletProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  );

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>
        <CopilotKit publicApiKey={publicApiKey}>{children}</CopilotKit>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default WalletProvider;

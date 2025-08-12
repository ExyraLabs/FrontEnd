import { useAppKitAccount } from "@reown/appkit/react";
import { useCopilotAction } from "@copilotkit/react-core";
import { Alchemy, Network } from "alchemy-sdk";

const AlchemyAgent = () => {
  const { address } = useAppKitAccount();

  // Configures the Alchemy SDK

  const config = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY, // Replace with your API key

    network: Network.ETH_MAINNET, // Replace with your network
  };

  // Creates an Alchemy object instance with the config to use for making requests

  const alchemy = new Alchemy(config);

  // Basic account balance check
  useCopilotAction({
    name: "getAccountBalance",
    description:
      "Get ERC-20 balance for a wallet address using Alchemy SDK.Ideally fetch balance for a specific token from the users connected wallet if not wallet address is specified",
    parameters: [
      {
        name: "contractAddress",
        type: "string",
        description:
          "Contract address of the ERC-20 token to check balance for, if not provided, use the tool getContractAddressWithDecimal to find the address",
        required: true,
      },
      {
        name: "walletAddress",
        type: "string",
        description:
          "Wallet address to check balance for (optional, defaults to connected wallet)",
        required: false,
      },
    ],
    handler: async ({
      contractAddress,
      walletAddress,
    }: {
      contractAddress: string;
      walletAddress?: string;
    }) => {
      const targetAddress = walletAddress || address;

      if (!targetAddress || !contractAddress) {
        return "❌ No wallet address available (connect wallet or provide address) or no contract address provided.";
      }

      try {
        // Call the method to return the token balances for this address
        const response = await alchemy.core.getTokenBalances(targetAddress, [
          contractAddress,
        ]);

        // Get token metadata to get decimals
        const tokenMetadata = await alchemy.core.getTokenMetadata(
          contractAddress
        );

        // Process the response to convert hex to readable numbers
        const processedBalances = response.tokenBalances.map((token) => {
          const hexBalance = token.tokenBalance || "0x0";

          // Convert hex to BigInt
          const balanceWei = BigInt(hexBalance);

          // Get decimals (default to 18 if not available)
          const decimals = tokenMetadata.decimals || 18;

          // Convert to human readable format
          const divisor = BigInt(10 ** decimals);
          const balanceFormatted = Number(balanceWei) / Number(divisor);

          return {
            contractAddress: token.contractAddress,
            tokenBalance: hexBalance,
            balanceFormatted: balanceFormatted.toFixed(6),
            balanceWei: balanceWei.toString(),
            tokenSymbol: tokenMetadata.symbol || "Unknown",
            tokenName: tokenMetadata.name || "Unknown",
            decimals: decimals,
          };
        });

        const result = {
          address: targetAddress,
          tokenBalances: processedBalances,
          summary: `Balance: ${processedBalances[0]?.balanceFormatted || "0"} ${
            processedBalances[0]?.tokenSymbol || "tokens"
          }`,
        };

        console.log("Processed response:", result);
        return `💰 Token Balance for ${targetAddress}

🏷️ Token: ${result.tokenBalances[0]?.tokenName} (${result.tokenBalances[0]?.tokenSymbol})
📍 Contract: ${contractAddress}
💎 Balance: ${result.tokenBalances[0]?.balanceFormatted} ${result.tokenBalances[0]?.tokenSymbol}
🔢 Raw Balance: ${result.tokenBalances[0]?.balanceWei} wei
📊 Decimals: ${result.tokenBalances[0]?.decimals}

${result.summary}`;
      } catch (error) {
        console.error("Error with Alchemy SDK:", error);
        return `❌ Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
      }
    },
  });

  // Get all token balances for a wallet (ERC-20 set) + native ETH
  useCopilotAction({
    name: "getAllTokenBalances",
    description:
      "Fetch all ERC-20 token balances (and native ETH) for the connected wallet or a provided wallet address using Alchemy SDK.",
    parameters: [
      {
        name: "walletAddress",
        type: "string",
        description: "Optional wallet address (defaults to connected wallet)",
        required: false,
      },
      {
        name: "includeZeroBalances",
        type: "boolean",
        description:
          "Whether to include tokens with zero balance (default false)",
        required: false,
      },
      {
        name: "maxTokens",
        type: "number",
        description:
          "Optional limit on number of token entries to return (default 50, max 200)",
        required: false,
      },
    ],
    handler: async ({
      walletAddress,
      includeZeroBalances = false,
      maxTokens = 50,
    }: {
      walletAddress?: string;
      includeZeroBalances?: boolean;
      maxTokens?: number;
    }) => {
      const target = walletAddress || address;
      if (!target) {
        return "❌ No wallet connected and no walletAddress provided.";
      }
      try {
        if (maxTokens <= 0) maxTokens = 50;
        if (maxTokens > 200) maxTokens = 200; // safety cap

        // Native ETH balance
        const nativeBalWei = await alchemy.core.getBalance(target, "latest");
        const nativeBal = Number(nativeBalWei.toString()) / 1e18;

        // All ERC-20 token balances
        const tokenBalancesResp = await alchemy.core.getTokenBalances(target);
        const rawBalances = tokenBalancesResp.tokenBalances || [];

        // Optionally filter out zero balances early
        const filtered = includeZeroBalances
          ? rawBalances
          : rawBalances.filter(
              (t) => t.tokenBalance && t.tokenBalance !== "0x0"
            );

        // Trim to maxTokens for metadata resolution to avoid rate limits
        const slice = filtered.slice(0, maxTokens);

        // Resolve metadata sequentially (can be optimized with limited concurrency if needed)
        const results: Array<{
          contractAddress: string;
          symbol: string;
          name: string;
          decimals: number;
          balanceRawHex: string;
          balanceFormatted: string;
        }> = [];

        for (const tb of slice) {
          try {
            const meta = await alchemy.core.getTokenMetadata(
              tb.contractAddress
            );
            const hex = tb.tokenBalance || "0x0";
            const balBig = BigInt(hex);
            const decimals = meta.decimals ?? 18;
            const divisor = BigInt(10) ** BigInt(decimals);
            const balanceNumber = Number(balBig) / Number(divisor);
            results.push({
              contractAddress: tb.contractAddress,
              symbol: meta.symbol || "?",
              name:
                meta.name || meta.symbol || tb.contractAddress.substring(0, 10),
              decimals,
              balanceRawHex: hex,
              balanceFormatted: balanceNumber.toLocaleString(undefined, {
                maximumFractionDigits: 6,
              }),
            });
          } catch (metaErr) {
            console.warn(
              "Metadata fetch failed for",
              tb.contractAddress,
              metaErr
            );
          }
        }

        // Sort by numeric balance descending
        results.sort(
          (a, b) =>
            parseFloat(b.balanceFormatted.replace(/,/g, "")) -
            parseFloat(a.balanceFormatted.replace(/,/g, ""))
        );

        const lines = results
          .map(
            (r, i) =>
              `${String(i + 1).padStart(2, "0")} • ${r.symbol.padEnd(10)} ${
                r.balanceFormatted
              } (dec:${r.decimals}) ${r.contractAddress}`
          )
          .join("\n");

        return `🧾 Wallet Token Balances

Wallet: ${target}
Network: Ethereum Mainnet
Native ETH: ${nativeBal.toFixed(6)} ETH
ERC-20 Tokens Returned: ${results.length} (requested max ${maxTokens}$${
          includeZeroBalances ? " including" : " excluding"
        } zero balances)

Top Tokens:
${lines || "(none)"}

Notes:
• Values are raw balances (no USD pricing here)
• Use 'getAccountBalance' for a specific token
• Increase maxTokens (<=200) if you need more entries`;
      } catch (err) {
        console.error("Failed to fetch all token balances", err);
        return `❌ Failed to fetch token balances: ${
          err instanceof Error ? err.message : "Unknown error"
        }`;
      }
    },
  });

  // const test = async () => {
  //   if (!address) {
  //     return "❌ No contract address provided or no wallet connected.";
  //   }
  //   const response = await alchemy.core.getTokenBalances(address, [
  //     "0x42168a285252bd00e4930e2f9dc01d496b14c90a",
  //   ]);
  //   console.log(response);
  // };

  return null;
};

export default AlchemyAgent;

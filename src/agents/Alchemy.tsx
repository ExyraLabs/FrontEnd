import { useAppKitAccount } from "@reown/appkit/react";
import { useCopilotAction } from "@copilotkit/react-core";
import { Alchemy, Network } from "alchemy-sdk";

const AlchemyAgent = () => {
  const { address, isConnected } = useAppKitAccount();

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
    description: "Get ERC-20 balance for a wallet address using Alchemy SDK.",
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

  const test = async () => {
    if (!address) {
      return "❌ No contract address provided or no wallet connected.";
    }
    const response = await alchemy.core.getTokenBalances(address, [
      "0x42168a285252bd00e4930e2f9dc01d496b14c90a",
    ]);
    console.log(response);
  };

  return null;
};

export default AlchemyAgent;

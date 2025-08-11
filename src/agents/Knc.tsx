"use client";
import { useAppKitAccount } from "@reown/appkit/react";
import { parseUnits, formatUnits } from "viem";
import { useCopilotAction } from "@copilotkit/react-core";
import axios from "axios";
import {
  getContractAddressWithDecimals,
  getAvailablePlatforms,
} from "@/lib/coingecko";
import SlippageSelector from "@/components/SlippageSelector";

// KyberSwap Aggregator API configuration
const KYBERSWAP_API_BASE = "https://aggregator-api.kyberswap.com";
const DEFAULT_SLIPPAGE = 50; // 0.5% in bips
const DEFAULT_CLIENT_ID = "FraktIA-DApp";

interface RouteData {
  tokenIn: string;
  amountIn: string;
  amountInUsd: string;
  tokenOut: string;
  amountOut: string;
  amountOutUsd: string;
  gas: string;
  gasPrice: string;
  gasUsd: string;
  route: Array<unknown>;
  routeID: string;
}

interface SwapQuote {
  routeSummary: RouteData;
  routerAddress: string;
}

interface SwapResult {
  data: string;
  routerAddress: string;
  amountIn: string;
  amountOut: string;
  gas: string;
  gasUsd: string;
}

const Knc = () => {
  const { address, isConnected } = useAppKitAccount();

  // Helper function to resolve token addresses and handle native tokens
  const resolveTokenAddresses = async (
    tokenInSymbol: string,
    tokenOutSymbol: string,
    platform: string
  ) => {
    // Step 1: Get token addresses using CoinGecko
    const tokenInData = await getContractAddressWithDecimals(
      tokenInSymbol,
      platform
    );
    const tokenOutData = await getContractAddressWithDecimals(
      tokenOutSymbol,
      platform
    );

    if (!tokenInData?.address || !tokenOutData?.address) {
      throw new Error(
        `Could not find contract addresses for ${tokenInSymbol} or ${tokenOutSymbol} on ${platform}.

🔧 Try:
  • Use 'checkTokenPlatforms' to see available platforms
  • Verify token symbols are correct
  • Try different platform (ethereum, polygon-pos, binance-smart-chain, etc.)`
      );
    }

    // Use native token address only if the platform matches the token symbol
    const isNativeTokenIn =
      (tokenInSymbol.toUpperCase() === "ETH" && platform === "ethereum") ||
      (tokenInSymbol.toUpperCase() === "MATIC" && platform === "polygon-pos") ||
      (tokenInSymbol.toUpperCase() === "BNB" &&
        platform === "binance-smart-chain");

    const isNativeTokenOut =
      (tokenOutSymbol.toUpperCase() === "ETH" && platform === "ethereum") ||
      (tokenOutSymbol.toUpperCase() === "MATIC" &&
        platform === "polygon-pos") ||
      (tokenOutSymbol.toUpperCase() === "BNB" &&
        platform === "binance-smart-chain");

    const tokenInAddress = isNativeTokenIn
      ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      : tokenInData.address;

    const tokenOutAddress = isNativeTokenOut
      ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      : tokenOutData.address;

    return {
      tokenInData,
      tokenOutData,
      tokenInAddress,
      tokenOutAddress,
    };
  };

  // Helper function to fetch KyberSwap route
  const fetchKyberSwapRoute = async (
    tokenInAddress: string,
    tokenOutAddress: string,
    amountInWei: string,
    kyberChainName: string
  ): Promise<SwapQuote> => {
    const routeUrl = `${KYBERSWAP_API_BASE}/${kyberChainName}/api/v1/routes`;
    const response = await axios.get(routeUrl, {
      params: {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: amountInWei,
      },
      headers: {
        "X-Client-Id": DEFAULT_CLIENT_ID,
      },
    });

    return response.data.data;
  };

  // Helper function to get KyberSwap chain name from chain ID
  const getKyberChainName = (chainId: number): string => {
    const chainMap: Record<number, string> = {
      1: "ethereum",
      137: "polygon",
      56: "bsc",
      42161: "arbitrum",
      10: "optimism",
      43114: "avalanche",
      8453: "base",
      324: "zksync",
      250: "fantom",
      59144: "linea",
      534352: "scroll",
    };
    return chainMap[chainId] || "ethereum";
  };

  // Helper function to convert CoinGecko platform to chain ID
  const platformToChainId = (platform: string): number => {
    const platformMap: Record<string, number> = {
      ethereum: 1,
      "polygon-pos": 137,
      "binance-smart-chain": 56,
      "arbitrum-one": 42161,
      "optimistic-ethereum": 10,
      avalanche: 43114,
      base: 8453,
    };
    return platformMap[platform] || 1;
  };

  // Extracted handler functions for testing
  const handleGetKyberSwapQuoteBySymbol = async ({
    tokenInSymbol,
    tokenOutSymbol,
    amount,
    platform = "ethereum",
  }: {
    tokenInSymbol: string;
    tokenOutSymbol: string;
    amount: string;
    platform?: string;
  }) => {
    try {
      // Use the extracted helper function
      const { tokenInData, tokenOutData, tokenInAddress, tokenOutAddress } =
        await resolveTokenAddresses(tokenInSymbol, tokenOutSymbol, platform);

      // Step 2: Convert platform to chain ID and get KyberSwap chain name
      const chainId = platformToChainId(platform);
      const kyberChainName = getKyberChainName(chainId);

      // Step 3: Get decimals and format amount
      const tokenInDecimals = tokenInData.decimals || 18;
      const amountInWei = parseUnits(amount, tokenInDecimals).toString();

      // Step 4: Get KyberSwap quote using extracted helper
      console.log(
        `🔍 Fetching KyberSwap quote: ${amount} ${tokenInSymbol} → ${tokenOutSymbol} on ${platform}`
      );

      const data: SwapQuote = await fetchKyberSwapRoute(
        tokenInAddress,
        tokenOutAddress,
        amountInWei,
        kyberChainName
      );
      const routeSummary = data.routeSummary;

      const inputAmount = formatUnits(
        BigInt(routeSummary.amountIn),
        tokenInDecimals
      );
      const outputAmount = formatUnits(
        BigInt(routeSummary.amountOut),
        tokenOutData.decimals || 18
      );

      return `💱 KyberSwap Quote Results:

🔄 **Swap Details**:
  • Input: ${inputAmount} ${tokenInSymbol} (${tokenInData.name})
  • Output: ${outputAmount} ${tokenOutSymbol} (${tokenOutData.name})
  • Rate: 1 ${tokenInSymbol} → ${(
        Number(outputAmount) / Number(inputAmount)
      ).toFixed(6)} ${tokenOutSymbol}

💰 **USD Values**:
  • Input Value: $${parseFloat(routeSummary.amountInUsd).toFixed(2)}
  • Output Value: $${parseFloat(routeSummary.amountOutUsd).toFixed(2)}
  • Price Impact: ${(
    ((parseFloat(routeSummary.amountInUsd) -
      parseFloat(routeSummary.amountOutUsd)) /
      parseFloat(routeSummary.amountInUsd)) *
    100
  ).toFixed(3)}%

⛽ **Gas Information**:
  • Estimated Gas: ${parseInt(routeSummary.gas).toLocaleString()} units
  • Gas Cost: $${parseFloat(routeSummary.gasUsd).toFixed(4)}

🛣️ **Route Information**:
  • Route ID: ${routeSummary.routeID}
  • DEXes Used: ${routeSummary.route.length} hop(s)
  • Router: ${data.routerAddress}

📊 **Network**: ${platform} (Chain ID: ${chainId})

💡 Use 'executeKyberSwapBySymbol' to perform the actual swap.`;
    } catch (error) {
      console.error("KyberSwap quote error:", error);
      if (
        error instanceof Error &&
        error.message.includes("Could not find contract addresses")
      ) {
        return `❌ ${error.message}`;
      }
      if (axios.isAxiosError(error)) {
        return `❌ Failed to get swap quote: ${
          error.response?.data?.message || error.message
        }

🔧 **Troubleshooting**:
  • Check if tokens exist on the specified platform
  • Ensure sufficient liquidity exists for this pair
  • Try a different amount or platform
  • Use 'checkTokenPlatforms' to verify platform support`;
      }
      return `❌ Unexpected error getting swap quote: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }
  };

  const handleExecuteKyberSwapBySymbol = async ({
    tokenInSymbol,
    tokenOutSymbol,
    amount,
    platform = "ethereum",
    slippageTolerance = DEFAULT_SLIPPAGE,
  }: {
    tokenInSymbol: string;
    tokenOutSymbol: string;
    amount: string;
    platform?: string;
    slippageTolerance?: number;
  }) => {
    if (!isConnected || !address) {
      return "❌ Wallet not connected. Please connect your wallet to execute swaps.";
    }

    try {
      // Step 1: Resolve token addresses using symbols
      console.log(
        `🔍 Step 1: Resolving token addresses for ${tokenInSymbol} → ${tokenOutSymbol}...`
      );
      const { tokenInData, tokenInAddress, tokenOutAddress } =
        await resolveTokenAddresses(tokenInSymbol, tokenOutSymbol, platform);

      // Step 2: Convert platform to chain info
      const chainId = platformToChainId(platform);
      const kyberChainName = getKyberChainName(chainId);

      const tokenInDecimals = tokenInData.decimals || 18;
      const amountInWei = parseUnits(amount, tokenInDecimals).toString();

      // Step 3: Get route using extracted helper
      console.log(`🔍 Step 3: Getting swap route...`);
      const routeData: SwapQuote = await fetchKyberSwapRoute(
        tokenInAddress,
        tokenOutAddress,
        amountInWei,
        kyberChainName
      );

      // Step 4: Build transaction
      console.log(`🔧 Step 4: Building transaction...`, {
        routeSummary: routeData.routeSummary,
        routerAddress: routeData.routerAddress,
      });
      const buildUrl = `${KYBERSWAP_API_BASE}/${kyberChainName}/api/v1/route/build`;
      const buildResponse = await axios.post(
        buildUrl,
        {
          routeSummary: routeData.routeSummary,
          sender: address,
          recipient: address,
          slippageTolerance,
        },
        {
          headers: {
            "x-client-id": DEFAULT_CLIENT_ID,
            "Content-Type": "application/json",
          },
        }
      );

      const swapData: SwapResult = buildResponse.data.data;

      // Step 5: Check if we need approval (for non-native tokens)
      if (tokenInAddress !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        console.log(`🔐 Step 5: Checking token approval...`, swapData);

        // Import the ethers approval function
        const { getTokenApprovalEthers } = await import("@/lib/utils");

        // Get approval for the router contract
        const approvalResult = await getTokenApprovalEthers(
          address,
          tokenInAddress,
          swapData.routerAddress,
          amountInWei
        );

        if (!approvalResult.success) {
          return `❌ Token approval failed: ${
            approvalResult.error?.message || "Unknown error"
          }`;
        }

        if (approvalResult.needsApproval) {
          console.log(
            `✅ Token approval successful! TX: ${approvalResult.txHash}`
          );
        } else {
          console.log(`✅ Token already approved for spending`);
        }
      }

      // Step 6: Execute the swap
      console.log(`🚀 Step 6: Executing swap transaction...`);

      // Get signer for transaction execution
      const { getSigner } = await import("@/lib/utils");
      const signer = await getSigner();

      if (!signer) {
        return `❌ Unable to get wallet signer. Please ensure your wallet is connected.`;
      }

      const signerAddress = await signer.getAddress();

      console.log(`Encoded data: ${swapData.data.substring(0, 50)}...`);
      console.log(`Router contract address: ${swapData.routerAddress}`);

      // Execute the swap transaction
      const executeSwapTx = await signer.sendTransaction({
        to: swapData.routerAddress,
        data: swapData.data,
        from: signerAddress,
      });

      console.log(
        `Swap transaction submitted with hash: ${executeSwapTx.hash}`
      );

      // Wait for transaction confirmation
      const executeSwapTxReceipt = await executeSwapTx.wait();
      console.log(
        `Swap tx executed with hash: ${executeSwapTxReceipt?.blockHash}`
      );

      return `✅ Swap Transaction Executed Successfully!`;
    } catch (error) {
      console.error("KyberSwap execution error:", error);
      if (
        error instanceof Error &&
        error.message.includes("Could not find contract addresses")
      ) {
        return `❌ ${error.message}`;
      }
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        return `❌ Swap execution failed: ${errorMsg}`;
      }
      return `❌ Unexpected error during swap execution: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }
  };

  const handleGetCommonTokens = async ({
    platform = "ethereum",
  }: {
    platform?: string;
  }) => {
    try {
      // Get available platforms to validate input
      const availablePlatforms = await getAvailablePlatforms("simple");
      if (!availablePlatforms.includes(platform)) {
        return `❌ Platform '${platform}' not supported.

✅ **Supported Platforms**: ${availablePlatforms.slice(0, 10).join(", ")}${
          availablePlatforms.length > 10
            ? `, and ${availablePlatforms.length - 10} more...`
            : ""
        }

💡 Use 'getAvailablePlatforms' to see the complete list.`;
      }

      // Common token symbols to look up
      const commonSymbols = [
        "ETH",
        "WETH",
        "USDC",
        "USDT",
        "DAI",
        "WBTC",
        "UNI",
        "KNC",
      ];
      const tokenResults = [];

      for (const symbol of commonSymbols) {
        try {
          const tokenData = await getContractAddressWithDecimals(
            symbol,
            platform
          );
          if (tokenData?.address) {
            tokenResults.push({
              symbol,
              name: tokenData.name || symbol,
              address: tokenData.address,
              decimals: tokenData.decimals || 18,
            });
          }
        } catch {
          // Skip tokens that don't exist on this platform
          console.log(`Token ${symbol} not found on ${platform}`);
        }
      }

      if (tokenResults.length === 0) {
        return `❌ No common tokens found on ${platform}.

This could mean:
  • Platform has limited token support
  • CoinGecko API temporary issue
  • Platform name needs adjustment

Try using a major platform like 'ethereum', 'polygon-pos', or 'binance-smart-chain'.`;
      }

      const chainId = platformToChainId(platform);
      const kyberChainName = getKyberChainName(chainId);

      return `🪙 Common Tokens on ${
        platform.charAt(0).toUpperCase() + platform.slice(1)
      }:

📍 **Network Info**:
  • Platform: ${platform}
  • Chain ID: ${chainId}
  • KyberSwap Name: ${kyberChainName}

💰 **Available Tokens**:
${tokenResults
  .map(
    (token) =>
      `  • **${token.symbol}** (${token.name})
    Address: \`${token.address}\`
    Decimals: ${token.decimals}`
  )
  .join("\n\n")}

💡 **Usage Tips**:
  • Use these addresses with KyberSwap actions
  • Native tokens use: \`0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE\`
  • All addresses are verified via CoinGecko

🔄 Ready for trading with KyberSwap Aggregator!`;
    } catch (error) {
      console.error("Common tokens error:", error);
      return `❌ Failed to fetch common tokens: ${
        error instanceof Error ? error.message : "Unknown error"
      }

🔧 Try:
  • Using 'ethereum' as the platform
  • Checking your internet connection
  • Using getAvailablePlatforms to see valid options`;
    }
  };

  // Get Swap Quote by Symbol Action (integrated with CoinGecko)
  useCopilotAction({
    name: "getKyberSwapQuoteBySymbol",
    description:
      "Get a swap quote from KyberSwap Aggregator using token symbols. Automatically fetches token addresses from CoinGecko.",
    parameters: [
      {
        name: "tokenInSymbol",
        type: "string",
        description: "Input token symbol (e.g., 'ETH', 'USDC', 'BTC')",
        required: true,
      },
      {
        name: "tokenOutSymbol",
        type: "string",
        description: "Output token symbol (e.g., 'USDC', 'ETH', 'DAI')",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description:
          "Amount of input token to swap (in token units, e.g., '1.0' for 1 token)",
        required: true,
      },
      {
        name: "platform",
        type: "string",
        description:
          "Blockchain platform (default: 'ethereum'). Use 'checkTokenPlatforms' to see available platforms.",
        required: false,
      },
    ],
    handler: handleGetKyberSwapQuoteBySymbol,
  });

  // Test Simple Render Action
  useCopilotAction({
    name: "testSlippageUI",
    description:
      "Test action to verify renderAndWaitForResponse and slippage UI works",
    parameters: [],
    render: ({ status }) => {
      console.log("Test status:", status);

      return (
        <div className="bg-[#1A1A1A] border border-[#A9A0FF] rounded-[20px] p-6 max-w-md w-full mx-4">
          <div className="text-white text-center mb-4">
            🧪 Slippage UI Test (Status: {status})
          </div>
          <div className="text-gray-300 text-sm mb-4 text-center">
            This tests that renderAndWaitForResponse is working correctly with
            your UI setup.
          </div>
          <div className="flex gap-3">
            <button className="flex-1 bg-[#2E2E2E] text-gray-300 py-2 rounded-lg hover:bg-[#3E3E3E]">
              Cancel
            </button>
            <button className="flex-1 bg-[#A9A0FF] text-white py-2 rounded-lg hover:bg-[#9A8FFF]">
              Confirm
            </button>
          </div>
        </div>
      );
    },
  });

  // Execute Swap by Symbol Action (integrated with CoinGecko) - with Human-in-the-Loop Slippage Selection
  useCopilotAction({
    name: "executeKyberSwapBySymbol",
    description:
      "Execute a token swap using KyberSwap Aggregator with token symbols. Shows slippage selector before execution.",
    parameters: [
      {
        name: "tokenInSymbol",
        type: "string",
        description: "Input token symbol (same as used in quote)",
        required: true,
      },
      {
        name: "tokenOutSymbol",
        type: "string",
        description: "Output token symbol (same as used in quote)",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description: "Amount of input token to swap (same as used in quote)",
        required: true,
      },
      {
        name: "platform",
        type: "string",
        description: "Blockchain platform (default: 'ethereum')",
        required: false,
      },
    ],
    renderAndWaitForResponse: ({ args, respond, status }) => {
      const {
        tokenInSymbol,
        tokenOutSymbol,
        amount,
        platform = "ethereum",
      } = args;

      console.log("Status:", status); // Debug log

      // Show different UI based on status
      if (status === "inProgress") {
        // Type check required parameters
        if (!tokenInSymbol || !tokenOutSymbol || !amount) {
          // Return error state as JSX
          return (
            <div className="bg-[#1A1A1A] border border-red-500/20 rounded-[20px] p-6 max-w-md w-full mx-4">
              <div className="text-red-400 text-center">
                ❌ Missing required parameters for swap execution
              </div>
              <button
                onClick={() => {
                  if (respond) {
                    (respond as (message: string) => void)(
                      "❌ Missing required parameters for swap execution"
                    );
                  }
                }}
                className="w-full mt-4 bg-red-500 text-white py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          );
        }

        // Show slippage selector during inProgress status
        return (
          <SlippageSelector
            tokenInSymbol={tokenInSymbol}
            tokenOutSymbol={tokenOutSymbol}
            amount={amount}
            platform={platform}
            onConfirm={async (slippageTolerance: number) => {
              console.log("Slippage confirmed:", slippageTolerance);
              // Execute the swap with the selected slippage
              const result = await handleExecuteKyberSwapBySymbol({
                tokenInSymbol,
                tokenOutSymbol,
                amount,
                platform,
                slippageTolerance,
              });
              if (respond) {
                (respond as (message: string) => void)(result);
              }
            }}
            onCancel={() => {
              console.log("Swap cancelled");
              if (respond) {
                (respond as (message: string) => void)(
                  "🚫 Swap cancelled by user"
                );
              }
            }}
          />
        );
      }

      if (status === "executing") {
        // Show loading state during execution
        return (
          <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[20px] p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center gap-3 text-[#A9A0FF]">
              <div className="w-4 h-4 border-2 border-[#A9A0FF] border-t-transparent rounded-full animate-spin"></div>
              <div className="text-white font-medium">Executing Swap...</div>
            </div>
            <div className="text-gray-400 text-sm text-center mt-2">
              Processing {amount} {tokenInSymbol} → {tokenOutSymbol} on{" "}
              {platform}
            </div>
          </div>
        );
      }

      if (status === "complete") {
        // Show completion state (this will be brief before result is shown)
        return (
          <div className="bg-[#1A1A1A] border border-green-500/20 rounded-[20px] p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center gap-3 text-green-400">
              <div className="text-lg">✅</div>
              <div className="text-white font-medium">Swap Complete!</div>
            </div>
          </div>
        );
      }

      // Fallback for any other status
      return (
        <div className="bg-[#1A1A1A] border border-gray-500/20 rounded-[20px] p-6 max-w-md w-full mx-4">
          <div className="text-gray-400 text-center">
            Preparing swap... (Status: {status})
          </div>
        </div>
      );
    },
  });

  // Execute Swap Action (renamed and updated to use symbols)
  useCopilotAction({
    name: "executeKyberSwap",
    description:
      "Execute a token swap using KyberSwap Aggregator with token symbols. This performs the actual on-chain transaction.",
    parameters: [
      {
        name: "tokenInSymbol",
        type: "string",
        description: "Input token symbol (e.g., 'ETH', 'USDC', 'BTC')",
        required: true,
      },
      {
        name: "tokenOutSymbol",
        type: "string",
        description: "Output token symbol (e.g., 'USDC', 'ETH', 'DAI')",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description:
          "Amount of input token to swap (in token units, e.g., '1.0' for 1 token)",
        required: true,
      },
      {
        name: "platform",
        type: "string",
        description: "Blockchain platform (default: 'ethereum')",
        required: false,
      },
      {
        name: "slippageTolerance",
        type: "number",
        description:
          "Slippage tolerance in bips (e.g., 50 = 0.5%, 100 = 1%). Default: 50",
        required: false,
      },
    ],
    handler: handleExecuteKyberSwapBySymbol,
  });

  //   // Token Information Action
  //   useCopilotAction({
  //     name: "getTokenInfo",
  //     description:
  //       "Get detailed information about a token including its price, symbol, and basic metadata.",
  //     parameters: [
  //       {
  //         name: "tokenAddress",
  //         type: "string",
  //         description: "Token contract address to get information for",
  //         required: true,
  //       },
  //       {
  //         name: "chainId",
  //         type: "number",
  //         description: "Chain ID where the token exists. Default: 1 (Ethereum)",
  //         required: false,
  //       },
  //     ],
  //     handler: async ({
  //       tokenAddress,
  //       chainId = 1,
  //     }: {
  //       tokenAddress: string;
  //       chainId?: number;
  //     }) => {
  //       try {
  //         // Simple address validation - basic format check
  //         if (
  //           !tokenAddress ||
  //           tokenAddress.length !== 42 ||
  //           !tokenAddress.startsWith("0x")
  //         ) {
  //           return "❌ Invalid token address provided.";
  //         }

  //         const kyberChainName = getKyberChainName(chainId);

  //         // Use a small amount to get token info from the routes API
  //         const url = `${KYBERSWAP_API_BASE}/${kyberChainName}/api/v1/routes`;
  //         const params = {
  //           tokenIn: tokenAddress,
  //           tokenOut: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native token
  //           amountIn: "1000000000000000000", // 1 token (18 decimals)
  //         };

  //         const response = await axios.get(url, {
  //           params,
  //           headers: {
  //             "X-Client-Id": DEFAULT_CLIENT_ID,
  //           },
  //         });

  //         const data = response.data.data;
  //         const routeSummary = data.routeSummary;

  //         const tokenInPrice = parseFloat(routeSummary.amountInUsd);
  //         const tokenSymbol = "TOKEN"; // KyberSwap API doesn't return symbol in route summary

  //         return `🪙 Token Information:

  // 📍 **Basic Details**:
  //   • Address: ${tokenAddress}
  //   • Network: ${
  //     kyberChainName.charAt(0).toUpperCase() + kyberChainName.slice(1)
  //   } (Chain ID: ${chainId})
  //   • Symbol: ${tokenSymbol} (estimated)

  // 💰 **Price Information**:
  //   • USD Value: $${tokenInPrice.toFixed(6)} per token
  //   • Based on current market rates

  // 🔄 **Trading Status**:
  //   • ✅ Available for trading on KyberSwap
  //   • Router: ${data.routerAddress}

  // 📊 **Market Data**:
  //   • Liquidity: Available across multiple DEXes
  //   • Routes: ${routeSummary.route.length} potential path(s)

  // 💡 This token can be swapped using KyberSwap Aggregator for optimal rates.`;
  //       } catch (error) {
  //         console.error("Token info error:", error);
  //         if (axios.isAxiosError(error)) {
  //           if (error.response?.status === 400) {
  //             const chainName = getKyberChainName(chainId);
  //             return `⚠️ Token information not available:

  // This could mean:
  //   • Token doesn't exist on ${chainName} (Chain ID: ${chainId})
  //   • No liquidity available for this token
  //   • Invalid token contract address

  // 🔧 Please verify:
  //   • Token address is correct
  //   • Token exists on the specified chain
  //   • Token has trading liquidity`;
  //           }
  //         }
  //         return `❌ Error fetching token information: ${
  //           error instanceof Error ? error.message : "Unknown error"
  //         }`;
  //       }
  //     },
  //   });

  //   // Common Tokens Helper Action (using CoinGecko)
  //   useCopilotAction({
  //     name: "getCommonTokens",
  //     description:
  //       "Get a list of common token addresses for popular tokens on different platforms using CoinGecko integration.",
  //     parameters: [
  //       {
  //         name: "platform",
  //         type: "string",
  //         description:
  //           "Platform name (default: 'ethereum'). Use getAvailablePlatforms to see all options.",
  //         required: false,
  //       },
  //     ],
  //     handler: handleGetCommonTokens,
  //   });

  //   // Get Available Platforms Action
  //   useCopilotAction({
  //     name: "getAvailablePlatforms",
  //     description:
  //       "Get list of all available blockchain platforms supported by CoinGecko integration",
  //     handler: async () => {
  //       try {
  //         const platforms = await getAvailablePlatforms("simple");
  //         return `🌐 Available Blockchain Platforms (${platforms.length} total):

  // **Popular Platforms**:
  // ${platforms
  //   .slice(0, 15)
  //   .map((platform) => `  • ${platform}`)
  //   .join("\n")}

  // ${
  //   platforms.length > 15
  //     ? `**Additional Platforms**:
  // ${platforms
  //   .slice(15, 30)
  //   .map((platform) => `  • ${platform}`)
  //   .join("\n")}

  // ...and ${platforms.length - 30} more platforms available.`
  //     : ""
  // }

  // 💡 **Common Platform Names**:
  //   • \`ethereum\` - Ethereum Mainnet
  //   • \`polygon-pos\` - Polygon
  //   • \`binance-smart-chain\` - BSC
  //   • \`arbitrum-one\` - Arbitrum
  //   • \`optimistic-ethereum\` - Optimism
  //   • \`avalanche\` - Avalanche C-Chain

  // Use these platform names with other KNC actions for multi-chain token operations.`;
  //       } catch (error) {
  //         return `❌ Failed to fetch available platforms: ${
  //           error instanceof Error ? error.message : "Unknown error"
  //         }`;
  //       }
  //     },
  //   });

  //   // Swap Preview with Multiple Options
  //   useCopilotAction({
  //     name: "compareSwapOptions",
  //     description:
  //       "Compare swap options for the same token pair with different amounts to help optimize your trade.",
  //     parameters: [
  //       {
  //         name: "tokenIn",
  //         type: "string",
  //         description: "Input token address",
  //         required: true,
  //       },
  //       {
  //         name: "tokenOut",
  //         type: "string",
  //         description: "Output token address",
  //         required: true,
  //       },
  //       {
  //         name: "amounts",
  //         type: "string",
  //         description: "Comma-separated amounts to compare (e.g., '0.1,1,10')",
  //         required: true,
  //       },
  //       {
  //         name: "chainId",
  //         type: "number",
  //         description: "Chain ID for the comparison. Default: 1",
  //         required: false,
  //       },
  //     ],
  //     handler: async ({
  //       tokenIn,
  //       tokenOut,
  //       amounts,
  //       chainId = 1,
  //     }: {
  //       tokenIn: string;
  //       tokenOut: string;
  //       amounts: string;
  //       chainId?: number;
  //     }) => {
  //       try {
  //         const kyberChainName = getKyberChainName(chainId);
  //         const amountArray = amounts.split(",").map((a) => a.trim());

  //         if (amountArray.length > 5) {
  //           return "❌ Maximum 5 amounts can be compared at once.";
  //         }

  //         const comparisons = [];

  //         for (const amount of amountArray) {
  //           try {
  //             const amountInWei = parseUnits(amount, 18).toString();
  //             const url = `${KYBERSWAP_API_BASE}/${kyberChainName}/api/v1/routes`;

  //             const response = await axios.get(url, {
  //               params: {
  //                 tokenIn,
  //                 tokenOut,
  //                 amountIn: amountInWei,
  //               },
  //               headers: {
  //                 "X-Client-Id": DEFAULT_CLIENT_ID,
  //               },
  //             });

  //             const data = response.data.data;
  //             const routeSummary = data.routeSummary;

  //             const outputAmount = formatUnits(
  //               BigInt(routeSummary.amountOut),
  //               18
  //             );
  //             const rate = Number(outputAmount) / Number(amount);

  //             comparisons.push({
  //               input: amount,
  //               output: outputAmount,
  //               rate: rate,
  //               gasUsd: parseFloat(routeSummary.gasUsd),
  //               priceImpact:
  //                 ((parseFloat(routeSummary.amountInUsd) -
  //                   parseFloat(routeSummary.amountOutUsd)) /
  //                   parseFloat(routeSummary.amountInUsd)) *
  //                 100,
  //             });
  //           } catch {
  //             comparisons.push({
  //               input: amount,
  //               output: "Error",
  //               rate: 0,
  //               gasUsd: 0,
  //               priceImpact: 0,
  //             });
  //           }
  //         }

  //         const comparisonText = comparisons
  //           .map((comp, index) => {
  //             if (comp.output === "Error") {
  //               return `${index + 1}. Amount: ${
  //                 comp.input
  //               } → ❌ Error getting quote`;
  //             }
  //             return `${index + 1}. Amount: ${comp.input} tokens
  //    → Output: ${parseFloat(comp.output).toFixed(6)} tokens
  //    → Rate: 1:${comp.rate.toFixed(6)}
  //    → Gas: $${comp.gasUsd.toFixed(4)}
  //    → Price Impact: ${comp.priceImpact.toFixed(3)}%`;
  //           })
  //           .join("\n\n");

  //         // Find best rate
  //         const validComparisons = comparisons.filter(
  //           (c) => c.output !== "Error"
  //         );
  //         const bestRate =
  //           validComparisons.length > 0
  //             ? Math.max(...validComparisons.map((c) => c.rate))
  //             : 0;
  //         const bestIndex = validComparisons.findIndex(
  //           (c) => c.rate === bestRate
  //         );

  //         return `📊 Swap Options Comparison:

  // ${comparisonText}

  // ${
  //   validComparisons.length > 0
  //     ? `
  // 🎯 **Best Rate**: Option ${
  //         validComparisons.indexOf(validComparisons[bestIndex]) + 1
  //       } with rate 1:${bestRate.toFixed(6)}

  // 💡 **Insights**:
  //   • Consider gas costs vs amount when choosing
  //   • Larger amounts may have higher price impact
  //   • Multiple smaller swaps might be more efficient for large amounts
  // `
  //     : "❌ No valid quotes available"
  // }

  // 🔗 Network: ${
  //           kyberChainName.charAt(0).toUpperCase() + kyberChainName.slice(1)
  //         }`;
  //       } catch (error) {
  //         console.error("Comparison error:", error);
  //         return `❌ Error comparing swap options: ${
  //           error instanceof Error ? error.message : "Unknown error"
  //         }`;
  //       }
  //     },
  //   });

  //   // Overview Action
  //   useCopilotAction({
  //     name: "kyberSwapOverview",
  //     description:
  //       "Get a comprehensive overview of all available KyberSwap actions and supported features.",
  //     parameters: [],
  //     handler: async () => {
  //       const isWalletConnected = isConnected && address;

  //       return `🌐 KyberSwap Aggregator - Complete Integration Overview

  // ${isWalletConnected ? "✅" : "❌"} Wallet Status: ${
  //         isWalletConnected ? `Connected (${address})` : "Not Connected"
  //       }

  // 📋 **Available Actions**:

  // 🔍 **Quote & Analysis** (getKyberSwapQuote)
  //    • Get best swap rates across multiple DEXes
  //    • Compare prices and routes before trading
  //    • View gas costs and price impact

  // ⚡ **Execute Swaps** (executeKyberSwap)
  //    • Perform actual token swaps on-chain
  //    • Customizable slippage tolerance
  //    • Automatic route optimization

  // 🪙 **Token Information** (getTokenInfo)
  //    • Get token prices and metadata
  //    • Check trading availability
  //    • Verify token contracts

  // 📊 **Common Tokens** (getCommonTokens)
  //    • Access popular token addresses
  //    • Support for multiple chains
  //    • Quick reference for major tokens

  // 📈 **Compare Options** (compareSwapOptions)
  //    • Compare different swap amounts
  //    • Find optimal trading sizes
  //    • Analyze rate efficiency

  // 🌍 **Supported Networks**:
  //    • Ethereum (ETH) - Chain ID: 1
  //    • Polygon (MATIC) - Chain ID: 137
  //    • BSC (BNB) - Chain ID: 56
  //    • Arbitrum (ETH) - Chain ID: 42161
  //    • Optimism (ETH) - Chain ID: 10
  //    • Avalanche (AVAX) - Chain ID: 43114
  //    • Base (ETH) - Chain ID: 8453
  //    • And many more...

  // 🔧 **Key Features**:
  //    • Aggregates liquidity from 100+ DEXes
  //    • Finds optimal swap routes automatically
  //    • Minimal price impact through smart routing
  //    • Gas-optimized transactions
  //    • MEV protection capabilities

  // 💰 **Benefits**:
  //    • Best rates across all DEXes
  //    • Single transaction execution
  //    • Reduced gas costs through batching
  //    • Higher success rates
  //    • Real-time pricing

  // 🎯 **Quick Start Guide**:
  //    1. Use 'getCommonTokens' to find token addresses
  //    2. Get quotes with 'getKyberSwapQuote'
  //    3. Compare options with 'compareSwapOptions'
  //    4. Execute swaps with 'executeKyberSwap'

  // ${
  //   !isWalletConnected
  //     ? "\n⚠️  **Note:** Connect your wallet to access swap execution features!"
  //     : "\n🚀 **Ready to trade!** All features available with your connected wallet."
  // }

  // 🔗 **Resources**:
  //    • KyberSwap: https://kyberswap.com
  //    • Documentation: https://docs.kyberswap.com
  //    • Analytics: https://analytics.kyberswap.com

  // 💡 **Pro Tip**: Always compare quotes and check gas costs before executing large swaps!`;
  //     },
  //   });

  // Test UI Component
  return (
    // <div className="flex flex-col gap-4 p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
    //   <div className="flex items-center gap-3">
    //     <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
    //       <span className="text-white font-bold text-sm">K</span>
    //     </div>
    //     <h2 className="text-2xl font-bold text-gray-800">
    //       KyberSwap Aggregator
    //     </h2>
    //   </div>

    //   <div className="text-gray-600 mb-4">
    //     Comprehensive token swapping integration with KyberSwap&apos;s
    //     aggregator for optimal rates across 100+ DEXes on multiple chains.
    //   </div>

    //   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    //     <div className="bg-white p-4 rounded-lg shadow-sm border">
    //       <h3 className="font-semibold text-gray-800 mb-2">
    //         🔍 Trading Actions
    //       </h3>
    //       <ul className="text-sm text-gray-600 space-y-1">
    //         <li>• Get Swap Quotes (getKyberSwapQuote)</li>
    //         <li>• Execute Swaps (executeKyberSwap)</li>
    //         <li>• Compare Options (compareSwapOptions)</li>
    //         <li>• Token Information (getTokenInfo)</li>
    //       </ul>
    //     </div>

    //     <div className="bg-white p-4 rounded-lg shadow-sm border">
    //       <h3 className="font-semibold text-gray-800 mb-2">
    //         🌐 Multi-Chain Support
    //       </h3>
    //       <ul className="text-sm text-gray-600 space-y-1">
    //         <li>• Ethereum, Polygon, BSC</li>
    //         <li>• Arbitrum, Optimism, Base</li>
    //         <li>• Avalanche, Fantom, Linea</li>
    //         <li>• Common Tokens (getCommonTokens)</li>
    //       </ul>
    //     </div>
    //   </div>

    //   <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
    //     <button className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-3 transition-colors text-sm font-medium">
    //       📊 100+ DEXes
    //     </button>
    //     <button className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-3 transition-colors text-sm font-medium">
    //       ⚡ Optimal Routes
    //     </button>
    //     <button className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg p-3 transition-colors text-sm font-medium">
    //       🌍 Multi-Chain
    //     </button>
    //     <button
    //       onClick={testSwap}
    //       className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-3 transition-colors text-sm font-medium"
    //     >
    //       🔒 MEV Protection
    //     </button>
    //   </div>

    //   {!isConnected && (
    //     <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
    //       <div className="flex items-center gap-2">
    //         <span className="text-lg">⚠️</span>
    //         <span className="font-medium">
    //           Connect your wallet to execute swaps and access all trading
    //           features
    //         </span>
    //       </div>
    //     </div>
    //   )}

    //   {isConnected && (
    //     <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
    //       <div className="flex items-center gap-2">
    //         <span className="text-lg">✅</span>
    //         <span className="font-medium">
    //           Wallet connected! All KyberSwap features are available.
    //         </span>
    //       </div>
    //       <div className="text-sm mt-1 text-green-700">
    //         Connected as: {address}
    //       </div>
    //     </div>
    //   )}

    //   <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
    //     <h4 className="font-semibold text-green-800 mb-2">
    //       🚀 Quick Start Guide
    //     </h4>
    //     <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
    //       <li>
    //         Ask for &ldquo;kyberSwapOverview&rdquo; to see all capabilities
    //       </li>
    //       <li>
    //         Use &ldquo;getCommonTokens&rdquo; to find popular token addresses
    //       </li>
    //       <li>
    //         Get quotes with &ldquo;getKyberSwapQuote&rdquo; before swapping
    //       </li>
    //       <li>
    //         Compare amounts with &ldquo;compareSwapOptions&rdquo; for
    //         optimization
    //       </li>
    //       <li>
    //         Execute swaps with &ldquo;executeKyberSwap&rdquo; for best rates
    //       </li>
    //     </ol>
    //   </div>

    //   <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
    //     <h4 className="font-semibold text-blue-800 mb-2">💡 Pro Features</h4>
    //     <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
    //       <li>**Smart Routing**: Automatic best path finding across DEXes</li>
    //       <li>**Gas Optimization**: Minimized transaction costs</li>
    //       <li>**Price Impact**: Real-time slippage calculations</li>
    //       <li>**Multi-Hop**: Complex routes for better rates</li>
    //       <li>**Cross-Chain**: Support for 15+ blockchain networks</li>
    //     </ul>
    //   </div>
    // </div>
    // <button
    //   onClick={testSwap}
    //   className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-3 transition-colors text-sm font-medium"
    // >
    //   🔒 MEV Protection
    // </button>
    null
  );
};

export default Knc;

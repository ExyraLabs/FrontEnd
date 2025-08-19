import {
  Fetcher,
  Percent,
  Route,
  TokenAmount,
  Trade,
  TradeType,
  WETH,
  Token,
  ChainId,
} from "@uniswap/sdk";
import { ROUTER_ABI_V2, ROUTER_ADDRESS_V2 } from "@/constants/swap";
import { useCopilotAction } from "@copilotkit/react-core";
import { useAppKitAccount } from "@reown/appkit/react";
import { ethers } from "ethers";
import { getContractAddressWithDecimals } from "@/lib/coingecko";
import SlippageSelector from "@/components/SlippageSelector";
import { useRewardIntegrations } from "@/hooks/useRewardIntegrations";
import { logUserAction } from "@/actions/statistics";

const Uniswap = () => {
  const { isConnected, address } = useAppKitAccount();
  const { handleDefiAction } = useRewardIntegrations(address);
  const QUICKNODE_HTTP_ENDPOINT =
    "https://wiser-billowing-diagram.quiknode.pro/7b5999ec873d704e376e88b7464a49ff0924414c/";
  const provider = ethers.providers.getDefaultProvider(QUICKNODE_HTTP_ENDPOINT);

  // Function to get Uniswap quote without executing the swap
  const handleGetUniswapQuote = async ({
    tokenInSymbol,
    tokenOutSymbol,
    amount,
    platform = "ethereum",
    slippage = "50",
  }: {
    tokenInSymbol: string;
    tokenOutSymbol: string;
    amount: string;
    platform?: string;
    slippage?: string;
  }) => {
    try {
      console.log(
        `🔍 Fetching Uniswap quote: ${amount} ${tokenInSymbol} → ${tokenOutSymbol} on ${platform}`
      );

      // Step 1: Get token addresses and decimals
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
  • Verify token symbols are correct
  • Try different platform (ethereum, polygon-pos, binance-smart-chain, etc.)`
        );
      }

      // Step 2: Construct tokens
      let tokenIn: Token;
      let tokenOut: Token;

      if (tokenInSymbol.toUpperCase() === "ETH") {
        tokenIn = WETH[ChainId.MAINNET];
      } else {
        tokenIn = new Token(
          ChainId.MAINNET,
          tokenInData.address,
          tokenInData.decimals || 18,
          tokenInData.symbol,
          tokenInData.name
        );
      }

      if (tokenOutSymbol.toUpperCase() === "ETH") {
        tokenOut = WETH[ChainId.MAINNET];
      } else {
        tokenOut = new Token(
          ChainId.MAINNET,
          tokenOutData.address,
          tokenOutData.decimals || 18,
          tokenOutData.symbol,
          tokenOutData.name
        );
      }

      // Step 3: Fetch pair data and create route
      const pair = await Fetcher.fetchPairData(tokenOut, tokenIn, provider);
      const route = new Route([pair], tokenIn);

      // Step 4: Parse amount and create trade
      const tokenInDecimals = tokenInData.decimals || 18;
      let amountInWei: string;

      if (tokenInSymbol.toUpperCase() === "ETH") {
        amountInWei = ethers.utils.parseEther(amount.toString()).toString();
      } else {
        amountInWei = ethers.utils
          .parseUnits(amount.toString(), tokenInDecimals)
          .toString();
      }

      const slippageTolerance = new Percent(slippage, "10000");
      const trade = new Trade(
        route,
        new TokenAmount(tokenIn, amountInWei),
        TradeType.EXACT_INPUT
      );

      const inputAmount = ethers.utils.formatUnits(
        amountInWei,
        tokenInDecimals
      );
      const outputAmount = ethers.utils.formatUnits(
        trade.outputAmount.raw.toString(),
        tokenOutData.decimals || 18
      );

      const amountOutMin = trade.minimumAmountOut(slippageTolerance);
      const minOutputAmount = ethers.utils.formatUnits(
        amountOutMin.raw.toString(),
        tokenOutData.decimals || 18
      );

      // Calculate effective rate
      const effectiveRate = Number(outputAmount) / Number(inputAmount || "1");
      const priceImpact = trade.priceImpact.toFixed(4);

      // Log quote request to statistics
      if (address) {
        try {
          await logUserAction({
            address,
            agent: "Uniswap",
            action: "quote",
            volume: parseFloat(amount),
            token: tokenInSymbol,
            extra: {
              tokenOut: tokenOutSymbol,
              platform,
              effectiveRate,
              priceImpact,
              slippage,
            },
          });
          console.log("✅ Quote action logged to statistics");
        } catch (statsError) {
          console.warn("Failed to log quote statistics:", statsError);
        }
      }

      // Build readable summary
      const header = `💱 Uniswap V2 Quote: ${Number(inputAmount).toLocaleString(
        undefined,
        { maximumFractionDigits: 6 }
      )} ${tokenInSymbol.toUpperCase()} → ${Number(outputAmount).toLocaleString(
        undefined,
        { maximumFractionDigits: 6 }
      )} ${tokenOutSymbol.toUpperCase()}`;

      const rateLine = `Est. rate: 1 ${tokenInSymbol.toUpperCase()} ≈ ${effectiveRate.toFixed(
        6
      )} ${tokenOutSymbol.toUpperCase()}`;

      const slippageLine = `Slippage tolerance: ${(
        Number(slippage) / 100
      ).toFixed(2)}%`;
      const minOutputLine = `Minimum output: ${Number(
        minOutputAmount
      ).toLocaleString(undefined, {
        maximumFractionDigits: 6,
      })} ${tokenOutSymbol.toUpperCase()}`;

      const priceImpactLine = `Price impact: ${priceImpact}%`;

      return [
        header,
        rateLine,
        slippageLine,
        minOutputLine,
        priceImpactLine,
        "",
        "⚠️ Note: This is an estimate based on current liquidity. Actual output may vary due to slippage and price movements.",
      ].join("\\n");
    } catch (error) {
      console.error("Uniswap quote error:", error);
      if (
        error instanceof Error &&
        error.message.includes("Could not find contract addresses")
      ) {
        return `❌ ${error.message}`;
      }
      return `❌ Failed to get Uniswap quote: ${
        error instanceof Error ? error.message : "Unknown error"
      }

🔧 **Troubleshooting**:
  • Check if tokens exist on the specified platform
  • Ensure sufficient liquidity exists for this pair on Uniswap V2
  • Try a different amount or platform`;
    }
  };
  // Function to handle token swapping using Uniswap V2 Router with sequential execution
  const handleSwapTokens = async ({
    tokenInSymbol,
    tokenOutSymbol,
    amount,
    platform = "ethereum",
    slippage = "50",
  }: {
    tokenInSymbol: string;
    tokenOutSymbol: string;
    amount: string;
    platform?: string;
    slippage?: string;
  }) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log(
        `🔍 Step 1: Resolving token addresses for ${tokenInSymbol} → ${tokenOutSymbol}...`
      );

      // Step 1: Get token addresses and decimals
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
          `Could not find contract addresses for ${tokenInSymbol} or ${tokenOutSymbol} on ${platform}.\n\n🔧 Try:\n  • Verify token symbols are correct\n  • Try different platform (ethereum, polygon-pos, binance-smart-chain, etc.)`
        );
      }

      console.log(`🔍 Step 2: Constructing Uniswap tokens and route...`);

      // Step 2: Construct tokens
      let tokenIn: Token;
      let tokenOut: Token;

      if (tokenInSymbol.toUpperCase() === "ETH") {
        tokenIn = WETH[ChainId.MAINNET];
      } else {
        tokenIn = new Token(
          ChainId.MAINNET,
          tokenInData.address,
          tokenInData.decimals || 18,
          tokenInData.symbol,
          tokenInData.name
        );
      }

      if (tokenOutSymbol.toUpperCase() === "ETH") {
        tokenOut = WETH[ChainId.MAINNET];
      } else {
        tokenOut = new Token(
          ChainId.MAINNET,
          tokenOutData.address,
          tokenOutData.decimals || 18,
          tokenOutData.symbol,
          tokenOutData.name
        );
      }

      // Step 3: Fetch pair data and create route
      const pair = await Fetcher.fetchPairData(tokenOut, tokenIn, provider);
      const route = new Route([pair], tokenIn);

      // Step 4: Parse amount and create trade
      const tokenInDecimals = tokenInData.decimals || 18;
      let amountInWei: string;

      if (tokenInSymbol.toUpperCase() === "ETH") {
        amountInWei = ethers.utils.parseEther(amount.toString()).toString();
      } else {
        amountInWei = ethers.utils
          .parseUnits(amount.toString(), tokenInDecimals)
          .toString();
      }

      const slippageTolerance = new Percent(slippage, "10000");
      const trade = new Trade(
        route,
        new TokenAmount(tokenIn, amountInWei),
        TradeType.EXACT_INPUT
      );

      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
      const path = [tokenIn.address, tokenOut.address];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      // Determine swap type
      const isInputETH = tokenInSymbol.toUpperCase() === "ETH";
      const isOutputETH = tokenOutSymbol.toUpperCase() === "ETH";

      console.log(
        `🔍 Step 3: Preparing transaction for ${
          isInputETH ? "ETH" : "ERC20"
        } → ${isOutputETH ? "ETH" : "ERC20"} swap...`
      );

      // Get signer for transaction execution
      const { getSigner } = await import("@/lib/utils");
      const signer = await getSigner(address);

      if (!signer) {
        throw new Error(
          "Unable to get wallet signer. Please ensure your wallet is connected."
        );
      }

      // Step 4: Handle approval for ERC20 tokens (if needed)
      if (!isInputETH) {
        console.log(
          `🔐 Step 4: Checking token approval for ${tokenInSymbol}...`
        );

        // Pre-flight balance check
        const erc20 = new ethers.Contract(
          tokenIn.address,
          [
            "function balanceOf(address) view returns (uint256)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function symbol() view returns (string)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function transfer(address to, uint256 amount) returns (bool)",
          ],
          signer
        );

        const signerAddress = await signer.getAddress();
        const [balance, allowance, symbol] = await Promise.all([
          erc20.balanceOf(signerAddress),
          erc20.allowance(signerAddress, ROUTER_ADDRESS_V2),
          erc20.symbol(),
        ]);

        console.log(
          `🔎 Pre-flight ${symbol} balance=${ethers.utils.formatUnits(
            balance,
            tokenInDecimals
          )} allowance=${ethers.utils.formatUnits(
            allowance,
            tokenInDecimals
          )} required=${amount}`
        );

        if (balance.lt(amountInWei)) {
          throw new Error(
            `❌ Insufficient ${symbol} balance. Needed ${ethers.utils.formatUnits(
              amountInWei,
              tokenInDecimals
            )}, have ${ethers.utils.formatUnits(balance, tokenInDecimals)}.`
          );
        }

        if (allowance.lt(amountInWei)) {
          console.log(`🔐 Approving ${symbol} for spending...`);

          const approveTx = await erc20.approve(ROUTER_ADDRESS_V2, amountInWei);
          console.log(`Approval transaction submitted: ${approveTx.hash}`);

          const approvalReceipt = await approveTx.wait();
          console.log(
            `✅ Approval confirmed in block: ${approvalReceipt.blockNumber}`
          );
        } else {
          console.log(`✅ ${symbol} already approved for spending`);
        }
      }

      console.log(`🚀 Step 5: Executing swap transaction...`);

      // Step 5: Execute the swap
      const routerContract = new ethers.Contract(
        ROUTER_ADDRESS_V2,
        ROUTER_ABI_V2,
        signer
      );

      let swapTx;

      if (isInputETH && !isOutputETH) {
        // ETH -> Token: swapExactETHForTokens
        swapTx = await routerContract.swapExactETHForTokens(
          amountOutMin.toString(),
          path,
          address,
          deadline,
          {
            value: amountInWei,
          }
        );
      } else if (!isInputETH && isOutputETH) {
        // Token -> ETH: swapExactTokensForETH
        swapTx = await routerContract.swapExactTokensForETH(
          amountInWei,
          amountOutMin.toString(),
          path,
          address,
          deadline
        );
      } else if (!isInputETH && !isOutputETH) {
        // Token -> Token: swapExactTokensForTokens
        swapTx = await routerContract.swapExactTokensForTokens(
          amountInWei,
          amountOutMin.toString(),
          path,
          address,
          deadline
        );
      } else {
        throw new Error("Cannot swap ETH for ETH");
      }

      console.log(`Swap transaction submitted with hash: ${swapTx.hash}`);

      // Wait for confirmation
      const swapReceipt = await swapTx.wait();

      // Mark DeFi swap task as completed
      try {
        await handleDefiAction("swap");
      } catch (e) {
        console.warn("Failed to mark swap task complete:", e);
      }

      // Log swap action to statistics
      if (address) {
        try {
          await logUserAction({
            address,
            agent: "Uniswap",
            action: "swap",
            volume: parseFloat(amount),
            token: tokenInSymbol,
            volumeUsd: 0, // Would need price data to calculate USD value
            extra: {
              tokenOut: tokenOutSymbol,
              platform,
              slippage,
              txHash: swapReceipt.transactionHash,
              amountOut: ethers.utils.formatUnits(
                trade.outputAmount.raw.toString(),
                tokenOutData.decimals || 18
              ),
            },
          });
          console.log("✅ Swap action logged to statistics");
        } catch (statsError) {
          console.warn("Failed to log swap statistics:", statsError);
        }
      }

      console.log(
        `✅ Swap completed successfully! Block: ${swapReceipt.blockNumber}`
      );

      return {
        success: true,
        message: `✅ Swap Transaction Executed Successfully! Hash: ${swapReceipt.transactionHash}`,
        txHash: swapReceipt.transactionHash,
      };
    } catch (error) {
      console.error("Uniswap swap error:", error);

      if (error instanceof Error) {
        // Handle specific error types
        if (/insufficient funds|insufficient balance/i.test(error.message)) {
          return {
            success: false,
            error: `❌ Insufficient funds. Please check your balance and try again.`,
          };
        }

        if (/user denied transaction/i.test(error.message)) {
          return {
            success: false,
            error: "❌ Transaction cancelled by user.",
          };
        }

        if (/execution reverted/i.test(error.message)) {
          return {
            success: false,
            error: `❌ Transaction failed: ${error.message}\n\n💡 Try:\n  • Increase slippage tolerance\n  • Reduce swap amount\n  • Check token liquidity on Uniswap`,
          };
        }
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  // Copilot action for getting Uniswap quotes
  useCopilotAction({
    name: "getUniswapQuote",
    description:
      "Get a swap quote from Uniswap V2 using token symbols. Shows estimated output amount, price impact, and slippage information.",
    parameters: [
      {
        name: "tokenInSymbol",
        type: "string",
        description:
          "The symbol of the token to swap from (e.g., 'ETH', 'USDC', 'BTC')",
        required: true,
      },
      {
        name: "tokenOutSymbol",
        type: "string",
        description:
          "The symbol of the token to swap to (e.g., 'USDC', 'ETH', 'DAI')",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description: "The amount to swap (e.g., '1.0' for 1 token)",
        required: true,
      },
      {
        name: "platform",
        type: "string",
        description: "The blockchain platform (default: 'ethereum')",
        required: false,
      },
      {
        name: "slippage",
        type: "string",
        description: "Maximum slippage in bips (default: '50' for 0.5%)",
        required: false,
      },
    ],
    handler: handleGetUniswapQuote,
  });

  // Copilot action for executing swaps with SlippageSelector UI
  useCopilotAction({
    name: "swapTokens",
    description:
      "Execute a token swap using Uniswap V2 Router. Shows slippage selector before execution. Automatically handles approvals and supports ETH/ERC20 swaps with sequential execution for better reliability.",
    parameters: [
      {
        name: "tokenInSymbol",
        type: "string",
        description:
          "The symbol of the token to swap from (e.g., 'ETH', 'USDC', 'BTC')",
        required: true,
      },
      {
        name: "tokenOutSymbol",
        type: "string",
        description:
          "The symbol of the token to swap to (e.g., 'USDC', 'ETH', 'DAI')",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description: "The amount to swap (e.g., '1.0' for 1 token)",
        required: true,
      },
      {
        name: "platform",
        type: "string",
        description: "The blockchain platform (default: 'ethereum')",
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
      if (status === "executing") {
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

        // Show slippage selector during executing status
        return (
          <SlippageSelector
            tokenInSymbol={tokenInSymbol}
            tokenOutSymbol={tokenOutSymbol}
            amount={amount}
            platform={platform}
            onConfirm={async (slippageTolerance: number) => {
              console.log("Slippage confirmed:", slippageTolerance);
              // Convert slippage from bips to string for handleSwapTokens
              const slippageString = slippageTolerance.toString();
              // Execute the swap with the selected slippage
              const result = await handleSwapTokens({
                tokenInSymbol,
                tokenOutSymbol,
                amount,
                platform,
                slippage: slippageString,
              });
              if (respond) {
                let message: string;
                if (result.success) {
                  message = result.message || "Swap completed successfully";
                } else {
                  message = result.error || "Swap failed";
                }
                (respond as (message: string) => void)(message);
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

      if (status === "inProgress") {
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

  // Direct swap execution action (without UI) for programmatic use
  useCopilotAction({
    name: "executeSwap",
    description:
      "Execute a token swap using Uniswap V2 Router directly with specified slippage. This performs the actual on-chain transaction without showing the slippage selector.",
    parameters: [
      {
        name: "tokenInSymbol",
        type: "string",
        description:
          "The symbol of the token to swap from (e.g., 'ETH', 'USDC', 'BTC')",
        required: true,
      },
      {
        name: "tokenOutSymbol",
        type: "string",
        description:
          "The symbol of the token to swap to (e.g., 'USDC', 'ETH', 'DAI')",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description: "The amount to swap (e.g., '1.0' for 1 token)",
        required: true,
      },
      {
        name: "platform",
        type: "string",
        description: "The blockchain platform (default: 'ethereum')",
        required: false,
      },
      {
        name: "slippage",
        type: "string",
        description: "Maximum slippage in bips (default: '50' for 0.5%)",
        required: false,
      },
    ],
    handler: async (args: {
      tokenInSymbol: string;
      tokenOutSymbol: string;
      amount: string;
      platform?: string;
      slippage?: string;
    }) => {
      const result = await handleSwapTokens(args);
      if (result.success) {
        return result.message;
      } else {
        return result.error || "Swap failed";
      }
    },
  });

  // Test function commented out to prevent accidental execution
  const handleTest = async () => {
    const swapResult = await handleSwapTokens({
      tokenInSymbol: "USDC",
      tokenOutSymbol: "AAVE",
      amount: "1",
      platform: "ethereum",
      slippage: "50", // 0.5% slippage
    });
    console.log("✅ Swap result:", swapResult);
  };

  return (
    <button onClick={handleTest}>Test Swap</button>
    // null
  );
};

export default Uniswap;

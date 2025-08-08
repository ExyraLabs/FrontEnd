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
import { ERC20_ABI, ROUTER_ABI_V2, ROUTER_ADDRESS_V2 } from "@/constants/swap";
import { useCopilotAction } from "@copilotkit/react-core";
import { useAppKitAccount } from "@reown/appkit/react";
import { BigNumber, ethers } from "ethers";
import { parseUnits } from "viem";
import { useSendCalls } from "wagmi";
import { getContractAddressWithDecimals } from "@/lib/coingecko";

const Uniswap = () => {
  const { isConnected, address } = useAppKitAccount();
  const { sendCalls } = useSendCalls();
  const QUICKNODE_HTTP_ENDPOINT =
    "https://wiser-billowing-diagram.quiknode.pro/7b5999ec873d704e376e88b7464a49ff0924414c/";
  const provider = ethers.providers.getDefaultProvider(QUICKNODE_HTTP_ENDPOINT);
  // Function to handle token swapping using Uniswap V4 Universal Router
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
      // Step 1: Get token addresses and decimals in a single call
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
          `Could not find contract addresses for ${tokenInSymbol} or ${tokenOutSymbol}`
        );
      }

      //construct tokens
      let tokenIn: Token;
      let tokenOut: Token;
      if (tokenInData.symbol === "ETH") {
        tokenIn = WETH[1];
      } else {
        tokenIn = new Token(
          ChainId.MAINNET,
          tokenInData.address,
          tokenInData.decimals || 18,
          tokenInData.symbol,
          tokenInData.name
        );
      }

      if (tokenOutData.symbol === "ETH") {
        tokenOut = WETH[1];
      } else {
        tokenOut = new Token(
          ChainId.MAINNET,
          tokenOutData.address,
          tokenOutData.decimals || 18,
          tokenOutData.symbol,
          tokenOutData.name
        );
      }

      const pair = await Fetcher.fetchPairData(tokenOut, tokenIn, provider); //creating instances of a pair
      // console.log("Pair fetched:", pair);
      // return;
      const route = new Route([pair], tokenIn); // a fully specified path from input token to output token

      // Parse the amount according to the input token's decimals
      let amountIn: BigNumber | string;
      if (tokenInData.symbol === "ETH") {
        amountIn = ethers.utils.parseEther(amount.toString());
      } else {
        amountIn = ethers.utils.parseUnits(
          amount.toString(),
          tokenInData.decimals || 18
        );
      }
      amountIn = amountIn.toString();

      const slippageTolerance = new Percent(slippage, "10000"); // 50 bips, or 0.50% - Slippage tolerance
      console.log(route);
      const trade = new Trade( //information necessary to create a swap transaction.
        route,
        new TokenAmount(tokenIn, amountIn),
        TradeType.EXACT_INPUT
      );

      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
      const amountOutMinHex = ethers.BigNumber.from(
        amountOutMin.toString()
      ).toHexString();
      const path = [tokenIn.address, tokenOut.address]; //An array of token addresses
      const to = address; // should be a checksummed recipient address
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
      const value = trade.inputAmount.raw; // // needs to be converted to e.g. hex
      const valueHex = ethers.BigNumber.from(value.toString()).toHexString(); //convert to hex string
      const maxApproval = parseUnits(
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        0
      ); // Max uint256

      // Determine which swap function to use based on input/output tokens
      const isInputETH = tokenInData.symbol === "ETH";
      const isOutputETH = tokenOutData.symbol === "ETH";

      type Call = {
        to: `0x${string}`;
        abi: typeof ERC20_ABI | typeof ROUTER_ABI_V2;
        functionName: string;
        args?: (bigint | `0x${string}` | `0x${string}`[])[];
        value?: bigint;
      };

      let calls: Call[] = [];

      if (isInputETH && !isOutputETH) {
        // ETH -> Token: swapExactETHForTokens
        calls = [
          {
            to: tokenIn.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [ROUTER_ADDRESS_V2, maxApproval],
          },
          {
            to: ROUTER_ADDRESS_V2 as `0x${string}`,
            abi: ROUTER_ABI_V2,
            functionName: "swapExactETHForTokens",
            args: [
              BigInt(amountOutMinHex),
              path as `0x${string}`[],
              to as `0x${string}`,
              BigInt(deadline),
            ],
            value: BigInt(valueHex), // Send ETH value
          },
        ];
      } else if (!isInputETH && isOutputETH) {
        // Token -> ETH: swapExactTokensForETH
        calls = [
          {
            to: tokenIn.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [
              ROUTER_ADDRESS_V2 as `0x${string}`,
              BigInt(amountIn), // Only approve the exact amount needed
            ],
          },
          {
            to: ROUTER_ADDRESS_V2 as `0x${string}`,
            abi: ROUTER_ABI_V2,
            functionName: "swapExactTokensForETH",
            args: [
              BigInt(amountIn),
              BigInt(amountOutMinHex),
              path as `0x${string}`[],
              to as `0x${string}`,
              BigInt(deadline),
            ],
          },
        ];
      } else if (!isInputETH && !isOutputETH) {
        // Token -> Token: swapExactTokensForTokens
        calls = [
          {
            to: tokenIn.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [
              ROUTER_ADDRESS_V2 as `0x${string}`,
              BigInt(amountIn), // Only approve the exact amount needed
            ],
          },
          {
            to: ROUTER_ADDRESS_V2 as `0x${string}`,
            abi: ROUTER_ABI_V2,
            functionName: "swapExactTokensForTokens",
            args: [
              BigInt(amountIn),
              BigInt(amountOutMinHex),
              path as `0x${string}`[],
              to as `0x${string}`,
              BigInt(deadline),
            ],
          },
        ];
      } else {
        // ETH -> ETH (shouldn't happen, but handle gracefully)
        throw new Error("Cannot swap ETH for ETH");
      }

      // Use wagmi's sendCalls hook to handle the transaction with wallet popup
      sendCalls({
        calls,
      });

      console.log(
        "Swap transaction submitted - check your wallet for confirmation"
      );

      return {
        success: true,
        message:
          "Swap transaction submitted successfully - check your wallet for confirmation",
      };
    } catch (error) {
      console.error("Swap failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  useCopilotAction({
    name: "swapTokens",
    description:
      "Swap tokens using Uniswap V4 Universal Router. Automatically fetches token contract addresses from CoinGecko and handles approvals.",
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
        description: "Maximum slippage percentage (default: '0.5' for 0.5%)",
        required: false,
      },
    ],
    handler: handleSwapTokens,
  });

  const handleTest = async () => {
    const swapResult = await handleSwapTokens({
      tokenInSymbol: "SKYOPS",
      tokenOutSymbol: "ETH",
      amount: "7580",
      platform: "ethereum",
    });
    console.log("✅ Swap result:", swapResult);
  };

  return <button onClick={handleTest}>Test Swap</button>;
};

export default Uniswap;

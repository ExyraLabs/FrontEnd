"use client";
import { chainId, Market, Reserve, useAaveMarkets } from "@aave/react";
import {
  useCopilotAction,
  useCopilotAdditionalInstructions,
} from "@copilotkit/react-core";
import { ExtendedReserve } from "@/lib/utils";
import { useMemo } from "react";
import { useWalletClient } from "wagmi";
import { bigDecimal, evmAddress, useSupply } from "@aave/react";
import { useSendTransaction, useERC20Permit } from "@aave/react/viem";
import { logUserAction } from "@/actions/statistics";
import { getTokenUsdPrice } from "@/lib/pricing";

const Aave = () => {
  const { data: walletClient } = useWalletClient();
  const userAddr = walletClient?.account?.address;
  const { data } = useAaveMarkets({
    chainIds: [chainId(1)],
    user: userAddr ? evmAddress(userAddr) : undefined,
  });
  const [supply] = useSupply();
  const [sendTransaction] = useSendTransaction(walletClient);
  const [signPermit] = useERC20Permit(walletClient);

  // Flatten all reserves from all markets for unified display
  const allReserves = useMemo(() => {
    if (!data) return [];

    const reserves: ExtendedReserve[] = [];
    data.forEach((market: Market) => {
      // Add supply reserves
      market.supplyReserves?.forEach((reserve: Reserve) => {
        reserves.push({
          ...reserve,
          type: "supply",
          marketName: market.name || "Unknown Market",
        });
      });

      // Add borrow reserves
      market.borrowReserves?.forEach((reserve) => {
        reserves.push({
          ...reserve,
          type: "borrow",
          marketName: market.name || "Unknown Market",
        });
      });
    });

    return reserves;
  }, [data]);

  useCopilotAdditionalInstructions({
    instructions:
      "Make sure to use the connect wallet for transactions except an address is specifically provided",
  });

  // CopilotKit Actions for Aave Market Analysis

  // // Action 1: Find ETH-related reserves
  // useCopilotAction({
  //   name: "findEthRelatedReserves",
  //   description:
  //     "Find all Aave reserves that include ETH, WETH, stETH, or other Ethereum-related tokens",
  //   parameters: [
  //     {
  //       name: "includeStaking",
  //       type: "boolean",
  //       description:
  //         "Include staking derivatives like stETH, rETH (default: true)",
  //       required: false,
  //     },
  //   ],
  //   handler: async ({ includeStaking = true }) => {
  //     return findEthRelatedReserves(data || [], { includeStaking });
  //   },
  // });

  // // Action 2: Find highest APY reserves
  // useCopilotAction({
  //   name: "findHighestApyReserves",
  //   description:
  //     "Find Aave reserves with the highest supply or borrow APY rates",
  //   parameters: [
  //     {
  //       name: "type",
  //       type: "string",
  //       description:
  //         "Type of APY to search for: 'supply' or 'borrow' (default: 'supply')",
  //       required: false,
  //     },
  //     {
  //       name: "limit",
  //       type: "number",
  //       description: "Number of top reserves to return (default: 10)",
  //       required: false,
  //     },
  //     {
  //       name: "minLiquidity",
  //       type: "number",
  //       description: "Minimum USD liquidity to filter results (default: 0)",
  //       required: false,
  //     },
  //   ],
  //   handler: async ({ type = "supply", limit = 10, minLiquidity = 0 }) => {
  //     return findHighestApyReserves(data || [], {
  //       type: type as "supply" | "borrow",
  //       limit,
  //       minLiquidity,
  //     });
  //   },
  // });

  // // Action 3: Find reserves by volume/liquidity
  // useCopilotAction({
  //   name: "findReservesByVolume",
  //   description: "Find Aave reserves filtered by total volume/liquidity in USD",
  //   parameters: [
  //     {
  //       name: "minVolume",
  //       type: "number",
  //       description: "Minimum volume in USD (e.g., 1000000 for $1M)",
  //       required: true,
  //     },
  //     {
  //       name: "maxVolume",
  //       type: "number",
  //       description: "Maximum volume in USD (optional)",
  //       required: false,
  //     },
  //     {
  //       name: "type",
  //       type: "string",
  //       description:
  //         "Filter by 'supply', 'borrow', or 'both' (default: 'both')",
  //       required: false,
  //     },
  //     {
  //       name: "sortBy",
  //       type: "string",
  //       description:
  //         "Sort by 'volume', 'apy', or 'utilization' (default: 'volume')",
  //       required: false,
  //     },
  //   ],
  //   handler: async ({
  //     minVolume,
  //     maxVolume,
  //     type = "both",
  //     sortBy = "volume",
  //   }) => {
  //     return findReservesByVolume(data || [], {
  //       minVolume,
  //       maxVolume,
  //       type: type as "supply" | "borrow" | "both",
  //       sortBy: sortBy as "volume" | "apy" | "utilization",
  //     });
  //   },
  // });

  // // Action 4: Market statistics and overview
  // useCopilotAction({
  //   name: "getAaveMarketStats",
  //   description:
  //     "Get comprehensive statistics and overview of all Aave markets",
  //   parameters: [
  //     {
  //       name: "includeDetails",
  //       type: "boolean",
  //       description: "Include detailed breakdown by market (default: false)",
  //       required: false,
  //     },
  //   ],
  //   handler: async ({ includeDetails = false }) => {
  //     return getAaveMarketStats(data || [], { includeDetails });
  //   },
  // });

  // // Action 5: Find reserves with specific characteristics
  // useCopilotAction({
  //   name: "findReservesByCharacteristics",
  //   description:
  //     "Find Aave reserves with specific characteristics like high utilization, low LTV, flash loan support, etc.",
  //   parameters: [
  //     {
  //       name: "minUtilization",
  //       type: "number",
  //       description: "Minimum utilization rate percentage (0-100)",
  //       required: false,
  //     },
  //     {
  //       name: "maxUtilization",
  //       type: "number",
  //       description: "Maximum utilization rate percentage (0-100)",
  //       required: false,
  //     },
  //     {
  //       name: "flashLoanEnabled",
  //       type: "boolean",
  //       description: "Filter by flash loan support",
  //       required: false,
  //     },
  //     {
  //       name: "minLTV",
  //       type: "number",
  //       description: "Minimum Loan-to-Value ratio percentage",
  //       required: false,
  //     },
  //     {
  //       name: "maxLTV",
  //       type: "number",
  //       description: "Maximum Loan-to-Value ratio percentage",
  //       required: false,
  //     },
  //     {
  //       name: "excludeFrozen",
  //       type: "boolean",
  //       description: "Exclude frozen or paused reserves (default: true)",
  //       required: false,
  //     },
  //   ],
  //   handler: async ({
  //     minUtilization,
  //     maxUtilization,
  //     flashLoanEnabled,
  //     minLTV,
  //     maxLTV,
  //     excludeFrozen = true,
  //   }) => {
  //     return findReservesByCharacteristics(data || [], {
  //       minUtilization,
  //       maxUtilization,
  //       flashLoanEnabled,
  //       minLTV,
  //       maxLTV,
  //       excludeFrozen,
  //     });
  //   },
  // });

  // // Action 6: Find suitable supply reserves
  // useCopilotAction({
  //   name: "findSuitableSupplyReserves",
  //   description:
  //     "Find Aave reserves suitable for supply/deposit operations based on user criteria",
  //   parameters: [
  //     {
  //       name: "minApy",
  //       type: "number",
  //       description: "Minimum supply APY percentage required",
  //       required: false,
  //     },
  //     {
  //       name: "maxRisk",
  //       type: "string",
  //       description: "Maximum risk tolerance: low, medium, or high",
  //       required: false,
  //     },
  //     {
  //       name: "includeNative",
  //       type: "boolean",
  //       description: "Include native token supply options (default: true)",
  //       required: false,
  //     },
  //     {
  //       name: "minLiquidity",
  //       type: "number",
  //       description: "Minimum total liquidity in USD",
  //       required: false,
  //     },
  //   ],
  //   handler: async ({ minApy, maxRisk, includeNative, minLiquidity }) => {
  //     return findSuitableSupplyReserves(data || [], {
  //       minApy,
  //       maxRisk: maxRisk as "low" | "medium" | "high",
  //       includeNative,
  //       minLiquidity,
  //     });
  //   },
  // });

  // // Action 7: Analyze specific reserve for supply
  // useCopilotAction({
  //   name: "analyzeSupplyReserve",
  //   description:
  //     "Get detailed analysis of a specific reserve for supply operations including risk assessment, yield calculations, and implementation guidance",
  //   parameters: [
  //     {
  //       name: "symbol",
  //       type: "string",
  //       description: "Token symbol to analyze (e.g., ETH, USDC, DAI)",
  //       required: false,
  //     },
  //     {
  //       name: "address",
  //       type: "string",
  //       description: "Token contract address to analyze",
  //       required: false,
  //     },
  //     {
  //       name: "amount",
  //       type: "string",
  //       description: "Amount to supply for specific calculations",
  //       required: false,
  //     },
  //     {
  //       name: "userAddress",
  //       type: "string",
  //       description: "User address for personalized limits and analysis",
  //       required: false,
  //     },
  //   ],
  //   handler: async ({ symbol, address, amount, userAddress }) => {
  //     return analyzeSupplyReserve(data || [], {
  //       symbol,
  //       address,
  //       amount,
  //       userAddress,
  //     });
  //   },
  // });

  // // Action 8: Get supply recommendations
  // useCopilotAction({
  //   name: "getSupplyRecommendations",
  //   description:
  //     "Get personalized supply recommendations based on investment goals and risk tolerance",
  //   parameters: [
  //     {
  //       name: "goal",
  //       type: "string",
  //       description:
  //         "Investment goal: maximize_yield, minimize_risk, balanced, or high_ltv",
  //       required: false,
  //     },
  //     {
  //       name: "amount",
  //       type: "string",
  //       description: "Amount available to supply for tailored recommendations",
  //       required: false,
  //     },
  //     {
  //       name: "preferredTokens",
  //       type: "object",
  //       description: "Array of preferred token symbols to focus on",
  //       required: false,
  //     },
  //     {
  //       name: "riskTolerance",
  //       type: "string",
  //       description:
  //         "Risk tolerance level: conservative, moderate, or aggressive",
  //       required: false,
  //     },
  //   ],
  //   handler: async ({ goal, amount, preferredTokens, riskTolerance }) => {
  //     return getSupplyRecommendations(data || [], {
  //       goal: goal as
  //         | "maximize_yield"
  //         | "minimize_risk"
  //         | "balanced"
  //         | "high_ltv",
  //       amount,
  //       preferredTokens: preferredTokens as string[],
  //       riskTolerance: riskTolerance as
  //         | "conservative"
  //         | "moderate"
  //         | "aggressive",
  //     });
  //   },
  // });

  // Action 9: Prepare supply execution with code generation
  // useCopilotAction({
  //   name: "prepareSupplyExecution",
  //   description:
  //     "Prepare complete supply execution plan with step-by-step instructions and ready-to-use code",
  //   parameters: [
  //     {
  //       name: "symbol",
  //       type: "string",
  //       description: "Token symbol to supply (e.g., ETH, USDC, DAI)",
  //       required: false,
  //     },
  //     {
  //       name: "address",
  //       type: "string",
  //       description: "Token contract address to supply",
  //       required: false,
  //     },
  //     {
  //       name: "amount",
  //       type: "string",
  //       description: "Amount to supply (required)",
  //       required: true,
  //     },
  //     {
  //       name: "userAddress",
  //       type: "string",
  //       description: "User wallet address (required)",
  //       required: true,
  //     },
  //     {
  //       name: "useNative",
  //       type: "boolean",
  //       description: "Use native tokens (ETH instead of WETH) when available",
  //       required: false,
  //     },
  //     {
  //       name: "onBehalfOf",
  //       type: "string",
  //       description: "Supply on behalf of another address (optional)",
  //       required: false,
  //     },
  //     {
  //       name: "usePermit",
  //       type: "boolean",
  //       description:
  //         "Use permit for gasless approval (defaults to true if available)",
  //       required: false,
  //     },
  //   ],
  //   handler: async ({
  //     symbol,
  //     address,
  //     amount,
  //     userAddress,
  //     useNative,
  //     onBehalfOf,
  //     usePermit,
  //   }) => {
  //     const res = analyzeAndPrepareSupply(data || [], {
  //       symbol,
  //       address,
  //       amount,
  //       userAddress,
  //       useNative,
  //       onBehalfOf,
  //       usePermit,
  //     });
  //     console.log(res, "response");
  //     return res;
  //   },
  // });

  // Action 10: Find reserves by token symbol
  useCopilotAction({
    name: "FindingReserves",
    description:
      "Find and return all reserves that match a given token symbol (case-insensitive)",
    parameters: [
      {
        name: "symbol",
        type: "string",
        description: "Token symbol to search for (e.g., WETH, USDC, DAI)",
        required: true,
      },
      {
        name: "type",
        type: "string",
        description:
          "Filter by 'supply', 'borrow', or 'both' (default: 'both')",
        required: false,
      },
    ],
    handler: async ({ symbol, type = "both" }) => {
      if (!symbol) return [];

      const target = symbol.trim().toUpperCase();
      let results = (allReserves || []).filter(
        (r) => r?.underlyingToken?.symbol?.toUpperCase?.() === target
      );

      if (type !== "both") {
        results = results.filter(
          (r) => r.type === (type as "supply" | "borrow")
        );
      }

      return results;
    },
  });

  // Extracted function to execute a supply transaction so it can be tested directly
  type ExecuteSupplyParams = {
    symbol?: string;
    address?: string;
    amount: string;
    userAddress?: string;
    useNative?: boolean;
    usePermit?: boolean;
    onBehalfOf?: string;
  };

  // Utility to safely log user actions to server (non-blocking)
  const safeLog = async (params: Parameters<typeof logUserAction>[0]) => {
    try {
      await logUserAction(params);
    } catch {
      // swallow logging errors
    }
  };

  const executeSupplyOperation = async ({
    symbol,
    address,
    amount,
    userAddress,
    useNative = false,
    usePermit = true,
    onBehalfOf,
  }: ExecuteSupplyParams) => {
    try {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return { error: "Invalid amount provided" };
      }

      // Require an active wallet client for signing and sending transactions
      if (!walletClient || !walletClient.account) {
        return {
          error: "Wallet client not available. Please connect your wallet.",
        };
      }

      // Determine sender (connected wallet if not explicitly provided)
      const senderAddress =
        userAddress || walletClient?.account?.address || null;
      if (!senderAddress) {
        return {
          error:
            "No wallet connected. Please connect a wallet or provide userAddress.",
        };
      }

      // Find target reserve (prefer supply reserves)
      const target = (allReserves || []).find((r) => {
        const symbolMatch = symbol
          ? r?.type === "supply" &&
            r?.underlyingToken?.symbol?.toUpperCase?.() ===
              symbol.trim().toUpperCase()
          : false;
        const addressMatch = address
          ? r?.type === "supply" &&
            r?.underlyingToken?.address?.toLowerCase?.() ===
              address.trim().toLowerCase()
          : false;
        return address ? addressMatch : symbolMatch;
      });

      if (!target) {
        return { error: "Reserve not found for the provided symbol/address" };
      }

      if (target.isFrozen) {
        return { error: "Reserve is frozen and cannot accept supply" };
      }
      if (target.isPaused) {
        return { error: "Reserve is paused and cannot accept supply" };
      }
      if (target.userState) {
        const maxSuppliable = target.userState.suppliable?.amount?.value;
        if (!maxSuppliable || parseFloat(maxSuppliable) <= 0) {
          return {
            error:
              "User cannot supply to this reserve (insufficient balance or other restrictions)",
          };
        }
      } else {
        return {
          error:
            "User cannot supply to this reserve (insufficient balance or other restrictions)",
        };
      }

      const targetReserve = target as Reserve;
      const chainIdValue = targetReserve.market?.chain?.chainId;
      const marketAddress = targetReserve.market?.address;
      if (!chainIdValue || !marketAddress) {
        return { error: "Missing market or chain information on reserve" };
      }

      const amountBD = bigDecimal(Number(amount));
      const sender = evmAddress(senderAddress);
      const spender = marketAddress;
      const currency = targetReserve.underlyingToken?.address as string;

      // Helper: execute an Aave execution plan using the tracked sendTransaction
      type ResultReturn = ReturnType<typeof sendTransaction>;
      type LoosePlanAndThenable = {
        andThen: (fn: (val: unknown) => unknown) => unknown;
      };
      const isLoosePlanAndThenable = (x: unknown): x is LoosePlanAndThenable =>
        typeof (x as { andThen?: unknown })?.andThen === "function";

      type TransactionRequestPlan = {
        __typename: "TransactionRequest";
        // plus other fields consumed by sendTransaction
      } & Record<string, unknown>;
      type ApprovalRequiredPlan = {
        __typename: "ApprovalRequired";
        approval: Parameters<typeof sendTransaction>[0];
        originalTransaction: Parameters<typeof sendTransaction>[0];
      };
      type InsufficientBalanceErrorPlan = {
        __typename: "InsufficientBalanceError";
        required?: { value?: unknown };
      };
      type ExecutionPlan =
        | TransactionRequestPlan
        | ApprovalRequiredPlan
        | InsufficientBalanceErrorPlan;

      const execPlan = (plan: ExecutionPlan): ResultReturn | ExecutionPlan => {
        const typename = plan?.__typename;
        switch (typename) {
          case "TransactionRequest":
            return sendTransaction(
              plan as unknown as Parameters<typeof sendTransaction>[0]
            );
          case "ApprovalRequired":
            return sendTransaction(
              (plan as { approval: unknown }).approval as Parameters<
                typeof sendTransaction
              >[0]
            ).andThen(() =>
              sendTransaction(
                (plan as { originalTransaction: unknown })
                  .originalTransaction as Parameters<typeof sendTransaction>[0]
              )
            );
          default:
            return plan;
        }
      };

      const execPlanForAndThen = (plan: unknown): unknown =>
        execPlan(plan as ExecutionPlan);

      // Helper: normalize result into { hash } | { error }
      const parseResult = (
        res: unknown
      ): { hash?: unknown; error?: string } => {
        try {
          const typename = (res as { __typename?: string })?.__typename;
          if (typename === "InsufficientBalanceError") {
            const required = (res as InsufficientBalanceErrorPlan)?.required
              ?.value;
            return {
              error: `Insufficient balance${
                required ? `: requires ${String(required)}` : ""
              }`,
            };
          }
          const hasIsErr =
            typeof (res as { isErr?: unknown }).isErr === "function";
          if (hasIsErr) {
            const r = res as {
              isErr: () => boolean;
              error?: unknown;
              value?: unknown;
            };
            if (r.isErr()) {
              const msg =
                r?.error instanceof Error ? r.error.message : "Supply failed";
              return { error: msg };
            }
            // Some Result types expose .value on success
            return { hash: r.value };
          }
          // Fall back: assume the result itself is the hash
          return { hash: res };
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Supply failed";
          return { error: msg };
        }
      };

      // Native supply path if supported and requested
      if (useNative && targetReserve.acceptsNative) {
        const initial = supply({
          market: marketAddress,
          amount: { native: amountBD },
          sender,
          chainId: chainIdValue,
          ...(onBehalfOf ? { onBehalfOf: evmAddress(onBehalfOf) } : {}),
        });
        const executed = isLoosePlanAndThenable(initial)
          ? await (initial as LoosePlanAndThenable).andThen(execPlanForAndThen)
          : execPlan(initial as ExecutionPlan);
        const out = parseResult(executed);
        if (!out.error) {
          const tokenSym =
            targetReserve.underlyingToken?.symbol || symbol || "";
          const price = await getTokenUsdPrice(tokenSym);
          const createdAt = new Date().toISOString();
          await safeLog({
            address: senderAddress!,
            agent: "Aave",
            action: "Lend",
            volume: Number(amount) || 0,
            token: tokenSym,
            volumeUsd: (Number(amount) || 0) * (price || 0),
            extra: {
              branch: "native",
              chainId: chainIdValue,
              market: marketAddress,
              txHash: out.hash,
              onBehalfOf,
              createdAt,
            },
          });
        }
        return out;
      } else if (useNative && !targetReserve.acceptsNative) {
        // Handle case where native supply is requested but not supported
        // return { error: "Native supply not supported for this reserve" };
      }

      // If permit is supported and requested, sign and supply with permit
      if (usePermit && targetReserve.permitSupported) {
        const signed = signPermit({
          amount: amountBD,
          chainId: chainIdValue,
          currency,
          owner: sender,
          spender,
        });

        if (isLoosePlanAndThenable(signed)) {
          const withSupply = await (signed as LoosePlanAndThenable).andThen(
            (signature: unknown) =>
              supply({
                market: marketAddress,
                amount: {
                  erc20: {
                    currency,
                    value: amountBD,
                    // Cast through never to avoid leaking any while matching structural type
                    permitSig: signature as never,
                  },
                },
                sender,
                chainId: chainIdValue,
                ...(onBehalfOf ? { onBehalfOf: evmAddress(onBehalfOf) } : {}),
              })
          );
          const executed = isLoosePlanAndThenable(withSupply)
            ? await (withSupply as LoosePlanAndThenable).andThen(
                execPlanForAndThen
              )
            : execPlan(withSupply as ExecutionPlan);
          const out = parseResult(executed);
          if (!out.error) {
            const tokenSym =
              targetReserve.underlyingToken?.symbol || symbol || "";
            const price = await getTokenUsdPrice(tokenSym);
            const createdAt = new Date().toISOString();
            await safeLog({
              address: senderAddress!,
              agent: "Aave",
              action: "Lend",
              volume: Number(amount) || 0,
              token: tokenSym,
              volumeUsd: (Number(amount) || 0) * (price || 0),
              extra: {
                branch: "permit",
                chainId: chainIdValue,
                market: marketAddress,
                txHash: out.hash,
                onBehalfOf,
                createdAt,
              },
            });
          }
          return out;
        }

        const out = parseResult(signed);
        if (!out.error) {
          const tokenSym =
            targetReserve.underlyingToken?.symbol || symbol || "";
          const price = await getTokenUsdPrice(tokenSym);
          const createdAt = new Date().toISOString();
          await safeLog({
            address: senderAddress!,
            agent: "Aave",
            action: "Lend",
            volume: Number(amount) || 0,
            token: tokenSym,
            volumeUsd: (Number(amount) || 0) * (price || 0),
            extra: {
              branch: "permit",
              chainId: chainIdValue,
              market: marketAddress,
              txHash: out.hash,
              onBehalfOf,
              createdAt,
            },
          });
        }
        return out;
      } else if (usePermit && !targetReserve.permitSupported) {
        // Handle case where permit is requested but not supported
        // return { error: "Permit not supported for this reserve" };
      }

      // Fallback: standard ERC-20 supply (approval flow handled by plan)
      const plan = supply({
        market: marketAddress,
        amount: {
          erc20: {
            currency,
            value: amountBD,
          },
        },
        sender,
        chainId: chainIdValue,
        ...(onBehalfOf ? { onBehalfOf: evmAddress(onBehalfOf) } : {}),
      });
      const executed = isLoosePlanAndThenable(plan)
        ? await (plan as LoosePlanAndThenable).andThen(execPlanForAndThen)
        : execPlan(plan as ExecutionPlan);
      const out = parseResult(executed);
      if (!out.error) {
        const tokenSym = targetReserve.underlyingToken?.symbol || symbol || "";
        const price = await getTokenUsdPrice(tokenSym);
        const createdAt = new Date().toISOString();
        await safeLog({
          address: senderAddress!,
          agent: "Aave",
          action: "Lend",
          volume: Number(amount) || 0,
          token: tokenSym,
          volumeUsd: (Number(amount) || 0) * (price || 0),
          extra: {
            branch: "erc20",
            chainId: chainIdValue,
            market: marketAddress,
            txHash: out.hash,
            onBehalfOf,
            createdAt,
          },
        });
      }
      return out;
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Unexpected error executing supply";
      return { error: msg };
    }
  };

  // Action 11: Execute supply transaction
  useCopilotAction({
    name: "Lend",
    description:
      "Execute a supply (Lend) transaction to an Aave reserve. Supports ERC-20 approval or EIP-2612 permit, and supplying on behalf of another address.",
    parameters: [
      {
        name: "symbol",
        type: "string",
        description: "Token symbol to supply (e.g., WETH, USDC, DAI)",
        required: false,
      },
      {
        name: "address",
        type: "string",
        description: "Token contract address (overrides symbol if provided)",
        required: false,
      },
      {
        name: "amount",
        type: "string",
        description: "Amount to supply (required)",
        required: true,
      },
      {
        name: "userAddress",
        type: "string",
        description:
          "User wallet address. If omitted, uses the connected wallet address.",
        required: false,
      },
      {
        name: "useNative",
        type: "boolean",
        description:
          "Supply using native token when reserve accepts native (e.g., ETH for WETH)",
        required: false,
      },
      {
        name: "usePermit",
        type: "boolean",
        description:
          "Use permit for gasless approval when supported (default: true)",
        required: false,
      },
      {
        name: "onBehalfOf",
        type: "string",
        description: "Supply on behalf of another address (optional)",
        required: false,
      },
    ],
    handler: async ({
      symbol,
      address,
      amount,
      userAddress,
      useNative = false,
      usePermit = true,
      onBehalfOf,
    }) => {
      return executeSupplyOperation({
        symbol,
        address,
        amount,
        userAddress,
        useNative,
        usePermit,
        onBehalfOf,
      });
    },
  });

  const Test = async () => {
    // Test Aave functions here
    // const res = findHighestApyReserves(data || [], {
    //   type: "supply",
    // });
    // console.log(res, "response");

    const WETH = allReserves.find(
      (r: ExtendedReserve) => r.underlyingToken.symbol === "USDC"
    );
    console.log(WETH, "WETH");

    const res = await executeSupplyOperation({
      symbol: WETH?.underlyingToken.symbol,
      address: WETH?.underlyingToken.address,
      amount: "1",
      useNative: false,
      usePermit: false,
    });

    console.log(res, "supply response");
  };

  return null;
  // <button onClick={Test}>Test Aave</button>
};

export default Aave;

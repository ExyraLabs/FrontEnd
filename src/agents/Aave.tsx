"use client";
import {
  chainId,
  Market,
  Reserve,
  useAaveMarkets,
  useUserSupplies,
  useUserBorrows,
  useCollateralToggle,
  useBorrow,
} from "@aave/react";
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
import { findHighestApyReserves } from "./aave-functions";

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
  const [toggleCollateral, toggling] = useCollateralToggle();
  const [borrow, borrowing] = useBorrow();
  const {
    data: userSupplies,
    loading,
    error,
  } = useUserSupplies({
    markets: data
      ? data.map((market) => ({
          chainId: market.chain.chainId,
          address: market.address,
        }))
      : [],
    user: userAddr ? evmAddress(userAddr) : undefined,
  });

  const {
    data: userBorrows,
    loading: borrowsLoading,
    error: borrowsError,
  } = useUserBorrows({
    markets: data
      ? data.map((market) => ({
          chainId: market.chain.chainId,
          address: market.address,
        }))
      : [],
    user: userAddr ? evmAddress(userAddr) : undefined,
  });

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
    instructions: `Make sure to use the connect wallet for transactions except an address is specifically provided
    -Currently, you have direct integration with Aave to execute transactions or facilitate lending actions on users behalf.
    `,
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
  useCopilotAction({
    name: "FindHighestApyReserves",
    description:
      "Find Aave reserves with the highest supply or borrow APY rates",
    parameters: [
      {
        name: "type",
        type: "string",
        description:
          "Type of APY to search for: 'supply' or 'borrow' (default: 'supply')",
        required: false,
      },
      {
        name: "limit",
        type: "number",
        description: "Number of top reserves to return (default: 10)",
        required: false,
      },
      {
        name: "minLiquidity",
        type: "number",
        description: "Minimum USD liquidity to filter results (default: 0)",
        required: false,
      },
    ],
    handler: async ({ type = "supply", limit = 10, minLiquidity = 0 }) => {
      return findHighestApyReserves(data || [], {
        type: type as "supply" | "borrow",
        limit,
        minLiquidity,
      });
    },
  });

  // // Action: Get User Supply Positions
  // useCopilotAction({
  //   name: "GetUserSupplyPositions",
  //   description:
  //     "Get all user's supplied positions across Aave markets with detailed information including APY, balances, and USD values",
  //   parameters: [
  //     {
  //       name: "userAddress",
  //       type: "string",
  //       description:
  //         "User wallet address (optional, defaults to connected wallet)",
  //       required: false,
  //     },
  //   ],
  //   handler: async ({ userAddress }) => {
  //     const targetAddress = userAddress || userAddr;
  //     if (!targetAddress) {
  //       return {
  //         error: "No wallet connected and no user address provided",
  //         supplies: [],
  //         loading: false,
  //       };
  //     }

  //     // If requesting different user, we need to fetch their data
  //     if (userAddress && userAddress !== userAddr) {
  //       // For different user, we'd need to make a separate call
  //       // For now, return message that we can only show connected user data
  //       return {
  //         error: "Can only show positions for connected wallet address",
  //         supplies: [],
  //         loading: false,
  //       };
  //     }

  //     const result = {
  //       loading,
  //       supplies: userSupplies || [],
  //       summary: {
  //         totalPositions: userSupplies?.length || 0,
  //         totalSuppliedUSD:
  //           userSupplies?.reduce((sum, position) => {
  //             const usdValue = parseFloat(position.balance?.usd?.value || "0");
  //             return sum + usdValue;
  //           }, 0) || 0,
  //       },
  //     };

  //     return result;
  //   },
  // });

  // // Action: Get User Borrow Positions
  // useCopilotAction({
  //   name: "GetUserBorrowPositions",
  //   description:
  //     "Get all user's borrowed positions across Aave markets with detailed information including APY, debt, and USD values",
  //   parameters: [
  //     {
  //       name: "userAddress",
  //       type: "string",
  //       description:
  //         "User wallet address (optional, defaults to connected wallet)",
  //       required: false,
  //     },
  //   ],
  //   handler: async ({ userAddress }) => {
  //     const targetAddress = userAddress || userAddr;
  //     if (!targetAddress) {
  //       return {
  //         error: "No wallet connected and no user address provided",
  //         borrows: [],
  //         loading: false,
  //       };
  //     }

  //     // If requesting different user, we need to fetch their data
  //     if (userAddress && userAddress !== userAddr) {
  //       return {
  //         error: "Can only show positions for connected wallet address",
  //         borrows: [],
  //         loading: false,
  //       };
  //     }

  //     const result = {
  //       loading: borrowsLoading,
  //       borrows: userBorrows || [],
  //       summary: {
  //         totalPositions: userBorrows?.length || 0,
  //         totalBorrowedUSD:
  //           userBorrows?.reduce((sum, position) => {
  //             const usdValue = parseFloat(position.debt?.usd?.value || "0");
  //             return sum + usdValue;
  //           }, 0) || 0,
  //       },
  //     };

  //     return result;
  //   },
  // });

  // Action: Get Complete User Portfolio
  useCopilotAction({
    name: "GetUserPortfolio",
    description:
      "Get complete user portfolio including both supply and borrow positions with health factor and summary statistics",
    parameters: [
      {
        name: "userAddress",
        type: "string",
        description:
          "User wallet address (optional, defaults to connected wallet)",
        required: false,
      },
    ],
    handler: async ({ userAddress }) => {
      const targetAddress = userAddress || userAddr;
      if (!targetAddress) {
        return {
          error: "No wallet connected and no user address provided",
          portfolio: null,
        };
      }

      if (userAddress && userAddress !== userAddr) {
        return {
          error: "Can only show portfolio for connected wallet address",
          portfolio: null,
        };
      }

      const totalSuppliedUSD =
        userSupplies?.reduce((sum, position) => {
          const usdValue = parseFloat(position.balance?.usd?.value || "0");
          return sum + usdValue;
        }, 0) || 0;

      const totalBorrowedUSD =
        userBorrows?.reduce((sum, position) => {
          const usdValue = parseFloat(position.debt?.usd?.value || "0");
          return sum + usdValue;
        }, 0) || 0;

      const netWorth = totalSuppliedUSD - totalBorrowedUSD;

      const portfolio = {
        address: targetAddress,
        loading: loading || borrowsLoading,

        supplies: userSupplies || [],
        borrows: userBorrows || [],
        summary: {
          totalSupplyPositions: userSupplies?.length || 0,
          totalBorrowPositions: userBorrows?.length || 0,
          totalSuppliedUSD,
          totalBorrowedUSD,
          netWorth,
          utilizationRatio:
            totalSuppliedUSD > 0
              ? (totalBorrowedUSD / totalSuppliedUSD) * 100
              : 0,
        },
      };

      return { portfolio };
    },
  });

  // // Action: Get User Position for Specific Token
  // useCopilotAction({
  //   name: "GetUserTokenPosition",
  //   description:
  //     "Get user's position (supply and/or borrow) for a specific token across all Aave markets",
  //   parameters: [
  //     {
  //       name: "tokenSymbol",
  //       type: "string",
  //       description: "Token symbol to search for (e.g., WETH, USDC, DAI)",
  //       required: true,
  //     },
  //     {
  //       name: "userAddress",
  //       type: "string",
  //       description:
  //         "User wallet address (optional, defaults to connected wallet)",
  //       required: false,
  //     },
  //   ],
  //   handler: async ({ tokenSymbol, userAddress }) => {
  //     const targetAddress = userAddress || userAddr;
  //     if (!targetAddress) {
  //       return {
  //         error: "No wallet connected and no user address provided",
  //         position: null,
  //       };
  //     }

  //     if (!tokenSymbol) {
  //       return {
  //         error: "Token symbol is required",
  //         position: null,
  //       };
  //     }

  //     if (userAddress && userAddress !== userAddr) {
  //       return {
  //         error: "Can only show positions for connected wallet address",
  //         position: null,
  //       };
  //     }

  //     const upperSymbol = tokenSymbol.toUpperCase();

  //     // Find supply position
  //     const supplyPosition = userSupplies?.find(
  //       (position) => position.currency?.symbol?.toUpperCase() === upperSymbol
  //     );

  //     // Find borrow position
  //     const borrowPosition = userBorrows?.find(
  //       (position) => position.currency?.symbol?.toUpperCase() === upperSymbol
  //     );

  //     if (!supplyPosition && !borrowPosition) {
  //       return {
  //         error: `No positions found for token ${tokenSymbol}`,
  //         position: null,
  //       };
  //     }

  //     const position = {
  //       tokenSymbol: upperSymbol,
  //       supply: supplyPosition
  //         ? {
  //             balance: supplyPosition.balance,
  //             marketName: supplyPosition.market?.name,
  //             isCollateral: supplyPosition.isCollateral,
  //             canBeCollateral: supplyPosition.canBeCollateral,
  //           }
  //         : null,
  //       borrow: borrowPosition
  //         ? {
  //             debt: borrowPosition.debt,
  //             marketName: borrowPosition.market?.name,
  //           }
  //         : null,
  //     };

  //     return { position };
  //   },
  // });

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

  // Action: Collateral Management - Enable/Disable Use as Collateral
  useCopilotAction({
    name: "ToggleCollateral",
    description:
      "Enable or disable a supplied asset as collateral for borrowing. This affects your borrowing power and liquidation risk.",
    parameters: [
      {
        name: "tokenSymbol",
        type: "string",
        description:
          "Token symbol to toggle collateral for (e.g., WETH, USDC, DAI)",
        required: true,
      },
      {
        name: "enable",
        type: "boolean",
        description:
          "True to enable as collateral, false to disable. If not specified, will toggle current state.",
        required: false,
      },
      {
        name: "userAddress",
        type: "string",
        description:
          "User wallet address (optional, defaults to connected wallet)",
        required: false,
      },
    ],
    handler: async ({ tokenSymbol, enable, userAddress }) => {
      try {
        const targetAddress = userAddress || userAddr;
        if (!targetAddress) {
          return {
            error: "No wallet connected and no user address provided",
          };
        }

        if (!tokenSymbol) {
          return {
            error: "Token symbol is required",
          };
        }

        // Require an active wallet client for signing and sending transactions
        if (!walletClient || !walletClient.account) {
          return {
            error: "Wallet client not available. Please connect your wallet.",
          };
        }

        if (userAddress && userAddress !== userAddr) {
          return {
            error: "Can only manage collateral for connected wallet address",
          };
        }

        const upperSymbol = tokenSymbol.toUpperCase();

        // Find the user's supply position for this token
        const supplyPosition = userSupplies?.find(
          (position) => position.currency?.symbol?.toUpperCase() === upperSymbol
        );

        if (!supplyPosition) {
          return `No supply position found for ${tokenSymbol}. You must supply this asset first before using it as collateral.`;
        }

        // Check if the asset can be used as collateral
        if (!supplyPosition.canBeCollateral) {
          return `${tokenSymbol} cannot be used as collateral. This may be due to an Aave DAO governance decision.`;
        }

        // Determine the action based on current state and user preference
        const currentlyCollateral = supplyPosition.isCollateral;
        let shouldEnable: boolean;

        if (enable !== undefined) {
          shouldEnable = enable;
          // Validate the requested action makes sense
          if (enable && currentlyCollateral) {
            return {
              error: `${tokenSymbol} is already being used as collateral`,
            };
          }
          if (!enable && !currentlyCollateral) {
            return {
              error: `${tokenSymbol} is already not being used as collateral`,
            };
          }
        } else {
          // Toggle current state
          shouldEnable = !currentlyCollateral;
        }

        // Check balance - user must have a balance to toggle collateral
        const balanceValue = parseFloat(
          supplyPosition.balance?.amount?.value || "0"
        );
        if (balanceValue <= 0) {
          return {
            error: `No ${tokenSymbol} balance found to manage as collateral`,
          };
        }

        // Execute the collateral toggle
        const result = await toggleCollateral({
          market: supplyPosition.market.address,
          underlyingToken: supplyPosition.currency.address,
          user: evmAddress(targetAddress),
          chainId: supplyPosition.market.chain.chainId,
        }).andThen(sendTransaction);

        // Parse the result
        if (result.isErr()) {
          const errorMessage =
            result.error instanceof Error
              ? result.error.message
              : "Collateral toggle failed";
          return { error: errorMessage };
        }

        return {
          success: true,
          txHash: result.value,
          token: upperSymbol,
          previousState: currentlyCollateral,
          newState: shouldEnable,
          message: `Successfully ${
            shouldEnable ? "enabled" : "disabled"
          } ${tokenSymbol} as collateral`,
        };
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error
            ? e.message
            : "Unexpected error during collateral toggle";
        return { error: errorMessage };
      }
    },
  });

  // Action: Borrow Assets from Aave Markets
  useCopilotAction({
    name: "Borrow",
    description:
      "Borrow assets from Aave markets using your supplied assets as collateral. You must have sufficient collateral and borrowing power.",
    parameters: [
      {
        name: "symbol",
        type: "string",
        description: "Token symbol to borrow (e.g., WETH, USDC, DAI)",
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
        description: "Amount to borrow (required)",
        required: true,
      },
      {
        name: "userAddress",
        type: "string",
        description:
          "User wallet address (optional, defaults to connected wallet)",
        required: false,
      },
      {
        name: "useNative",
        type: "boolean",
        description:
          "Receive borrowed assets as native token when supported (e.g., ETH instead of WETH)",
        required: false,
      },
      {
        name: "onBehalfOf",
        type: "string",
        description:
          "Borrow on behalf of another address (for credit delegation)",
        required: false,
      },
    ],
    handler: async ({
      symbol,
      address,
      amount,
      userAddress,
      useNative = false,
      onBehalfOf,
    }) => {
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

        if (userAddress && userAddress !== userAddr) {
          return {
            error: "Can only execute borrows for connected wallet address",
          };
        }

        // Find target borrow reserve
        const target = (allReserves || []).find((r) => {
          const symbolMatch = symbol
            ? r?.type === "borrow" &&
              r?.underlyingToken?.symbol?.toUpperCase?.() ===
                symbol.trim().toUpperCase()
            : false;
          const addressMatch = address
            ? r?.type === "borrow" &&
              r?.underlyingToken?.address?.toLowerCase?.() ===
                address.trim().toLowerCase()
            : false;
          return address ? addressMatch : symbolMatch;
        });

        if (!target) {
          return {
            error: "Borrow reserve not found for the provided symbol/address",
          };
        }

        if (target.isFrozen) {
          return { error: "Reserve is frozen and does not allow borrowing" };
        }
        if (target.isPaused) {
          return { error: "Reserve is paused and does not allow borrowing" };
        }

        // Check user's borrowing capacity
        if (target.userState) {
          console.log(target, " Target User State");
          const maxBorrowable = target.userState.borrowable?.amount?.value;
          if (!maxBorrowable || parseFloat(maxBorrowable) <= 0) {
            return {
              error:
                "You cannot borrow from this reserve. This may be due to insufficient collateral, borrowing limits, or other restrictions.",
            };
          }

          // Check if the requested amount exceeds borrowable amount
          if (parseFloat(amount) > parseFloat(maxBorrowable)) {
            return {
              error: `Requested amount (${amount}) exceeds your maximum borrowable amount (${maxBorrowable}) for ${
                symbol || address
              }`,
            };
          }
        } else {
          return {
            error:
              "Cannot determine borrowing capacity. Please ensure you have sufficient collateral.",
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
        const currency = targetReserve.underlyingToken?.address as string;

        // Helper function to execute the borrow plan (similar to supply execution)
        type BorrowResultReturn = ReturnType<typeof sendTransaction>;
        type LooseBorrowPlanAndThenable = {
          andThen: (fn: (val: unknown) => unknown) => unknown;
        };
        const isLooseBorrowPlanAndThenable = (
          x: unknown
        ): x is LooseBorrowPlanAndThenable =>
          typeof (x as { andThen?: unknown })?.andThen === "function";

        type BorrowTransactionRequestPlan = {
          __typename: "TransactionRequest";
        } & Record<string, unknown>;
        type BorrowApprovalRequiredPlan = {
          __typename: "ApprovalRequired";
          approval: Parameters<typeof sendTransaction>[0];
          originalTransaction: Parameters<typeof sendTransaction>[0];
        };
        type BorrowInsufficientBalanceErrorPlan = {
          __typename: "InsufficientBalanceError";
          required?: { value?: unknown };
        };
        type BorrowExecutionPlan =
          | BorrowTransactionRequestPlan
          | BorrowApprovalRequiredPlan
          | BorrowInsufficientBalanceErrorPlan;

        const execBorrowPlan = (
          plan: BorrowExecutionPlan
        ): BorrowResultReturn | BorrowExecutionPlan => {
          const typename = plan?.__typename;
          switch (typename) {
            case "TransactionRequest":
              return sendTransaction(
                plan as unknown as Parameters<typeof sendTransaction>[0]
              );
            case "ApprovalRequired":
              return sendTransaction(
                (plan as BorrowApprovalRequiredPlan).approval
              ).andThen(() =>
                sendTransaction(
                  (plan as BorrowApprovalRequiredPlan).originalTransaction
                )
              );
            default:
              return plan;
          }
        };

        const execBorrowPlanForAndThen = (plan: unknown): unknown =>
          execBorrowPlan(plan as BorrowExecutionPlan);

        // Helper: normalize borrow result into { hash } | { error }
        const parseBorrowResult = (
          res: unknown
        ): { hash?: unknown; error?: string } => {
          try {
            const typename = (res as { __typename?: string })?.__typename;
            if (typename === "InsufficientBalanceError") {
              const required = (res as BorrowInsufficientBalanceErrorPlan)
                ?.required?.value;
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
                  r?.error instanceof Error ? r.error.message : "Borrow failed";
                return { error: msg };
              }
              return { hash: r.value };
            }
            return { hash: res };
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Borrow failed";
            return { error: msg };
          }
        };

        // Native borrow path if supported and requested
        if (useNative && targetReserve.acceptsNative) {
          const initial = borrow({
            market: marketAddress,
            amount: { native: amountBD },
            sender,
            chainId: chainIdValue,
            ...(onBehalfOf ? { onBehalfOf: evmAddress(onBehalfOf) } : {}),
          });
          const executed = isLooseBorrowPlanAndThenable(initial)
            ? await (initial as LooseBorrowPlanAndThenable).andThen(
                execBorrowPlanForAndThen
              )
            : execBorrowPlan(initial as BorrowExecutionPlan);
          const out = parseBorrowResult(executed);

          if (out.error) {
            return { error: out.error };
          }

          // Log successful borrow
          const tokenSym =
            targetReserve.underlyingToken?.symbol || symbol || "";
          const price = await getTokenUsdPrice(tokenSym);
          const createdAt = new Date().toISOString();

          safeLog({
            address: senderAddress,
            agent: "Aave",
            action: "Borrow",
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

          return {
            success: true,
            txHash: out.hash,
            amount,
            token: tokenSym,
            method: "native",
            message: `Successfully borrowed ${amount} ${tokenSym} (received as native token)`,
          };
        }

        // Standard ERC-20 borrow
        const plan = borrow({
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
        const executed = isLooseBorrowPlanAndThenable(plan)
          ? await (plan as LooseBorrowPlanAndThenable).andThen(
              execBorrowPlanForAndThen
            )
          : execBorrowPlan(plan as BorrowExecutionPlan);
        const out = parseBorrowResult(executed);

        if (out.error) {
          return { error: out.error };
        }

        // Log successful borrow
        const tokenSym = targetReserve.underlyingToken?.symbol || symbol || "";
        const price = await getTokenUsdPrice(tokenSym);
        const createdAt = new Date().toISOString();

        safeLog({
          address: senderAddress,
          agent: "Aave",
          action: "Borrow",
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

        return {
          success: true,
          txHash: out.hash,
          amount,
          token: tokenSym,
          method: "erc20",
          message: `Successfully borrowed ${amount} ${tokenSym}`,
        };
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error
            ? e.message
            : "Unexpected error during borrow operation";
        return { error: errorMessage };
      }
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

  // Utility to safely log user actions to server (fire-and-forget)
  const safeLog = (params: Parameters<typeof logUserAction>[0]) => {
    // Fire and forget - don't await to avoid returning MongoDB documents
    logUserAction(params).catch(() => {
      // swallow logging errors silently
    });
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
          safeLog({
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
            safeLog({
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
          safeLog({
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
        safeLog({
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
    // const res = findHighestApyReserves(findHighestApyReserves || [], {
    //   type: "supply",
    // });
    // console.log(res, "response");

    const WETH = allReserves.find(
      (r: ExtendedReserve) => r.underlyingToken.symbol === "WETH"
    );
    console.log(WETH, "WETH");

    // const res = await executeSupplyOperation({
    //   symbol: WETH?.underlyingToken.symbol,
    //   address: WETH?.underlyingToken.address,
    //   amount: "0.0005",
    //   useNative: false,
    //   usePermit: true,
    // });

    // console.log(res, "supply response");
    console.log(userSupplies, "user supplies");
    console.log(userBorrows, "user borrows");
    console.log(
      `Loading states - Supplies: ${loading}, Borrows: ${borrowsLoading}, Collateral Toggle: ${toggling.loading}, Borrowing: ${borrowing.loading}`
    );
  };

  return null;
  // <button onClick={Test}>Test Aae</button>;
};

export default Aave;

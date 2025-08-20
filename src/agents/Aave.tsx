"use client";
import { chainId, useAaveMarkets } from "@aave/react";
import { useCopilotAction } from "@copilotkit/react-core";
import {
  findEthRelatedReserves,
  findHighestApyReserves,
  findReservesByVolume,
  getAaveMarketStats,
  findReservesByCharacteristics,
  findSuitableSupplyReserves,
  analyzeSupplyReserve,
  getSupplyRecommendations,
  analyzeAndPrepareSupply,
} from "./aave-functions";

const Aave = () => {
  const { data } = useAaveMarkets({ chainIds: [chainId(1)] });

  // CopilotKit Actions for Aave Market Analysis

  // Action 1: Find ETH-related reserves
  useCopilotAction({
    name: "findEthRelatedReserves",
    description:
      "Find all Aave reserves that include ETH, WETH, stETH, or other Ethereum-related tokens",
    parameters: [
      {
        name: "includeStaking",
        type: "boolean",
        description:
          "Include staking derivatives like stETH, rETH (default: true)",
        required: false,
      },
    ],
    handler: async ({ includeStaking = true }) => {
      return findEthRelatedReserves(data || [], { includeStaking });
    },
  });

  // Action 2: Find highest APY reserves
  useCopilotAction({
    name: "findHighestApyReserves",
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

  // Action 3: Find reserves by volume/liquidity
  useCopilotAction({
    name: "findReservesByVolume",
    description: "Find Aave reserves filtered by total volume/liquidity in USD",
    parameters: [
      {
        name: "minVolume",
        type: "number",
        description: "Minimum volume in USD (e.g., 1000000 for $1M)",
        required: true,
      },
      {
        name: "maxVolume",
        type: "number",
        description: "Maximum volume in USD (optional)",
        required: false,
      },
      {
        name: "type",
        type: "string",
        description:
          "Filter by 'supply', 'borrow', or 'both' (default: 'both')",
        required: false,
      },
      {
        name: "sortBy",
        type: "string",
        description:
          "Sort by 'volume', 'apy', or 'utilization' (default: 'volume')",
        required: false,
      },
    ],
    handler: async ({
      minVolume,
      maxVolume,
      type = "both",
      sortBy = "volume",
    }) => {
      return findReservesByVolume(data || [], {
        minVolume,
        maxVolume,
        type: type as "supply" | "borrow" | "both",
        sortBy: sortBy as "volume" | "apy" | "utilization",
      });
    },
  });

  // Action 4: Market statistics and overview
  useCopilotAction({
    name: "getAaveMarketStats",
    description:
      "Get comprehensive statistics and overview of all Aave markets",
    parameters: [
      {
        name: "includeDetails",
        type: "boolean",
        description: "Include detailed breakdown by market (default: false)",
        required: false,
      },
    ],
    handler: async ({ includeDetails = false }) => {
      return getAaveMarketStats(data || [], { includeDetails });
    },
  });

  // Action 5: Find reserves with specific characteristics
  useCopilotAction({
    name: "findReservesByCharacteristics",
    description:
      "Find Aave reserves with specific characteristics like high utilization, low LTV, flash loan support, etc.",
    parameters: [
      {
        name: "minUtilization",
        type: "number",
        description: "Minimum utilization rate percentage (0-100)",
        required: false,
      },
      {
        name: "maxUtilization",
        type: "number",
        description: "Maximum utilization rate percentage (0-100)",
        required: false,
      },
      {
        name: "flashLoanEnabled",
        type: "boolean",
        description: "Filter by flash loan support",
        required: false,
      },
      {
        name: "minLTV",
        type: "number",
        description: "Minimum Loan-to-Value ratio percentage",
        required: false,
      },
      {
        name: "maxLTV",
        type: "number",
        description: "Maximum Loan-to-Value ratio percentage",
        required: false,
      },
      {
        name: "excludeFrozen",
        type: "boolean",
        description: "Exclude frozen or paused reserves (default: true)",
        required: false,
      },
    ],
    handler: async ({
      minUtilization,
      maxUtilization,
      flashLoanEnabled,
      minLTV,
      maxLTV,
      excludeFrozen = true,
    }) => {
      return findReservesByCharacteristics(data || [], {
        minUtilization,
        maxUtilization,
        flashLoanEnabled,
        minLTV,
        maxLTV,
        excludeFrozen,
      });
    },
  });

  // Action 6: Find suitable supply reserves
  useCopilotAction({
    name: "findSuitableSupplyReserves",
    description:
      "Find Aave reserves suitable for supply/deposit operations based on user criteria",
    parameters: [
      {
        name: "minApy",
        type: "number",
        description: "Minimum supply APY percentage required",
        required: false,
      },
      {
        name: "maxRisk",
        type: "string",
        description: "Maximum risk tolerance: low, medium, or high",
        required: false,
      },
      {
        name: "includeNative",
        type: "boolean",
        description: "Include native token supply options (default: true)",
        required: false,
      },
      {
        name: "minLiquidity",
        type: "number",
        description: "Minimum total liquidity in USD",
        required: false,
      },
    ],
    handler: async ({ minApy, maxRisk, includeNative, minLiquidity }) => {
      return findSuitableSupplyReserves(data || [], {
        minApy,
        maxRisk: maxRisk as "low" | "medium" | "high",
        includeNative,
        minLiquidity,
      });
    },
  });

  // Action 7: Analyze specific reserve for supply
  useCopilotAction({
    name: "analyzeSupplyReserve",
    description:
      "Get detailed analysis of a specific reserve for supply operations including risk assessment, yield calculations, and implementation guidance",
    parameters: [
      {
        name: "symbol",
        type: "string",
        description: "Token symbol to analyze (e.g., ETH, USDC, DAI)",
        required: false,
      },
      {
        name: "address",
        type: "string",
        description: "Token contract address to analyze",
        required: false,
      },
      {
        name: "amount",
        type: "string",
        description: "Amount to supply for specific calculations",
        required: false,
      },
      {
        name: "userAddress",
        type: "string",
        description: "User address for personalized limits and analysis",
        required: false,
      },
    ],
    handler: async ({ symbol, address, amount, userAddress }) => {
      return analyzeSupplyReserve(data || [], {
        symbol,
        address,
        amount,
        userAddress,
      });
    },
  });

  // Action 8: Get supply recommendations
  useCopilotAction({
    name: "getSupplyRecommendations",
    description:
      "Get personalized supply recommendations based on investment goals and risk tolerance",
    parameters: [
      {
        name: "goal",
        type: "string",
        description:
          "Investment goal: maximize_yield, minimize_risk, balanced, or high_ltv",
        required: false,
      },
      {
        name: "amount",
        type: "string",
        description: "Amount available to supply for tailored recommendations",
        required: false,
      },
      {
        name: "preferredTokens",
        type: "object",
        description: "Array of preferred token symbols to focus on",
        required: false,
      },
      {
        name: "riskTolerance",
        type: "string",
        description:
          "Risk tolerance level: conservative, moderate, or aggressive",
        required: false,
      },
    ],
    handler: async ({ goal, amount, preferredTokens, riskTolerance }) => {
      return getSupplyRecommendations(data || [], {
        goal: goal as
          | "maximize_yield"
          | "minimize_risk"
          | "balanced"
          | "high_ltv",
        amount,
        preferredTokens: preferredTokens as string[],
        riskTolerance: riskTolerance as
          | "conservative"
          | "moderate"
          | "aggressive",
      });
    },
  });

  // Action 9: Prepare supply execution with code generation
  useCopilotAction({
    name: "prepareSupplyExecution",
    description:
      "Prepare complete supply execution plan with step-by-step instructions and ready-to-use code",
    parameters: [
      {
        name: "symbol",
        type: "string",
        description: "Token symbol to supply (e.g., ETH, USDC, DAI)",
        required: false,
      },
      {
        name: "address",
        type: "string",
        description: "Token contract address to supply",
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
        description: "User wallet address (required)",
        required: true,
      },
      {
        name: "useNative",
        type: "boolean",
        description: "Use native tokens (ETH instead of WETH) when available",
        required: false,
      },
      {
        name: "onBehalfOf",
        type: "string",
        description: "Supply on behalf of another address (optional)",
        required: false,
      },
      {
        name: "usePermit",
        type: "boolean",
        description:
          "Use permit for gasless approval (defaults to true if available)",
        required: false,
      },
    ],
    handler: async ({
      symbol,
      address,
      amount,
      userAddress,
      useNative,
      onBehalfOf,
      usePermit,
    }) => {
      return analyzeAndPrepareSupply(data || [], {
        symbol,
        address,
        amount,
        userAddress,
        useNative,
        onBehalfOf,
        usePermit,
      });
    },
  });

  const Test = () => {
    // Test Aave functions here
    const res = findHighestApyReserves(data || [], {
      type: "supply",
    });
    console.log(res, "response");
  };

  return <button onClick={Test}>Test Aave</button>;
};

export default Aave;

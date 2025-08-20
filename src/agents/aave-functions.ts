import { Market, Reserve } from "@aave/react";

// Execution-related types for actual supply operations
export interface SupplyExecutionParams {
  reserve: Reserve;
  amount: string;
  userAddress: string;
  useNative?: boolean;
  onBehalfOf?: string;
  usePermit?: boolean;
}

export interface SupplyExecutionPlan {
  type: "direct" | "permit" | "approval_required";
  reserve: Reserve;
  amount: string;
  userAddress: string;
  useNative: boolean;
  onBehalfOf?: string;
  permitRequired: boolean;
  gasEstimate?: string;
  steps: SupplyExecutionStep[];
}

export interface SupplyExecutionStep {
  type: "permit" | "approval" | "supply";
  description: string;
  gasEstimate?: string;
  required: boolean;
}

export interface SupplyPreparationResult {
  isReady: boolean;
  executionPlan?: SupplyExecutionPlan;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

// Additional imports for supply functionality
export interface SupplyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SupplyReserveInfo {
  symbol: string;
  name: string;
  address: string;
  marketAddress: string;
  chainId: number;
  isFrozen: boolean;
  isPaused: boolean;
  permitSupported: boolean;
  acceptsNative: boolean;
  nativeSymbol?: string;
  nativeName?: string;
  maxSuppliableAmount: string;
  maxSuppliableAmountUsd: string;
  currentSupplyApy: number;
  liquidationThreshold: number;
  maxLTV: number;
}

export interface SupplyParams {
  reserveAddress?: string;
  symbol?: string;
  amount?: string;
  useNative?: boolean;
  onBehalfOf?: string;
  usePermit?: boolean;
}

export interface SupplyRecommendation {
  reserve: SupplyReserveInfo;
  reason: string;
  riskLevel: "low" | "medium" | "high";
  expectedApy: number;
  maxAmount: string;
}

// Types for function parameters and return values
export interface EthRelatedReservesParams {
  includeStaking?: boolean;
}

export interface HighestApyReservesParams {
  type?: "supply" | "borrow";
  limit?: number;
  minLiquidity?: number;
}

export interface ReservesByVolumeParams {
  minVolume: number;
  maxVolume?: number;
  type?: "supply" | "borrow" | "both";
  sortBy?: "volume" | "apy" | "utilization";
}

export interface MarketStatsParams {
  includeDetails?: boolean;
}

export interface ReservesByCharacteristicsParams {
  minUtilization?: number;
  maxUtilization?: number;
  flashLoanEnabled?: boolean;
  minLTV?: number;
  maxLTV?: number;
  excludeFrozen?: boolean;
}

export interface FormattedReserve {
  symbol: string;
  name: string;
  type: "supply" | "borrow";
  apy: number;
  totalValue: number;
  totalUsd: number;
  utilizationRate: number;
  liquidationThreshold: number;
  maxLTV: number;
  isFrozen: boolean;
  isPaused: boolean;
  flashLoanEnabled: boolean;
  marketName: string;
  address: string;
}

// Function to validate supply operations
export const validateSupplyOperation = (
  reserve: Reserve,
  amount?: string,
  userAddress?: string
): SupplyValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if reserve is available for supply
  if (reserve.isFrozen) {
    errors.push("Reserve is frozen and cannot accept supplies");
  }

  if (reserve.isPaused) {
    errors.push("Reserve is paused and cannot accept supplies");
  }

  // Check user-specific conditions
  if (userAddress && reserve.userState) {
    const maxSuppliable = reserve.userState.suppliable?.amount?.value;
    if (!maxSuppliable || parseFloat(maxSuppliable) <= 0) {
      errors.push(
        "User cannot supply to this reserve (insufficient balance or other restrictions)"
      );
    }

    // Check if amount exceeds maximum suppliable
    if (
      amount &&
      maxSuppliable &&
      parseFloat(amount) > parseFloat(maxSuppliable)
    ) {
      errors.push(
        `Amount (${amount}) exceeds maximum suppliable amount (${maxSuppliable})`
      );
    }
  }

  // Add warnings for risk factors
  const utilizationRate = reserve.borrowInfo?.utilizationRate?.value
    ? parseFloat(reserve.borrowInfo.utilizationRate.value) * 100
    : 0;

  if (utilizationRate > 90) {
    warnings.push("High utilization rate (>90%) - consider the liquidity risk");
  }

  const maxLTV = reserve.supplyInfo?.maxLTV?.value
    ? parseFloat(reserve.supplyInfo.maxLTV.value) * 100
    : 0;

  if (maxLTV < 50) {
    warnings.push(
      "Low maximum LTV (<50%) - limited borrowing power against this collateral"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// Function to extract supply-relevant information from a reserve
export const extractSupplyReserveInfo = (
  reserve: Reserve
): SupplyReserveInfo => {
  const supplyApy = reserve.supplyInfo?.apy?.value
    ? parseFloat(reserve.supplyInfo.apy.value) * 100
    : 0;

  const liquidationThreshold = reserve.supplyInfo?.liquidationThreshold?.value
    ? parseFloat(reserve.supplyInfo.liquidationThreshold.value) * 100
    : 0;

  const maxLTV = reserve.supplyInfo?.maxLTV?.value
    ? parseFloat(reserve.supplyInfo.maxLTV.value) * 100
    : 0;

  const maxSuppliableAmount =
    reserve.userState?.suppliable?.amount?.value || "0";
  const maxSuppliableAmountUsd = reserve.userState?.suppliable?.usd || "0";

  return {
    symbol: reserve.underlyingToken?.symbol || "Unknown",
    name: reserve.underlyingToken?.name || "Unknown",
    address: reserve.underlyingToken?.address || "",
    marketAddress: reserve.market?.address || "",
    chainId: reserve.market?.chain?.chainId || 1,
    isFrozen: reserve.isFrozen || false,
    isPaused: reserve.isPaused || false,
    permitSupported: reserve.permitSupported || false,
    acceptsNative: !!reserve.acceptsNative,
    nativeSymbol: reserve.acceptsNative?.symbol,
    nativeName: reserve.acceptsNative?.name,
    maxSuppliableAmount,
    maxSuppliableAmountUsd,
    currentSupplyApy: supplyApy,
    liquidationThreshold,
    maxLTV,
  };
};

// Function to find suitable reserves for supply operations
export const findSuitableSupplyReserves = (
  data: Market[],
  params: {
    minApy?: number;
    maxRisk?: "low" | "medium" | "high";
    includeNative?: boolean;
    minLiquidity?: number;
    excludeFrozen?: boolean;
  } = {}
): string => {
  const {
    minApy = 0,
    maxRisk = "high",
    includeNative = true,
    minLiquidity = 0,
    excludeFrozen = true,
  } = params;

  if (!data || data.length === 0) {
    return "❌ No Aave market data available. Please ensure the component is loaded.";
  }

  const suitableReserves: SupplyRecommendation[] = [];

  data.forEach((market: Market) => {
    (market.supplyReserves || []).forEach((reserve: Reserve) => {
      const reserveInfo = extractSupplyReserveInfo(reserve);
      const validation = validateSupplyOperation(reserve);

      // Skip if validation fails and excludeFrozen is true
      if (!validation.isValid && excludeFrozen) {
        return;
      }

      // Skip if doesn't meet minimum APY
      if (reserveInfo.currentSupplyApy < minApy) {
        return;
      }

      // Skip if doesn't meet minimum liquidity
      const liquidityUsd = parseFloat(reserveInfo.maxSuppliableAmountUsd);
      if (liquidityUsd < minLiquidity) {
        return;
      }

      // Skip native tokens if not requested
      if (!includeNative && reserveInfo.acceptsNative) {
        return;
      }

      // Determine risk level
      let riskLevel: "low" | "medium" | "high" = "low";
      const utilizationRate = reserve.borrowInfo?.utilizationRate?.value
        ? parseFloat(reserve.borrowInfo.utilizationRate.value) * 100
        : 0;

      if (utilizationRate > 80 || reserveInfo.maxLTV < 50) {
        riskLevel = "high";
      } else if (utilizationRate > 60 || reserveInfo.maxLTV < 70) {
        riskLevel = "medium";
      }

      // Skip if risk level is too high
      const riskLevels = { low: 0, medium: 1, high: 2 };
      if (riskLevels[riskLevel] > riskLevels[maxRisk]) {
        return;
      }

      // Generate recommendation reason
      let reason = `${reserveInfo.currentSupplyApy.toFixed(3)}% APY`;
      if (reserveInfo.permitSupported) {
        reason += ", supports gasless permits";
      }
      if (reserveInfo.acceptsNative) {
        reason += `, accepts native ${reserveInfo.nativeSymbol || "ETH"}`;
      }
      if (reserveInfo.maxLTV > 80) {
        reason += ", high borrowing power";
      }

      suitableReserves.push({
        reserve: reserveInfo,
        reason,
        riskLevel,
        expectedApy: reserveInfo.currentSupplyApy,
        maxAmount: reserveInfo.maxSuppliableAmount,
      });
    });
  });

  if (suitableReserves.length === 0) {
    return (
      `🔍 No suitable supply reserves found matching your criteria:\n` +
      `• Minimum APY: ${minApy}%\n` +
      `• Maximum Risk: ${maxRisk}\n` +
      `• Include Native: ${includeNative}\n` +
      `• Minimum Liquidity: $${minLiquidity.toLocaleString()}`
    );
  }

  // Sort by APY descending
  const sorted = suitableReserves.sort((a, b) => b.expectedApy - a.expectedApy);

  const summary = sorted
    .slice(0, 10)
    .map((rec, index) => {
      const riskEmoji = {
        low: "🟢",
        medium: "🟡",
        high: "🔴",
      }[rec.riskLevel];

      return (
        `\n${index + 1}. ${riskEmoji} **${rec.reserve.symbol}** (${
          rec.reserve.name
        })\n` +
        `   📈 APY: ${rec.expectedApy.toFixed(3)}%\n` +
        `   💰 Max Supply: ${parseFloat(rec.maxAmount).toLocaleString()} ${
          rec.reserve.symbol
        }\n` +
        `   🔒 Max LTV: ${rec.reserve.maxLTV.toFixed(1)}%\n` +
        `   ⚡ Features: ${
          rec.reserve.permitSupported ? "Permit ✅" : "Permit ❌"
        } | ${
          rec.reserve.acceptsNative
            ? `Native ${rec.reserve.nativeSymbol} ✅`
            : "ERC-20 only"
        }\n` +
        `   📝 Why: ${rec.reason}\n` +
        `   🏦 Market: ${rec.reserve.marketAddress.slice(
          0,
          6
        )}...${rec.reserve.marketAddress.slice(-4)}`
      );
    })
    .join("\n");

  return (
    `💰 **Suitable Supply Opportunities** (${sorted.length} found)\n` +
    `🎯 Filtered by: APY ≥${minApy}%, Risk ≤${maxRisk}, Liquidity ≥$${minLiquidity.toLocaleString()}\n` +
    summary
  );
};

// Function to analyze a specific reserve for supply
export const analyzeSupplyReserve = (
  data: Market[],
  params: {
    symbol?: string;
    address?: string;
    amount?: string;
    userAddress?: string;
  }
): string => {
  const { symbol, address, amount, userAddress } = params;

  if (!data || data.length === 0) {
    return "❌ No Aave market data available. Please ensure the component is loaded.";
  }

  if (!symbol && !address) {
    return "❌ Please provide either a token symbol or address to analyze.";
  }

  // Find the reserve
  let targetReserve: Reserve | null = null;
  let targetMarket: Market | null = null;

  for (const market of data) {
    const found = (market.supplyReserves || []).find((reserve: Reserve) => {
      if (symbol) {
        return (
          reserve.underlyingToken?.symbol?.toLowerCase() ===
          symbol.toLowerCase()
        );
      }
      if (address) {
        return (
          reserve.underlyingToken?.address?.toLowerCase() ===
          address.toLowerCase()
        );
      }
      return false;
    });

    if (found) {
      targetReserve = found;
      targetMarket = market;
      break;
    }
  }

  if (!targetReserve || !targetMarket) {
    const identifier = symbol || address;
    return `❌ Could not find supply reserve for ${identifier}. Please check the symbol/address and try again.`;
  }

  // Extract reserve information
  const reserveInfo = extractSupplyReserveInfo(targetReserve);
  const validation = validateSupplyOperation(
    targetReserve,
    amount,
    userAddress
  );

  // Build analysis report
  let report = `🔍 **Supply Analysis for ${reserveInfo.symbol}** (${reserveInfo.name})\n\n`;

  // Basic Information
  report += `📊 **Basic Information**\n`;
  report += `   • Token Address: ${reserveInfo.address}\n`;
  report += `   • Market Address: ${reserveInfo.marketAddress}\n`;
  report += `   • Chain ID: ${reserveInfo.chainId}\n`;
  report += `   • Current Supply APY: ${reserveInfo.currentSupplyApy.toFixed(
    3
  )}%\n\n`;

  // Supply Capabilities
  report += `⚙️ **Supply Capabilities**\n`;
  report += `   • Permit Support: ${
    reserveInfo.permitSupported
      ? "✅ Yes (gasless)"
      : "❌ No (requires approval)"
  }\n`;
  report += `   • Native Token Support: ${
    reserveInfo.acceptsNative
      ? `✅ Yes (${reserveInfo.nativeSymbol})`
      : "❌ No (ERC-20 only)"
  }\n`;
  report += `   • Status: ${
    reserveInfo.isFrozen
      ? "❄️ Frozen"
      : reserveInfo.isPaused
      ? "⏸️ Paused"
      : "✅ Active"
  }\n\n`;

  // Risk Metrics
  report += `⚠️ **Risk Metrics**\n`;
  report += `   • Maximum LTV: ${reserveInfo.maxLTV.toFixed(
    1
  )}% (borrowing power)\n`;
  report += `   • Liquidation Threshold: ${reserveInfo.liquidationThreshold.toFixed(
    1
  )}%\n`;

  // Add utilization rate if available
  const utilizationRate = targetReserve.borrowInfo?.utilizationRate?.value
    ? parseFloat(targetReserve.borrowInfo.utilizationRate.value) * 100
    : 0;
  report += `   • Utilization Rate: ${utilizationRate.toFixed(2)}%\n\n`;

  // User-specific information
  if (userAddress && targetReserve.userState) {
    report += `👤 **Your Supply Limits**\n`;
    report += `   • Max Suppliable: ${parseFloat(
      reserveInfo.maxSuppliableAmount
    ).toLocaleString()} ${reserveInfo.symbol}\n`;
    report += `   • Max Suppliable USD: $${parseFloat(
      reserveInfo.maxSuppliableAmountUsd
    ).toLocaleString()}\n\n`;
  }

  // Amount-specific analysis
  if (amount) {
    report += `💵 **Amount Analysis (${amount} ${reserveInfo.symbol})**\n`;
    if (validation.isValid) {
      const annualReturn =
        parseFloat(amount) * (reserveInfo.currentSupplyApy / 100);
      report += `   • ✅ Amount is valid for supply\n`;
      report += `   • 📈 Expected Annual Return: ~${annualReturn.toFixed(6)} ${
        reserveInfo.symbol
      }\n`;
      report += `   • 📅 Monthly Estimate: ~${(annualReturn / 12).toFixed(6)} ${
        reserveInfo.symbol
      }\n\n`;
    }
  }

  // Validation Results
  report += `🔍 **Validation Results**\n`;
  if (validation.isValid) {
    report += `   • ✅ Ready for supply operation\n`;
  } else {
    report += `   • ❌ Cannot supply due to issues:\n`;
    validation.errors.forEach((error) => {
      report += `     - ${error}\n`;
    });
  }

  if (validation.warnings.length > 0) {
    report += `   • ⚠️ Warnings:\n`;
    validation.warnings.forEach((warning) => {
      report += `     - ${warning}\n`;
    });
  }

  // Implementation guidance
  if (validation.isValid) {
    report += `\n🛠️ **Implementation Options**\n`;
    if (reserveInfo.permitSupported) {
      report += `   • 🚀 **Recommended**: Use permit-based supply (single transaction)\n`;
    } else {
      report += `   • 🔧 **Standard**: Use approval + supply (two transactions)\n`;
    }

    if (reserveInfo.acceptsNative) {
      report += `   • 💎 **Alternative**: Supply native ${reserveInfo.nativeSymbol} (auto-wrapped)\n`;
    }

    report += `   • 🎯 **On Behalf Of**: Supply for another address (optional)\n`;
  }

  return report;
};

// Function to get supply recommendations based on user goals
export const getSupplyRecommendations = (
  data: Market[],
  params: {
    goal?: "maximize_yield" | "minimize_risk" | "balanced" | "high_ltv";
    amount?: string;
    preferredTokens?: string[];
    riskTolerance?: "conservative" | "moderate" | "aggressive";
  } = {}
): string => {
  const {
    goal = "balanced",
    amount,
    preferredTokens = [],
    riskTolerance = "moderate",
  } = params;

  if (!data || data.length === 0) {
    return "❌ No Aave market data available. Please ensure the component is loaded.";
  }

  const allRecommendations: (SupplyRecommendation & { score: number })[] = [];

  data.forEach((market: Market) => {
    (market.supplyReserves || []).forEach((reserve: Reserve) => {
      const reserveInfo = extractSupplyReserveInfo(reserve);
      const validation = validateSupplyOperation(reserve, amount);

      // Skip invalid reserves
      if (!validation.isValid) {
        return;
      }

      // Filter by preferred tokens if specified
      if (preferredTokens.length > 0) {
        const isPreferred = preferredTokens.some(
          (token) => token.toLowerCase() === reserveInfo.symbol.toLowerCase()
        );
        if (!isPreferred) {
          return;
        }
      }

      // Calculate risk level
      const utilizationRate = reserve.borrowInfo?.utilizationRate?.value
        ? parseFloat(reserve.borrowInfo.utilizationRate.value) * 100
        : 0;

      let riskLevel: "low" | "medium" | "high" = "low";
      if (utilizationRate > 85 || reserveInfo.maxLTV < 40) {
        riskLevel = "high";
      } else if (utilizationRate > 70 || reserveInfo.maxLTV < 60) {
        riskLevel = "medium";
      }

      // Filter by risk tolerance
      const riskOrder = {
        conservative: ["low"],
        moderate: ["low", "medium"],
        aggressive: ["low", "medium", "high"],
      };
      if (!riskOrder[riskTolerance].includes(riskLevel)) {
        return;
      }

      let reason = "";
      let score = 0;

      // Score based on goal
      switch (goal) {
        case "maximize_yield":
          score = reserveInfo.currentSupplyApy;
          reason = `Highest yield strategy: ${reserveInfo.currentSupplyApy.toFixed(
            3
          )}% APY`;
          break;
        case "minimize_risk":
          score = 100 - utilizationRate + reserveInfo.maxLTV; // Lower utilization and higher LTV = safer
          reason = `Low risk: ${utilizationRate.toFixed(
            1
          )}% utilization, ${reserveInfo.maxLTV.toFixed(1)}% max LTV`;
          break;
        case "high_ltv":
          score = reserveInfo.maxLTV;
          reason = `High borrowing power: ${reserveInfo.maxLTV.toFixed(
            1
          )}% max LTV, ${reserveInfo.currentSupplyApy.toFixed(3)}% APY`;
          break;
        case "balanced":
        default:
          // Balanced score: APY * (1 - risk_penalty)
          const riskPenalty = Math.max(0, (utilizationRate - 50) / 100);
          score =
            reserveInfo.currentSupplyApy * (1 - riskPenalty) +
            reserveInfo.maxLTV / 10;
          reason = `Balanced option: ${reserveInfo.currentSupplyApy.toFixed(
            3
          )}% APY, ${utilizationRate.toFixed(1)}% utilization`;
          break;
      }

      if (reserveInfo.permitSupported) {
        reason += ", gasless permits";
        score += 0.1; // Small bonus for permit support
      }

      allRecommendations.push({
        reserve: reserveInfo,
        reason,
        riskLevel,
        expectedApy: reserveInfo.currentSupplyApy,
        maxAmount: reserveInfo.maxSuppliableAmount,
        score,
      });
    });
  });

  if (allRecommendations.length === 0) {
    return (
      `🔍 No suitable recommendations found for goal: ${goal}\n` +
      `Risk tolerance: ${riskTolerance}\n` +
      `${
        preferredTokens.length > 0
          ? `Preferred tokens: ${preferredTokens.join(", ")}`
          : "No token restrictions"
      }`
    );
  }

  // Sort by calculated score (descending)
  const sorted = allRecommendations.sort((a, b) => b.score - a.score);

  const goalEmojis = {
    maximize_yield: "🚀",
    minimize_risk: "🛡️",
    balanced: "⚖️",
    high_ltv: "💪",
  };

  let report = `${goalEmojis[goal]} **Supply Recommendations: ${goal
    .replace("_", " ")
    .toUpperCase()}**\n`;
  report += `🎯 Risk Tolerance: ${riskTolerance}\n`;
  if (amount) {
    report += `💰 Target Amount: ${amount}\n`;
  }
  if (preferredTokens.length > 0) {
    report += `🏷️ Preferred Tokens: ${preferredTokens.join(", ")}\n`;
  }
  report += `\n📊 **Top ${Math.min(5, sorted.length)} Recommendations:**\n`;

  const topRecommendations = sorted.slice(0, 5);
  topRecommendations.forEach((rec, index) => {
    const riskEmoji = { low: "🟢", medium: "🟡", high: "🔴" }[rec.riskLevel];

    report += `\n${index + 1}. ${riskEmoji} **${
      rec.reserve.symbol
    }** (Score: ${rec.score.toFixed(1)})\n`;
    report += `   📈 APY: ${rec.expectedApy.toFixed(3)}%\n`;
    report += `   🔒 Max LTV: ${rec.reserve.maxLTV.toFixed(1)}%\n`;
    report += `   ⚡ Features: ${
      rec.reserve.permitSupported ? "Permit" : "Standard"
    } | ${
      rec.reserve.acceptsNative
        ? `Native ${rec.reserve.nativeSymbol}`
        : "ERC-20"
    }\n`;
    report += `   📝 ${rec.reason}\n`;
  });

  // Add implementation tips
  report += `\n💡 **Implementation Tips:**\n`;
  const hasPermitOptions = topRecommendations.some(
    (rec) => rec.reserve.permitSupported
  );
  const hasNativeOptions = topRecommendations.some(
    (rec) => rec.reserve.acceptsNative
  );

  if (hasPermitOptions) {
    report += `   • Use permit-based supply for gasless transactions\n`;
  }
  if (hasNativeOptions) {
    report += `   • Consider native token supply to avoid wrapping gas costs\n`;
  }
  report += `   • Start with smaller amounts to test the process\n`;
  report += `   • Monitor utilization rates for liquidity risk\n`;

  return report;
};

// Function to prepare supply execution plan
export const prepareSupplyExecution = (
  reserve: Reserve,
  amount: string,
  userAddress: string,
  params: {
    useNative?: boolean;
    onBehalfOf?: string;
    usePermit?: boolean;
  } = {}
): SupplyPreparationResult => {
  const { useNative = false, onBehalfOf, usePermit } = params;

  // Validate the supply operation first
  const validation = validateSupplyOperation(reserve, amount, userAddress);
  if (!validation.isValid) {
    return {
      isReady: false,
      errors: validation.errors,
      warnings: validation.warnings,
      recommendations: [],
    };
  }

  // Extract reserve information
  const reserveInfo = extractSupplyReserveInfo(reserve);

  // Determine execution strategy
  let executionType: "direct" | "permit" | "approval_required" = "direct";
  let permitRequired = false;
  const steps: SupplyExecutionStep[] = [];
  const warnings: string[] = [...validation.warnings];
  const recommendations: string[] = [];

  // Check if we're using native tokens
  if (useNative && !reserveInfo.acceptsNative) {
    return {
      isReady: false,
      errors: [`${reserveInfo.symbol} does not support native token supply`],
      warnings: [],
      recommendations: [
        `Use ERC-20 ${reserveInfo.symbol} instead of native tokens`,
      ],
    };
  }

  // Determine permit usage
  if (!useNative && reserveInfo.permitSupported) {
    if (usePermit !== false) {
      // Default to permit if available
      executionType = "permit";
      permitRequired = true;
      steps.push({
        type: "permit",
        description: `Sign permit for ${amount} ${reserveInfo.symbol}`,
        required: true,
      });
      recommendations.push("Using permit for gasless approval (recommended)");
    } else {
      executionType = "approval_required";
      steps.push({
        type: "approval",
        description: `Approve ${amount} ${reserveInfo.symbol} for Aave`,
        required: true,
      });
      warnings.push("Using approval method requires additional gas cost");
    }
  } else if (!useNative) {
    // ERC-20 without permit support
    executionType = "approval_required";
    steps.push({
      type: "approval",
      description: `Approve ${amount} ${reserveInfo.symbol} for Aave`,
      required: true,
    });
    warnings.push(
      `${reserveInfo.symbol} does not support permit - approval required`
    );
  }

  // Add supply step
  const supplyDescription = onBehalfOf
    ? `Supply ${amount} ${reserveInfo.symbol} on behalf of ${onBehalfOf}`
    : `Supply ${amount} ${reserveInfo.symbol}`;

  steps.push({
    type: "supply",
    description: supplyDescription,
    required: true,
  });

  // Add recommendations based on execution plan
  if (useNative && reserveInfo.acceptsNative) {
    recommendations.push("Using native tokens saves gas on token wrapping");
  }

  if (permitRequired) {
    recommendations.push("Single transaction execution with permit signature");
  } else if (executionType === "approval_required") {
    recommendations.push("Two-step process: approval then supply");
  }

  const executionPlan: SupplyExecutionPlan = {
    type: executionType,
    reserve,
    amount,
    userAddress,
    useNative: useNative || false,
    onBehalfOf,
    permitRequired,
    steps,
  };

  return {
    isReady: true,
    executionPlan,
    errors: [],
    warnings,
    recommendations,
  };
};

// Function to generate supply code examples
export const generateSupplyCode = (
  executionPlan: SupplyExecutionPlan
): string => {
  const {
    reserve,
    amount,
    userAddress,
    useNative,
    onBehalfOf,
    permitRequired,
  } = executionPlan;
  const reserveInfo = extractSupplyReserveInfo(reserve);

  let code = `// Supply ${amount} ${reserveInfo.symbol} to Aave\n`;
  code += `// Market: ${reserveInfo.marketAddress}\n`;
  code += `// Chain ID: ${reserveInfo.chainId}\n\n`;

  // Add imports
  code += `import { useWalletClient } from "wagmi";\n`;
  code += `import { useSupply, bigDecimal, evmAddress } from "@aave/react";\n`;

  if (permitRequired) {
    code += `import { useERC20Permit } from "@aave/react/viem";\n`;
  }

  code += `import { useSendTransaction } from "@aave/react/viem";\n\n`;

  // Component setup
  code += `const SupplyComponent = () => {\n`;
  code += `  const { data: walletClient } = useWalletClient();\n`;
  code += `  const [supply, supplying] = useSupply();\n`;
  code += `  const [sendTransaction, sending] = useSendTransaction(walletClient);\n`;

  if (permitRequired) {
    code += `  const [signPermit, signing] = useERC20Permit(walletClient);\n`;
  }

  code += `\n`;
  code += `  // Combined loading states\n`;
  code += `  const loading = supplying.loading || sending.loading`;

  if (permitRequired) {
    code += ` || signing.loading`;
  }

  code += `;\n`;
  code += `  const error = supplying.error || sending.error`;

  if (permitRequired) {
    code += ` || signing.error`;
  }

  code += `;\n\n`;

  // Execute function
  code += `  const executeSupply = async () => {\n`;
  code += `    try {\n`;
  code += `      const amount = bigDecimal(${amount});\n\n`;

  if (permitRequired) {
    // Permit-based execution
    code += `      // Step 1: Sign permit for gasless approval\n`;
    code += `      const result = await signPermit({\n`;
    code += `        amount,\n`;
    code += `        chainId: ${reserveInfo.chainId},\n`;
    code += `        currency: evmAddress("${reserveInfo.address}"),\n`;
    code += `        owner: evmAddress("${userAddress}"),\n`;
    code += `        spender: evmAddress("${reserveInfo.marketAddress}"),\n`;
    code += `      }).andThen((signature) =>\n`;
    code += `        // Step 2: Execute supply with permit\n`;
    code += `        supply({\n`;
    code += `          market: evmAddress("${reserveInfo.marketAddress}"),\n`;
    code += `          amount: {\n`;
    code += `            erc20: {\n`;
    code += `              currency: evmAddress("${reserveInfo.address}"),\n`;
    code += `              value: amount,\n`;
    code += `              permitSig: signature,\n`;
    code += `            },\n`;
    code += `          },\n`;
    code += `          sender: evmAddress("${userAddress}"),\n`;

    if (onBehalfOf) {
      code += `          onBehalfOf: evmAddress("${onBehalfOf}"),\n`;
    }

    code += `          chainId: ${reserveInfo.chainId},\n`;
    code += `        })\n`;
    code += `      );\n\n`;
  } else {
    // Direct execution (native or standard approval)
    code += `      // Execute supply operation\n`;
    code += `      const result = await supply({\n`;
    code += `        market: evmAddress("${reserveInfo.marketAddress}"),\n`;
    code += `        amount: {\n`;

    if (useNative) {
      code += `          native: {\n`;
      code += `            value: amount,\n`;
      code += `          },\n`;
    } else {
      code += `          erc20: {\n`;
      code += `            currency: evmAddress("${reserveInfo.address}"),\n`;
      code += `            value: amount,\n`;
      code += `          },\n`;
    }

    code += `        },\n`;
    code += `        sender: evmAddress("${userAddress}"),\n`;

    if (onBehalfOf) {
      code += `        onBehalfOf: evmAddress("${onBehalfOf}"),\n`;
    }

    code += `        chainId: ${reserveInfo.chainId},\n`;
    code += `      });\n\n`;
  }

  // Transaction handling
  code += `      // Handle execution plan\n`;
  code += `      const txResult = await result.andThen((plan) => {\n`;
  code += `        switch (plan.__typename) {\n`;
  code += `          case "TransactionRequest":\n`;
  code += `            // Single transaction execution\n`;
  code += `            return sendTransaction(plan);\n\n`;
  code += `          case "ApprovalRequired":\n`;
  code += `            // Approval + transaction sequence\n`;
  code += `            return sendTransaction(plan.approval).andThen(() =>\n`;
  code += `              sendTransaction(plan.originalTransaction)\n`;
  code += `            );\n\n`;
  code += `          case "InsufficientBalanceError":\n`;
  code += `            throw new Error(\`Insufficient balance: \${plan.required.value} required.\`);\n\n`;
  code += `          default:\n`;
  code += `            throw new Error("Unknown execution plan type");\n`;
  code += `        }\n`;
  code += `      });\n\n`;

  code += `      if (txResult.isErr()) {\n`;
  code += `        console.error("Supply failed:", txResult.error);\n`;
  code += `        throw txResult.error;\n`;
  code += `      } else {\n`;
  code += `        console.log("Supply successful with hash:", txResult.value);\n`;
  code += `        return txResult.value;\n`;
  code += `      }\n`;
  code += `    } catch (error) {\n`;
  code += `      console.error("Supply execution error:", error);\n`;
  code += `      throw error;\n`;
  code += `    }\n`;
  code += `  };\n\n`;

  // Return JSX
  code += `  return (\n`;
  code += `    <div>\n`;
  code += `      <button\n`;
  code += `        onClick={executeSupply}\n`;
  code += `        disabled={loading || !walletClient}\n`;
  code += `      >\n`;
  code += `        {loading ? "Supplying..." : \`Supply \${${amount}} \${${reserveInfo.symbol}}\`}\n`;
  code += `      </button>\n`;
  code += `      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}\n`;
  code += `    </div>\n`;
  code += `  );\n`;
  code += `};\n\n`;
  code += `export default SupplyComponent;`;

  return code;
};

// Function to analyze and prepare supply with execution plan
export const analyzeAndPrepareSupply = (
  data: Market[],
  params: {
    symbol?: string;
    address?: string;
    amount: string;
    userAddress: string;
    useNative?: boolean;
    onBehalfOf?: string;
    usePermit?: boolean;
  }
): string => {
  const {
    symbol,
    address,
    amount,
    userAddress,
    useNative,
    onBehalfOf,
    usePermit,
  } = params;

  if (!data || data.length === 0) {
    return "❌ No Aave market data available. Please ensure the component is loaded.";
  }

  if (!symbol && !address) {
    return "❌ Please provide either a token symbol or address to prepare supply.";
  }

  if (!amount || parseFloat(amount) <= 0) {
    return "❌ Please provide a valid amount to supply.";
  }

  if (!userAddress) {
    return "❌ User address is required for supply preparation.";
  }

  // Find the reserve
  let targetReserve: Reserve | null = null;

  for (const market of data) {
    const found = (market.supplyReserves || []).find((reserve: Reserve) => {
      if (symbol) {
        return (
          reserve.underlyingToken?.symbol?.toLowerCase() ===
          symbol.toLowerCase()
        );
      }
      if (address) {
        return (
          reserve.underlyingToken?.address?.toLowerCase() ===
          address.toLowerCase()
        );
      }
      return false;
    });

    if (found) {
      targetReserve = found;
      break;
    }
  }

  if (!targetReserve) {
    const identifier = symbol || address;
    return `❌ Could not find supply reserve for ${identifier}. Please check the symbol/address and try again.`;
  }

  // Prepare execution plan
  const preparation = prepareSupplyExecution(
    targetReserve,
    amount,
    userAddress,
    {
      useNative,
      onBehalfOf,
      usePermit,
    }
  );

  const reserveInfo = extractSupplyReserveInfo(targetReserve);

  let report = `🚀 **Supply Execution Plan for ${reserveInfo.symbol}**\n\n`;

  // Preparation Status
  if (preparation.isReady) {
    report += `✅ **Ready for Execution**\n\n`;
  } else {
    report += `❌ **Not Ready for Execution**\n\n`;
    if (preparation.errors.length > 0) {
      report += `**Errors:**\n`;
      preparation.errors.forEach((error) => {
        report += `  • ${error}\n`;
      });
      report += `\n`;
    }

    if (preparation.recommendations.length > 0) {
      report += `**Recommendations:**\n`;
      preparation.recommendations.forEach((rec) => {
        report += `  • ${rec}\n`;
      });
    }

    return report;
  }

  const { executionPlan } = preparation;

  // Execution Details
  report += `📋 **Execution Details**\n`;
  report += `   • Type: ${executionPlan!.type
    .replace("_", " ")
    .toUpperCase()}\n`;
  report += `   • Amount: ${amount} ${reserveInfo.symbol}\n`;
  report += `   • User: ${userAddress.slice(0, 6)}...${userAddress.slice(
    -4
  )}\n`;

  if (onBehalfOf) {
    report += `   • On Behalf Of: ${onBehalfOf.slice(
      0,
      6
    )}...${onBehalfOf.slice(-4)}\n`;
  }

  report += `   • Method: ${useNative ? "Native Token" : "ERC-20 Token"}\n`;
  report += `   • Permit: ${
    executionPlan!.permitRequired ? "✅ Yes (gasless)" : "❌ No"
  }\n\n`;

  // Execution Steps
  report += `🔧 **Execution Steps**\n`;
  executionPlan!.steps.forEach((step, index) => {
    const stepEmoji =
      { permit: "✍️", approval: "🔓", supply: "💰" }[step.type] || "🔧";
    report += `   ${index + 1}. ${stepEmoji} ${step.description}\n`;
  });
  report += `\n`;

  // Warnings and Recommendations
  if (preparation.warnings.length > 0) {
    report += `⚠️ **Warnings**\n`;
    preparation.warnings.forEach((warning) => {
      report += `   • ${warning}\n`;
    });
    report += `\n`;
  }

  if (preparation.recommendations.length > 0) {
    report += `💡 **Recommendations**\n`;
    preparation.recommendations.forEach((rec) => {
      report += `   • ${rec}\n`;
    });
    report += `\n`;
  }

  // Add implementation section
  report += `👨‍💻 **Implementation Code**\n`;
  report += `\`\`\`typescript\n`;
  report += generateSupplyCode(executionPlan!);
  report += `\n\`\`\`\n\n`;

  // Transaction cost estimates
  report += `💸 **Cost Estimates**\n`;
  if (executionPlan!.permitRequired) {
    report += `   • Gas Cost: ~1 transaction (permit + supply combined)\n`;
    report += `   • Signature Required: Yes (for permit)\n`;
  } else if (executionPlan!.type === "approval_required") {
    report += `   • Gas Cost: ~2 transactions (approval + supply)\n`;
    report += `   • Signature Required: Yes (for each transaction)\n`;
  } else {
    report += `   • Gas Cost: ~1 transaction (direct supply)\n`;
    report += `   • Signature Required: Yes\n`;
  }

  return report;
};

export const formatReserveForAnalysis = (
  reserve: Reserve,
  type: "supply" | "borrow"
): FormattedReserve => {
  const symbol = reserve.underlyingToken?.symbol || "Unknown";
  const name = reserve.underlyingToken?.name || "Unknown";

  // Get appropriate info based on type
  const info = type === "supply" ? reserve.supplyInfo : reserve.borrowInfo;
  const apy = info?.apy ? parseFloat(info.apy.value) * 100 : 0;

  // Get total amounts
  let totalValue = 0;
  let totalUsd = 0;

  if (type === "supply") {
    totalValue = reserve.supplyInfo?.total?.value
      ? parseFloat(reserve.supplyInfo.total.value)
      : 0;
    totalUsd = reserve.size?.usd ? parseFloat(reserve.size.usd) : 0;
  } else {
    totalValue = reserve?.borrowInfo?.total?.amount?.value
      ? parseFloat(reserve.borrowInfo.total.amount.value)
      : 0;
    totalUsd = reserve?.borrowInfo?.total?.usd?.value
      ? parseFloat(reserve.borrowInfo.total.usd.value)
      : 0;
  }

  return {
    symbol,
    name,
    type,
    apy,
    totalValue,
    totalUsd,
    utilizationRate: reserve.borrowInfo?.utilizationRate
      ? parseFloat(reserve.borrowInfo.utilizationRate.value) * 100
      : 0,
    liquidationThreshold: reserve.supplyInfo?.liquidationThreshold
      ? parseFloat(reserve.supplyInfo.liquidationThreshold.value) * 100
      : 0,
    maxLTV: reserve.supplyInfo?.maxLTV
      ? parseFloat(reserve.supplyInfo.maxLTV.value) * 100
      : 0,
    isFrozen: reserve.isFrozen || false,
    isPaused: reserve.isPaused || false,
    flashLoanEnabled: reserve.flashLoanEnabled || false,
    marketName: reserve.market?.name || "Unknown Market",
    address: reserve.market?.address || "Unknown Address",
  };
};

// Function 1: Find ETH-related reserves
export const findEthRelatedReserves = (
  data: Market[],
  params: EthRelatedReservesParams = {}
): string => {
  const { includeStaking = true } = params;

  if (!data || data.length === 0) {
    return "❌ No Aave market data available. Please ensure the component is loaded.";
  }

  const ethKeywords = includeStaking
    ? ["eth", "weth", "steth", "reth", "cbeth", "wsteth"]
    : ["eth", "weth"];

  const ethReserves: Array<{
    supply: FormattedReserve;
    borrow: FormattedReserve;
  }> = [];

  data.forEach((market: Market) => {
    [
      ...(market.supplyReserves || []),
      ...(market.borrowReserves || []),
    ].forEach((reserve: Reserve) => {
      const symbol = (reserve.underlyingToken?.symbol || "").toLowerCase();
      if (ethKeywords.some((keyword) => symbol.includes(keyword))) {
        const supplyData = formatReserveForAnalysis(reserve, "supply");
        const borrowData = formatReserveForAnalysis(reserve, "borrow");
        ethReserves.push({ supply: supplyData, borrow: borrowData });
      }
    });
  });

  if (ethReserves.length === 0) {
    return "🔍 No ETH-related reserves found in current Aave markets.";
  }

  const summary = ethReserves
    .map(({ supply, borrow }) => {
      return `\n🔹 **${supply.symbol}** (${
        supply.name
      })\n📈 Supply APY: ${supply.apy.toFixed(
        3
      )}% | Total: $${supply.totalUsd.toLocaleString()}\n📉 Borrow APY: ${borrow.apy.toFixed(
        3
      )}% | Total: $${borrow.totalUsd.toLocaleString()}\n⚡ Utilization: ${supply.utilizationRate.toFixed(
        2
      )}%\n🏦 Market: ${supply.marketName}`;
    })
    .join("\n");

  return `🔎 **ETH-Related Reserves Found**: ${ethReserves.length}\n${summary}`;
};

// Function 2: Find highest APY reserves
export const findHighestApyReserves = (
  data: Market[],
  params: HighestApyReservesParams = {}
): string => {
  const { type = "supply", limit = 10, minLiquidity = 0 } = params;

  if (!data || data.length === 0) {
    return "❌ No Aave market data available. Please ensure the component is loaded.";
  }

  const reserves: FormattedReserve[] = [];

  data.forEach((market: Market) => {
    const reserveList =
      type === "supply"
        ? market.supplyReserves || []
        : market.borrowReserves || [];

    reserveList.forEach((reserve: Reserve) => {
      const formatted = formatReserveForAnalysis(reserve, type);
      if (
        formatted.totalUsd >= minLiquidity &&
        !formatted.isFrozen &&
        !formatted.isPaused
      ) {
        reserves.push(formatted);
      }
    });
  });

  const sorted = reserves.sort((a, b) => b.apy - a.apy).slice(0, limit);

  if (sorted.length === 0) {
    return `🔍 No active ${type} reserves found with minimum liquidity of $${minLiquidity.toLocaleString()}.`;
  }

  const summary = sorted
    .map((reserve, index) => {
      return `\n${index + 1}. **${reserve.symbol}** - ${reserve.apy.toFixed(
        3
      )}%\n   💰 Total: $${reserve.totalUsd.toLocaleString()}\n   🏦 Market: ${
        reserve.marketName
      }\n   ${
        type === "supply"
          ? `🔒 Max LTV: ${reserve.maxLTV.toFixed(1)}%`
          : `⚡ Utilization: ${reserve.utilizationRate.toFixed(2)}%`
      }`;
    })
    .join("\n");

  return `🏆 **Top ${limit} Highest ${type.toUpperCase()} APY Reserves**\n${summary}`;
};

// Function 3: Find reserves by volume/liquidity
export const findReservesByVolume = (
  data: Market[],
  params: ReservesByVolumeParams
): string => {
  const { minVolume, maxVolume, type = "both", sortBy = "volume" } = params;

  if (!data || data.length === 0) {
    return "❌ No Aave market data available. Please ensure the component is loaded.";
  }

  const reserves: FormattedReserve[] = [];

  data.forEach((market: Market) => {
    const lists = [];
    if (type === "supply" || type === "both") {
      lists.push({ reserves: market.supplyReserves || [], type: "supply" });
    }
    if (type === "borrow" || type === "both") {
      lists.push({ reserves: market.borrowReserves || [], type: "borrow" });
    }

    lists.forEach(({ reserves: reserveList, type: reserveType }) => {
      reserveList.forEach((reserve: Reserve) => {
        const formatted = formatReserveForAnalysis(
          reserve,
          reserveType as "supply" | "borrow"
        );
        const volume = formatted.totalUsd;

        const matchesFilter =
          volume >= minVolume &&
          (maxVolume === undefined || volume <= maxVolume) &&
          !formatted.isFrozen &&
          !formatted.isPaused;

        if (matchesFilter) {
          reserves.push(formatted);
        }
      });
    });
  });

  if (reserves.length === 0) {
    const rangeText = maxVolume
      ? `between $${minVolume.toLocaleString()} and $${maxVolume.toLocaleString()}`
      : `above $${minVolume.toLocaleString()}`;
    return `🔍 No reserves found with volume ${rangeText}.`;
  }

  // Sort results
  const sorted = reserves.sort((a, b) => {
    switch (sortBy) {
      case "apy":
        return b.apy - a.apy;
      case "utilization":
        return b.utilizationRate - a.utilizationRate;
      case "volume":
      default:
        return b.totalUsd - a.totalUsd;
    }
  });

  const summary = sorted
    .slice(0, 15)
    .map((reserve, index) => {
      const typeEmoji = reserve.type === "supply" ? "📈" : "📉";
      return `\n${index + 1}. ${typeEmoji} **${reserve.symbol}** (${
        reserve.type
      })\n   💰 Volume: $${reserve.totalUsd.toLocaleString()}\n   📊 APY: ${reserve.apy.toFixed(
        3
      )}%\n   ⚡ Utilization: ${reserve.utilizationRate.toFixed(2)}%\n   🏦 ${
        reserve.marketName
      }`;
    })
    .join("\n");

  const rangeText = maxVolume
    ? `$${minVolume.toLocaleString()} - $${maxVolume.toLocaleString()}`
    : `$${minVolume.toLocaleString()}+`;

  return `💰 **Reserves by Volume** (${rangeText})\n📊 Found: ${reserves.length} reserves, sorted by ${sortBy}\n${summary}`;
};

// Function 4: Get market statistics and overview
export const getAaveMarketStats = (
  data: Market[],
  params: MarketStatsParams = {}
): string => {
  const { includeDetails = false } = params;

  if (!data || data.length === 0) {
    return "❌ No Aave market data available. Please ensure the component is loaded.";
  }

  let totalSupplyUsd = 0;
  let totalBorrowUsd = 0;
  let totalReserves = 0;
  let frozenReserves = 0;
  let pausedReserves = 0;
  const marketStats: Array<{
    name: string;
    supplyUsd: number;
    borrowUsd: number;
    reserves: number;
  }> = [];

  data.forEach((market: Market) => {
    const marketSupplyUsd = (market.supplyReserves || []).reduce(
      (sum: number, reserve: Reserve) => {
        const usd = reserve.size?.usd ? parseFloat(reserve.size.usd) : 0;
        return sum + usd;
      },
      0
    );

    const marketBorrowUsd = (market.borrowReserves || []).reduce(
      (sum: number, reserve: Reserve) => {
        const usd = reserve.borrowInfo?.total?.usd?.value
          ? parseFloat(reserve.borrowInfo.total.usd.value)
          : 0;
        return sum + usd;
      },
      0
    );

    const reserveCount =
      (market.supplyReserves?.length || 0) +
      (market.borrowReserves?.length || 0);

    totalSupplyUsd += marketSupplyUsd;
    totalBorrowUsd += marketBorrowUsd;
    totalReserves += reserveCount;

    // Count frozen/paused
    [
      ...(market.supplyReserves || []),
      ...(market.borrowReserves || []),
    ].forEach((reserve: Reserve) => {
      if (reserve.isFrozen) frozenReserves++;
      if (reserve.isPaused) pausedReserves++;
    });

    if (includeDetails) {
      marketStats.push({
        name: market.name || "Unknown Market",
        supplyUsd: marketSupplyUsd,
        borrowUsd: marketBorrowUsd,
        reserves: reserveCount,
      });
    }
  });

  const utilizationRate =
    totalSupplyUsd > 0 ? (totalBorrowUsd / totalSupplyUsd) * 100 : 0;

  let result = `\n📊 **Aave Markets Overview**\n\n💰 **Total Value Locked**\n   📈 Supply: $${totalSupplyUsd.toLocaleString()}\n   📉 Borrow: $${totalBorrowUsd.toLocaleString()}\n   ⚡ Utilization: ${utilizationRate.toFixed(
    2
  )}%\n\n📋 **Reserve Statistics**\n   🔢 Total Reserves: ${totalReserves}\n   ❄️ Frozen: ${frozenReserves}\n   ⏸️ Paused: ${pausedReserves}\n   🏦 Markets: ${
    data.length
  }`;

  if (includeDetails && marketStats.length > 0) {
    const marketDetails = marketStats
      .sort((a, b) => b.supplyUsd - a.supplyUsd)
      .map((market, index) => {
        return `\n${index + 1}. **${
          market.name
        }**\n   📈 Supply: $${market.supplyUsd.toLocaleString()}\n   📉 Borrow: $${market.borrowUsd.toLocaleString()}\n   🔢 Reserves: ${
          market.reserves
        }`;
      })
      .join("\n");

    result += `\n\n🏦 **Market Breakdown**${marketDetails}`;
  }

  return result;
};

// Function 5: Find reserves with specific characteristics
export const findReservesByCharacteristics = (
  data: Market[],
  params: ReservesByCharacteristicsParams = {}
): string => {
  const {
    minUtilization,
    maxUtilization,
    flashLoanEnabled,
    minLTV,
    maxLTV,
    excludeFrozen = true,
  } = params;

  if (!data || data.length === 0) {
    return "❌ No Aave market data available. Please ensure the component is loaded.";
  }

  const matchingReserves: Array<{
    supply: FormattedReserve;
    borrow: FormattedReserve;
  }> = [];

  data.forEach((market: Market) => {
    [
      ...(market.supplyReserves || []),
      ...(market.borrowReserves || []),
    ].forEach((reserve: Reserve) => {
      const supplyData = formatReserveForAnalysis(reserve, "supply");
      const borrowData = formatReserveForAnalysis(reserve, "borrow");

      // Apply filters
      const matchesUtilization =
        (minUtilization === undefined ||
          supplyData.utilizationRate >= minUtilization) &&
        (maxUtilization === undefined ||
          supplyData.utilizationRate <= maxUtilization);

      const matchesLTV =
        (minLTV === undefined || supplyData.maxLTV >= minLTV) &&
        (maxLTV === undefined || supplyData.maxLTV <= maxLTV);

      const matchesFlashLoan =
        flashLoanEnabled === undefined ||
        supplyData.flashLoanEnabled === flashLoanEnabled;

      const matchesFrozen =
        !excludeFrozen || (!supplyData.isFrozen && !supplyData.isPaused);

      if (
        matchesUtilization &&
        matchesLTV &&
        matchesFlashLoan &&
        matchesFrozen
      ) {
        matchingReserves.push({ supply: supplyData, borrow: borrowData });
      }
    });
  });

  if (matchingReserves.length === 0) {
    return "🔍 No reserves found matching the specified characteristics.";
  }

  const summary = matchingReserves
    .slice(0, 10)
    .map(({ supply, borrow }, index) => {
      return `\n${index + 1}. **${supply.symbol}** (${
        supply.name
      })\n   📈 Supply APY: ${supply.apy.toFixed(
        3
      )}% | $${supply.totalUsd.toLocaleString()}\n   📉 Borrow APY: ${borrow.apy.toFixed(
        3
      )}% | $${borrow.totalUsd.toLocaleString()}\n   ⚡ Utilization: ${supply.utilizationRate.toFixed(
        2
      )}%\n   🔒 Max LTV: ${supply.maxLTV.toFixed(1)}%\n   ⚡ Flash Loans: ${
        supply.flashLoanEnabled ? "✅" : "❌"
      }\n   🏦 ${supply.marketName}`;
    })
    .join("\n");

  const filters = [];
  if (minUtilization !== undefined)
    filters.push(`Min Util: ${minUtilization}%`);
  if (maxUtilization !== undefined)
    filters.push(`Max Util: ${maxUtilization}%`);
  if (flashLoanEnabled !== undefined)
    filters.push(`Flash Loans: ${flashLoanEnabled ? "Yes" : "No"}`);
  if (minLTV !== undefined) filters.push(`Min LTV: ${minLTV}%`);
  if (maxLTV !== undefined) filters.push(`Max LTV: ${maxLTV}%`);

  return `🎯 **Reserves by Characteristics**\n🔍 Filters: ${
    filters.join(", ") || "None"
  }\n📊 Found: ${matchingReserves.length} reserves\n${summary}`;
};

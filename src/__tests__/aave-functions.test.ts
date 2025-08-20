import { describe, it, expect } from "@jest/globals";
import { Market, Reserve } from "@aave/react";
import {
  findEthRelatedReserves,
  findHighestApyReserves,
  findReservesByVolume,
  getAaveMarketStats,
  findReservesByCharacteristics,
  formatReserveForAnalysis,
  validateSupplyOperation,
  extractSupplyReserveInfo,
  findSuitableSupplyReserves,
  analyzeSupplyReserve,
  getSupplyRecommendations,
  prepareSupplyExecution,
  analyzeAndPrepareSupply,
} from "../agents/aave-functions";

// Mock data for testing
const mockReserve: Reserve = {
  underlyingToken: {
    symbol: "ETH",
    name: "Ethereum",
    imageUrl: "https://example.com/eth.png",
  },
  supplyInfo: {
    apy: { value: "0.025" }, // 2.5% APY
    total: { value: "1000000" },
    liquidationThreshold: { value: "0.825" }, // 82.5%
    maxLTV: { value: "0.8" }, // 80%
  },
  borrowInfo: {
    apy: { value: "0.035" }, // 3.5% APY
    total: {
      amount: { value: "500000" },
      usd: { value: "1000000" },
    },
    utilizationRate: { value: "0.65" }, // 65%
  },
  size: {
    usd: "2000000",
  },
  isFrozen: false,
  isPaused: false,
  flashLoanEnabled: true,
  market: {
    name: "Aave V3 Ethereum",
    address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  },
} as Reserve;

const mockMarket: Market = {
  name: "Aave V3 Ethereum",
  address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  supplyReserves: [mockReserve],
  borrowReserves: [mockReserve],
} as Market;

const mockData: Market[] = [mockMarket];

describe("Aave Functions", () => {
  describe("formatReserveForAnalysis", () => {
    it("should format supply reserve data correctly", () => {
      const result = formatReserveForAnalysis(mockReserve, "supply");

      expect(result).toEqual(
        expect.objectContaining({
          symbol: "ETH",
          name: "Ethereum",
          type: "supply",
          apy: 2.5, // 0.025 * 100
          totalUsd: 2000000,
          utilizationRate: 65, // 0.65 * 100
          liquidationThreshold: 82.5, // 0.825 * 100
          maxLTV: 80, // 0.8 * 100
          isFrozen: false,
          isPaused: false,
          flashLoanEnabled: true,
          marketName: "Aave V3 Ethereum",
        })
      );
    });

    it("should format borrow reserve data correctly", () => {
      const result = formatReserveForAnalysis(mockReserve, "borrow");

      expect(result.symbol).toBe("ETH");
      expect(result.name).toBe("Ethereum");
      expect(result.type).toBe("borrow");
      expect(result.apy).toBeCloseTo(3.5, 1); // Allow for floating point precision
      expect(result.totalUsd).toBe(1000000);
      expect(result.utilizationRate).toBe(65);
    });

    it("should handle missing data gracefully", () => {
      const incompleteReserve = {
        underlyingToken: {},
        supplyInfo: {},
        borrowInfo: {},
      } as Reserve;

      const result = formatReserveForAnalysis(incompleteReserve, "supply");

      expect(result).toEqual(
        expect.objectContaining({
          symbol: "Unknown",
          name: "Unknown",
          apy: 0,
          totalValue: 0,
          totalUsd: 0,
          utilizationRate: 0,
          liquidationThreshold: 0,
          maxLTV: 0,
          isFrozen: false,
          isPaused: false,
          flashLoanEnabled: false,
          marketName: "Unknown Market",
          address: "Unknown Address",
        })
      );
    });
  });

  describe("findEthRelatedReserves", () => {
    it("should find ETH-related reserves", () => {
      const result = findEthRelatedReserves(mockData);

      expect(result).toContain("ETH-Related Reserves Found");
      expect(result).toContain("ETH");
      expect(result).toContain("Supply APY: 2.500%");
      expect(result).toContain("Borrow APY: 3.500%");
    });

    it("should handle empty data", () => {
      const result = findEthRelatedReserves([]);

      expect(result).toBe(
        "❌ No Aave market data available. Please ensure the component is loaded."
      );
    });

    it("should filter by staking tokens when includeStaking is false", () => {
      const result = findEthRelatedReserves(mockData, {
        includeStaking: false,
      });

      expect(result).toContain("ETH-Related Reserves Found");
    });
  });

  describe("findHighestApyReserves", () => {
    it("should find highest supply APY reserves", () => {
      const result = findHighestApyReserves(mockData, {
        type: "supply",
        limit: 5,
      });

      expect(result).toContain("Top 5 Highest SUPPLY APY Reserves");
      expect(result).toContain("ETH");
      expect(result).toContain("2.500%");
    });

    it("should find highest borrow APY reserves", () => {
      const result = findHighestApyReserves(mockData, {
        type: "borrow",
        limit: 5,
      });

      expect(result).toContain("Top 5 Highest BORROW APY Reserves");
      expect(result).toContain("ETH");
      expect(result).toContain("3.500%");
    });

    it("should filter by minimum liquidity", () => {
      const result = findHighestApyReserves(mockData, {
        type: "supply",
        limit: 5,
        minLiquidity: 5000000, // Higher than our mock data
      });

      expect(result).toContain("No active supply reserves found");
    });

    it("should handle empty data", () => {
      const result = findHighestApyReserves([]);

      expect(result).toBe(
        "❌ No Aave market data available. Please ensure the component is loaded."
      );
    });
  });

  describe("findReservesByVolume", () => {
    it("should find reserves by volume range", () => {
      const result = findReservesByVolume(mockData, {
        minVolume: 1000000,
        maxVolume: 5000000,
      });

      expect(result).toContain("Reserves by Volume");
      expect(result).toContain("ETH");
      expect(result).toContain("Volume: $2,000,000");
    });

    it("should sort by different criteria", () => {
      const result = findReservesByVolume(mockData, {
        minVolume: 0,
        sortBy: "apy",
      });

      expect(result).toContain("sorted by apy");
      expect(result).toContain("ETH");
    });

    it("should filter by reserve type", () => {
      const result = findReservesByVolume(mockData, {
        minVolume: 0,
        type: "supply",
      });

      expect(result).toContain("supply");
      expect(result).toContain("📈");
    });

    it("should handle no matching reserves", () => {
      const result = findReservesByVolume(mockData, {
        minVolume: 10000000, // Higher than any mock data
      });

      expect(result).toContain("No reserves found with volume");
    });
  });

  describe("getAaveMarketStats", () => {
    it("should provide basic market statistics", () => {
      const result = getAaveMarketStats(mockData);

      expect(result).toContain("Aave Markets Overview");
      expect(result).toContain("Total Value Locked");
      expect(result).toContain("Supply: $2,000,000");
      expect(result).toContain("Borrow: $1,000,000");
      expect(result).toContain("Utilization: 50.00%"); // 1M/2M * 100
      expect(result).toContain("Markets: 1");
    });

    it("should include detailed breakdown when requested", () => {
      const result = getAaveMarketStats(mockData, { includeDetails: true });

      expect(result).toContain("Market Breakdown");
      expect(result).toContain("Aave V3 Ethereum");
    });

    it("should handle empty data", () => {
      const result = getAaveMarketStats([]);

      expect(result).toBe(
        "❌ No Aave market data available. Please ensure the component is loaded."
      );
    });
  });

  describe("findReservesByCharacteristics", () => {
    it("should find reserves by utilization rate", () => {
      const result = findReservesByCharacteristics(mockData, {
        minUtilization: 60,
        maxUtilization: 70,
      });

      expect(result).toContain("Reserves by Characteristics");
      expect(result).toContain("ETH");
      expect(result).toContain("Utilization: 65.00%");
    });

    it("should filter by flash loan support", () => {
      const result = findReservesByCharacteristics(mockData, {
        flashLoanEnabled: true,
      });

      expect(result).toContain("Flash Loans: ✅");
    });

    it("should filter by LTV range", () => {
      const result = findReservesByCharacteristics(mockData, {
        minLTV: 75,
        maxLTV: 85,
      });

      expect(result).toContain("ETH");
      expect(result).toContain("Max LTV: 80.0%");
    });

    it("should exclude frozen reserves by default", () => {
      const frozenReserve = {
        ...mockReserve,
        isFrozen: true,
      } as Reserve;

      const marketWithFrozen: Market = {
        ...mockMarket,
        supplyReserves: [frozenReserve],
        borrowReserves: [frozenReserve],
      } as Market;

      const result = findReservesByCharacteristics([marketWithFrozen]);

      expect(result).toContain("No reserves found matching");
    });

    it("should include frozen reserves when excludeFrozen is false", () => {
      const frozenReserve = {
        ...mockReserve,
        isFrozen: true,
      } as Reserve;

      const marketWithFrozen: Market = {
        ...mockMarket,
        supplyReserves: [frozenReserve],
        borrowReserves: [frozenReserve],
      } as Market;

      const result = findReservesByCharacteristics([marketWithFrozen], {
        excludeFrozen: false,
      });

      expect(result).toContain("Found: 2 reserves"); // Both supply and borrow
    });

    it("should handle multiple filters", () => {
      const result = findReservesByCharacteristics(mockData, {
        minUtilization: 60,
        flashLoanEnabled: true,
        minLTV: 75,
      });

      expect(result).toContain(
        "Filters: Min Util: 60%, Flash Loans: Yes, Min LTV: 75%"
      );
    });
  });
});

// Integration test to ensure functions work together
describe("Aave Functions Integration", () => {
  it("should process the same data consistently across all functions", () => {
    const ethResult = findEthRelatedReserves(mockData);
    const apyResult = findHighestApyReserves(mockData);
    const volumeResult = findReservesByVolume(mockData, { minVolume: 0 });
    const statsResult = getAaveMarketStats(mockData);
    const characteristicsResult = findReservesByCharacteristics(mockData);

    // All functions should handle the data successfully
    expect(ethResult).not.toContain("❌");
    expect(apyResult).not.toContain("❌");
    expect(volumeResult).not.toContain("❌");
    expect(statsResult).not.toContain("❌");
    expect(characteristicsResult).not.toContain("❌");

    // All should reference the same token
    expect(ethResult).toContain("ETH");
    expect(apyResult).toContain("ETH");
    expect(volumeResult).toContain("ETH");
    expect(characteristicsResult).toContain("ETH");
  });
});

describe("Supply Functions", () => {
  describe("validateSupplyOperation", () => {
    it("should validate a good supply operation", () => {
      const result = validateSupplyOperation(mockReserve, "1.0", "0x123");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should catch frozen reserves", () => {
      const frozenReserve = {
        ...mockReserve,
        isFrozen: true,
      };
      const result = validateSupplyOperation(frozenReserve, "1.0");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Reserve is frozen and cannot accept supplies"
      );
    });

    it("should catch paused reserves", () => {
      const pausedReserve = {
        ...mockReserve,
        isPaused: true,
      };
      const result = validateSupplyOperation(pausedReserve, "1.0");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Reserve is paused and cannot accept supplies"
      );
    });
  });

  describe("extractSupplyReserveInfo", () => {
    it("should extract reserve information correctly", () => {
      const info = extractSupplyReserveInfo(mockReserve);
      expect(info.symbol).toBe("ETH");
      expect(info.name).toBe("Ethereum");
      expect(info.currentSupplyApy).toBe(2.5);
      expect(info.permitSupported).toBe(false);
      expect(info.acceptsNative).toBe(false);
    });

    it("should handle missing data gracefully", () => {
      const minimalReserve = {
        underlyingToken: { symbol: "TEST" },
      } as Reserve;
      const info = extractSupplyReserveInfo(minimalReserve);
      expect(info.symbol).toBe("TEST");
      expect(info.currentSupplyApy).toBe(0);
    });
  });

  describe("findSuitableSupplyReserves", () => {
    it("should find reserves with minimum APY", () => {
      const result = findSuitableSupplyReserves(mockData, {
        minApy: 2.0,
      });
      expect(result).toContain("ETH");
      expect(result).toContain("2.500%");
    });

    it("should handle no matching reserves", () => {
      const result = findSuitableSupplyReserves(mockData, {
        minApy: 10.0, // Very high APY
      });
      expect(result).toContain("No suitable supply reserves found");
    });

    it("should filter by risk level", () => {
      const result = findSuitableSupplyReserves(mockData, {
        maxRisk: "low",
      });
      expect(result).toContain("Maximum Risk: low");
    });
  });

  describe("analyzeSupplyReserve", () => {
    it("should analyze a reserve by symbol", () => {
      const result = analyzeSupplyReserve(mockData, { symbol: "ETH" });
      expect(result).toContain("Supply Analysis for ETH");
      expect(result).toContain("2.500%");
      expect(result).toContain("Permit Support");
    });

    it("should handle missing reserves", () => {
      const result = analyzeSupplyReserve(mockData, { symbol: "MISSING" });
      expect(result).toContain("Could not find supply reserve");
    });

    it("should analyze amount if provided", () => {
      const result = analyzeSupplyReserve(mockData, {
        symbol: "ETH",
        amount: "1.0",
      });
      expect(result).toContain("Amount Analysis");
      expect(result).toContain("Expected Annual Return");
    });
  });

  describe("getSupplyRecommendations", () => {
    it("should provide balanced recommendations by default", () => {
      const result = getSupplyRecommendations(mockData);
      expect(result).toContain("BALANCED");
      expect(result).toContain("Top");
      expect(result).toContain("ETH");
    });

    it("should handle maximize yield goal", () => {
      const result = getSupplyRecommendations(mockData, {
        goal: "maximize_yield",
      });
      expect(result).toContain("MAXIMIZE YIELD");
      expect(result).toContain("Highest yield strategy");
    });

    it("should handle minimize risk goal", () => {
      const result = getSupplyRecommendations(mockData, {
        goal: "minimize_risk",
      });
      expect(result).toContain("MINIMIZE RISK");
      expect(result).toContain("Low risk");
    });

    it("should filter by preferred tokens", () => {
      const result = getSupplyRecommendations(mockData, {
        preferredTokens: ["USDC"],
      });
      expect(result).toContain("USDC");
      expect(result).not.toContain("ETH");
    });

    it("should handle risk tolerance", () => {
      const result = getSupplyRecommendations(mockData, {
        riskTolerance: "conservative",
      });
      expect(result).toContain("conservative");
    });

    it("should handle no suitable recommendations", () => {
      const result = getSupplyRecommendations(mockData, {
        preferredTokens: ["NONEXISTENT"],
      });
      expect(result).toContain("No suitable recommendations found");
    });
  });

  describe("Supply Execution Functions", () => {
    const userAddress = "0x1234567890123456789012345678901234567890";

    describe("prepareSupplyExecution", () => {
      it("should prepare execution plan for valid supply", () => {
        const result = prepareSupplyExecution(mockReserve, "1.0", userAddress);
        expect(result.isReady).toBe(true);
        expect(result.executionPlan).toBeDefined();
        expect(result.executionPlan?.amount).toBe("1.0");
        expect(result.executionPlan?.userAddress).toBe(userAddress);
      });

      it("should handle permit execution type", () => {
        const permitReserve = {
          ...mockReserve,
          permitSupported: true,
        };
        const result = prepareSupplyExecution(
          permitReserve,
          "1.0",
          userAddress,
          {
            usePermit: true,
          }
        );
        expect(result.isReady).toBe(true);
        expect(result.executionPlan?.type).toBe("permit");
        expect(result.executionPlan?.permitRequired).toBe(true);
      });

      it("should handle native token supply rejection", () => {
        const result = prepareSupplyExecution(mockReserve, "1.0", userAddress, {
          useNative: true,
        });
        expect(result.isReady).toBe(false);
        expect(result.errors).toContain(
          "ETH does not support native token supply"
        );
      });

      it("should handle on behalf of", () => {
        const onBehalfOf = "0x9876543210987654321098765432109876543210";
        const result = prepareSupplyExecution(mockReserve, "1.0", userAddress, {
          onBehalfOf,
        });
        expect(result.isReady).toBe(true);
        expect(result.executionPlan?.onBehalfOf).toBe(onBehalfOf);
      });

      it("should fail for invalid native token use", () => {
        const nonNativeReserve = {
          ...mockReserve,
          underlyingToken: {
            ...mockReserve.underlyingToken,
            symbol: "USDC",
          },
        };
        const result = prepareSupplyExecution(
          nonNativeReserve,
          "1.0",
          userAddress,
          {
            useNative: true,
          }
        );
        expect(result.isReady).toBe(false);
        expect(result.errors).toContain(
          "USDC does not support native token supply"
        );
      });
    });

    describe("analyzeAndPrepareSupply", () => {
      it("should analyze and prepare supply with execution plan", () => {
        const result = analyzeAndPrepareSupply(mockData, {
          symbol: "ETH",
          amount: "1.0",
          userAddress,
        });
        expect(result).toContain("Supply Execution Plan for ETH");
        expect(result).toContain("Ready for Execution");
        expect(result).toContain("Execution Details");
        expect(result).toContain("Implementation Code");
      });

      it("should handle missing required parameters", () => {
        const result = analyzeAndPrepareSupply(mockData, {
          symbol: "ETH",
          amount: "",
          userAddress,
        });
        expect(result).toContain("Please provide a valid amount to supply");
      });

      it("should handle missing user address", () => {
        const result = analyzeAndPrepareSupply(mockData, {
          symbol: "ETH",
          amount: "1.0",
          userAddress: "",
        });
        expect(result).toContain(
          "User address is required for supply preparation"
        );
      });

      it("should handle missing token", () => {
        const result = analyzeAndPrepareSupply(mockData, {
          symbol: "MISSING",
          amount: "1.0",
          userAddress,
        });
        expect(result).toContain("Could not find supply reserve for MISSING");
      });

      it("should show approval required when permit not available", () => {
        const result = analyzeAndPrepareSupply(mockData, {
          symbol: "ETH",
          amount: "1.0",
          userAddress,
          usePermit: true,
        });
        expect(result).toContain("APPROVAL REQUIRED");
        expect(result).toContain("does not support permit");
      });

      it("should include code generation", () => {
        const result = analyzeAndPrepareSupply(mockData, {
          symbol: "ETH",
          amount: "1.0",
          userAddress,
        });
        expect(result).toContain("```typescript");
        expect(result).toContain("useSupply");
        expect(result).toContain("sendTransaction");
      });
    });
  });
});

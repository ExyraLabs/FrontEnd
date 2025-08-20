// Example usage of extracted Aave functions for testing and reuse

import { Market } from "@aave/react";
import {
  findEthRelatedReserves,
  findHighestApyReserves,
  findReservesByVolume,
  getAaveMarketStats,
  findReservesByCharacteristics,
  formatReserveForAnalysis,
  findSuitableSupplyReserves,
  analyzeSupplyReserve,
  getSupplyRecommendations,
  analyzeAndPrepareSupply,
  prepareSupplyExecution,
  type EthRelatedReservesParams,
  type HighestApyReservesParams,
  type ReservesByVolumeParams,
  type MarketStatsParams,
  type ReservesByCharacteristicsParams,
} from "./aave-functions";

/**
 * Example service class showing how to use the extracted Aave functions
 * This demonstrates how the functions can be used independently of the React component
 */
export class AaveAnalyticsService {
  private marketData: Market[];

  constructor(marketData: Market[]) {
    this.marketData = marketData;
  }

  // Method to get ETH-related analysis
  async getEthAnalysis(includeStaking = true): Promise<string> {
    return findEthRelatedReserves(this.marketData, { includeStaking });
  }

  // Method to get top performers
  async getTopPerformers(
    type: "supply" | "borrow" = "supply",
    limit = 10
  ): Promise<string> {
    return findHighestApyReserves(this.marketData, { type, limit });
  }

  // Method to get reserves by volume range
  async getReservesByVolume(
    minVolume: number,
    maxVolume?: number
  ): Promise<string> {
    return findReservesByVolume(this.marketData, { minVolume, maxVolume });
  }

  // Method to get comprehensive market overview
  async getMarketOverview(includeDetails = false): Promise<string> {
    return getAaveMarketStats(this.marketData, { includeDetails });
  }

  // Method to get customized reserve search
  async findCustomReserves(criteria: {
    minUtilization?: number;
    maxUtilization?: number;
    flashLoanEnabled?: boolean;
    minLTV?: number;
    maxLTV?: number;
  }): Promise<string> {
    return findReservesByCharacteristics(this.marketData, criteria);
  }

  // Method to format individual reserve data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatReserve(reserve: any, type: "supply" | "borrow") {
    return formatReserveForAnalysis(reserve, type);
  }

  // Utility method to update market data
  updateMarketData(newData: Market[]): void {
    this.marketData = newData;
  }

  // Method to get high-yield, low-risk recommendations
  async getRecommendations(): Promise<{
    highYield: string;
    lowRisk: string;
    balanced: string;
  }> {
    const [highYield, lowRisk, balanced] = await Promise.all([
      this.getTopPerformers("supply", 5),
      this.findCustomReserves({
        maxUtilization: 60,
        minLTV: 70,
        flashLoanEnabled: true,
      }),
      this.getReservesByVolume(1000000, 10000000),
    ]);

    return {
      highYield,
      lowRisk,
      balanced,
    };
  }
}

/**
 * Example of using the functions in a simple script or analysis tool
 */
export async function performAaveAnalysis(marketData: Market[]) {
  console.log("🔍 Starting Aave Market Analysis...\n");

  // 1. Get overall market stats
  const marketStats = getAaveMarketStats(marketData, { includeDetails: true });
  console.log("📊 Market Overview:");
  console.log(marketStats);
  console.log("\n" + "=".repeat(50) + "\n");

  // 2. Find ETH-related opportunities
  const ethAnalysis = findEthRelatedReserves(marketData, {
    includeStaking: true,
  });
  console.log("🔹 ETH-Related Analysis:");
  console.log(ethAnalysis);
  console.log("\n" + "=".repeat(50) + "\n");

  // 3. Get top APY opportunities
  const topSupply = findHighestApyReserves(marketData, {
    type: "supply",
    limit: 5,
    minLiquidity: 100000,
  });
  console.log("🏆 Top Supply Opportunities:");
  console.log(topSupply);
  console.log("\n" + "=".repeat(50) + "\n");

  // 4. Find high-volume, stable reserves
  const stableReserves = findReservesByVolume(marketData, {
    minVolume: 10000000, // $10M+
    sortBy: "utilization",
  });
  console.log("💰 High-Volume Reserves:");
  console.log(stableReserves);
  console.log("\n" + "=".repeat(50) + "\n");

  // 5. Custom search for specific criteria
  const customSearch = findReservesByCharacteristics(marketData, {
    minUtilization: 40,
    maxUtilization: 80,
    flashLoanEnabled: true,
    minLTV: 60,
  });
  console.log("🎯 Custom Search Results:");
  console.log(customSearch);

  // 6. Find suitable supply opportunities
  const supplyOpportunities = findSuitableSupplyReserves(marketData, {
    minApy: 3.0,
    maxRisk: "medium",
    includeNative: true,
    minLiquidity: 10000000, // $10M minimum liquidity
  });
  console.log("💰 Supply Opportunities:");
  console.log(supplyOpportunities);

  // 7. Analyze specific reserve for supply
  const ethSupplyAnalysis = analyzeSupplyReserve(marketData, {
    symbol: "ETH",
    amount: "5.0",
    userAddress: "0x1234567890123456789012345678901234567890",
  });
  console.log("🔍 ETH Supply Analysis:");
  console.log(ethSupplyAnalysis);

  // 8. Get personalized supply recommendations
  const supplyRecommendations = getSupplyRecommendations(marketData, {
    goal: "balanced",
    amount: "10000",
    preferredTokens: ["ETH", "USDC", "DAI"],
    riskTolerance: "moderate",
  });
  console.log("🎯 Supply Recommendations:");
  console.log(supplyRecommendations);

  // 9. Prepare supply execution plan
  const userAddress = "0x1234567890123456789012345678901234567890";
  const executionPrep = analyzeAndPrepareSupply(marketData, {
    symbol: "ETH",
    amount: "2.0",
    userAddress,
    useNative: true,
    usePermit: true,
  });
  console.log("🚀 Execution Plan:");
  console.log(executionPrep);

  // 10. Direct execution planning (for programmatic use)
  const ethReserve = marketData[0]?.supplyReserves?.[0];
  if (ethReserve) {
    const directExecution = prepareSupplyExecution(
      ethReserve,
      "1.0",
      userAddress,
      {
        useNative: false,
        usePermit: true,
      }
    );
    console.log("⚙️ Direct Execution Plan:");
    console.log(directExecution);
  }
}

/**
 * Example of unit testing individual functions
 */
export function createTestData(): Market[] {
  // This would be replaced with actual test data
  return [] as Market[];
}

// Export types for external use
export type {
  EthRelatedReservesParams,
  HighestApyReservesParams,
  ReservesByVolumeParams,
  MarketStatsParams,
  ReservesByCharacteristicsParams,
};

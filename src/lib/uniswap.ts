// ===== Gas Cost Calculation Service =====
// Extracted to avoid ethers v5/v6 compatibility issues with @uniswap/v4-sdk
import { formatUnits } from "viem";

// Etherscan API response type
interface EtherscanGasResponse {
  status: string;
  message: string;
  result: {
    LastBlock: string;
    SafeGasPrice: string;
    ProposeGasPrice: string;
    FastGasPrice: string;
    suggestBaseFee: string;
    gasUsedRatio: string;
  };
}

// Gas cost calculation result type
interface GasCostResult {
  gasUnits: string;
  gasPriceGwei: string;
  gasCostEth: string;
  gasCostUsdc: string;
  gasCostWei: string;
  gasSpeed: "safe" | "standard" | "fast";
}

// Gas cost calculation service
export class GasCostService {
  private static readonly ETHERSCAN_API_KEY =
    "1EV4J4J2KTNXBH21NV6DG4IQKIRE2SF6B4";
  private static readonly ETHERSCAN_GAS_API = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${this.ETHERSCAN_API_KEY}`;

  /**
   * Fetch current gas prices from Etherscan
   */
  private static async fetchGasPrices(): Promise<
    EtherscanGasResponse["result"]
  > {
    try {
      const response = await fetch(this.ETHERSCAN_GAS_API);
      const data: EtherscanGasResponse = await response.json();

      if (data.status === "1" && data.result) {
        return data.result;
      } else {
        throw new Error("Failed to fetch gas prices from Etherscan");
      }
    } catch (error) {
      console.error("Error fetching gas prices:", error);
      // Fallback to default gas prices
      return {
        LastBlock: "0",
        SafeGasPrice: "20",
        ProposeGasPrice: "25",
        FastGasPrice: "30",
        suggestBaseFee: "18",
        gasUsedRatio: "0.5",
      };
    }
  }

  /**
   * Calculate gas costs in ETH and USDC
   */
  static async calculateGasCosts(
    gasUnits: bigint,
    ethPriceInUsdc: number,
    gasSpeed: "safe" | "standard" | "fast" = "standard"
  ): Promise<GasCostResult> {
    // Fetch current gas prices
    const gasPrices = await this.fetchGasPrices();

    // Select gas price based on speed preference
    let gasPriceGwei: string;
    switch (gasSpeed) {
      case "safe":
        gasPriceGwei = gasPrices.SafeGasPrice;
        break;
      case "fast":
        gasPriceGwei = gasPrices.FastGasPrice;
        break;
      case "standard":
      default:
        gasPriceGwei = gasPrices.ProposeGasPrice;
        break;
    }

    // Convert gas price from gwei to wei
    const gasPriceGweiBigInt = BigInt(
      Math.floor(parseFloat(gasPriceGwei) * 1000000000)
    );

    // Calculate total gas cost in wei
    const gasCostWei = gasUnits * gasPriceGweiBigInt;

    // Convert to ETH (18 decimals)
    const gasCostEth = formatUnits(gasCostWei, 18);

    // Convert to USDC
    const gasCostUsdc = (Number(gasCostEth) * ethPriceInUsdc).toFixed(6);

    return {
      gasUnits: gasUnits.toString(),
      gasPriceGwei: parseFloat(gasPriceGwei).toFixed(2),
      gasCostEth,
      gasCostUsdc,
      gasCostWei: gasCostWei.toString(),
      gasSpeed,
    };
  }

  /**
   * Calculate gas costs with automatic ETH price detection
   */
  static async calculateGasCostsWithAutoPrice(
    gasUnits: bigint,
    tokenInSymbol: string,
    tokenOutSymbol: string,
    pricePerToken: number,
    gasSpeed: "safe" | "standard" | "fast" = "standard"
  ): Promise<GasCostResult> {
    // Determine ETH price in USDC
    let ethPriceInUsdc: number;

    if (
      tokenInSymbol.toLowerCase() === "eth" &&
      tokenOutSymbol.toLowerCase() === "usdc"
    ) {
      ethPriceInUsdc = pricePerToken;
    } else if (
      tokenInSymbol.toLowerCase() === "usdc" &&
      tokenOutSymbol.toLowerCase() === "eth"
    ) {
      ethPriceInUsdc = 1 / pricePerToken;
    } else {
      // Default ETH price estimate - you could enhance this by fetching from a price API
      ethPriceInUsdc = 3000; // $3000 per ETH as fallback
    }

    return this.calculateGasCosts(gasUnits, ethPriceInUsdc, gasSpeed);
  }
}

// Export the interface for external use
export type { GasCostResult, EtherscanGasResponse };

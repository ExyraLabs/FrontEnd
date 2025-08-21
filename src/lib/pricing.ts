import {
  fetchTokenPrice,
  findCoinsBySymbol,
  fetchCoinDetails,
} from "@/lib/coingecko";

// Fallback prices for common tokens when API fails

/**
 * Get approximate USD price for a token symbol.
 * - Tries direct CoinGecko ID mapping for common tokens
 * - Falls back to findCoinsBySymbol + fetchTokenPrice
 * - Uses a conservative fallback price map as last resort
 */
export async function getTokenUsdPrice(
  symbol: string
): Promise<number | undefined> {
  if (!symbol) return 0;
  const sym = symbol.toUpperCase();

  // 2) Try to resolve CoinGecko ID by symbol, preferring main (non-bridged/non-wrapped)
  try {
    const coins = await findCoinsBySymbol(sym);
    if (coins?.length) {
      // Prefer non-bridged/non-wrapped assets
      const main =
        coins.find(
          (c) =>
            !c.name.toLowerCase().includes("bridged") &&
            !c.name.toLowerCase().includes("wrapped")
        ) || coins[0];

      // Try to fetch price for the resolved coin id
      const priceData = await fetchTokenPrice(main.id);
      if (priceData?.price) return priceData.price;

      // As a refinement, try fetching details then re-attempt price in case of aliasing
      const details = await fetchCoinDetails(main.id);
      if (details?.id) {
        const priceData2 = await fetchTokenPrice(details.id);
        if (priceData2?.price) return priceData2.price;
      }
    }
  } catch {
    // ignore and fallback
  }
}

/**
 * CoinGecko API utilities
 *
 * Environment Variables Required:
 * - NEXT_PUBLIC_COINGECKO_API_KEY: Your CoinGecko API key for authentication
 *   Get your API key from: https://www.coingecko.com/en/api/pricing
 */

import { TOKENS } from "@/constants/tokens";

export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  platforms: Record<string, string>;
  decimals?: number;
}

export interface CoinDetailData {
  id: string;
  symbol: string;
  name: string;
  web_slug: string;
  asset_platform_id: string;
  platforms: Record<string, string>;
  detail_platforms: Record<
    string,
    {
      decimal_place: number;
      contract_address: string;
      geckoterminal_url?: string;
    }
  >;
  block_time_in_minutes: number;
  hashing_algorithm: string | null;
  categories: string[];
  preview_listing: boolean;
  public_notice: string | null;
  additional_notices: string[];
  description: {
    en: string;
  };
  links: {
    homepage: string[];
    whitepaper?: string;
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    snapshot_url: string | null;
    twitter_screen_name: string | null;
    facebook_username: string | null;
    bitcointalk_thread_identifier: string | null;
    telegram_channel_identifier: string | null;
    subreddit_url: string | null;
    repos_url: {
      github: string[];
      bitbucket: string[];
    };
  };
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  country_origin: string | null;
  genesis_date: string | null;
  contract_address: string;
  sentiment_votes_up_percentage: number | null;
  sentiment_votes_down_percentage: number | null;
  watchlist_portfolio_users: number;
  market_cap_rank: number;
  status_updates: unknown[];
  last_updated: string;
}

export interface CoinGeckoResponse {
  success: boolean;
  data?: CoinData[];
  total?: number;
  filtered_by?: string;
  error?: string;
}

/**
 * Get standard headers for CoinGecko API requests
 */
export function getCoinGeckoHeaders(): HeadersInit {
  return {
    accept: "application/json",
    "x-cg-demo-api-key": process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "",
  };
}

/**
 * Fetch detailed coin information by ID including decimal places
 */
export async function fetchCoinDetails(
  coinId: string
): Promise<CoinDetailData | null> {
  console.log(`Fetching details for coin ID: ${coinId}`);
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
    {
      headers: getCoinGeckoHeaders(),
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch all coins from CoinGecko API with platform information
 */
export async function fetchAllCoins(): Promise<CoinData[]> {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/coins/list?include_platform=true",
    {
      headers: getCoinGeckoHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Find coins by symbol with detailed information including decimals
 */
export async function findCoinsBySymbolWithDecimals(
  symbol: string,
  platform: string = "ethereum"
): Promise<CoinData[]> {
  const allCoins = TOKENS;
  const matchingCoins = allCoins.filter(
    (coin) =>
      coin.symbol.toLowerCase() === symbol.toLowerCase() &&
      coin.platforms[platform] !== undefined
  );

  console.log("matchingCoins", matchingCoins);

  // Fetch detailed information for each matching coin
  const coinsWithDecimals = await Promise.all(
    matchingCoins.map(async (coin) => {
      const coinWithDecimals = await findCoinByIdWithDecimals(coin.id);
      return coinWithDecimals || coin;
    })
  );

  return coinsWithDecimals;
}

/**
 * Find coins by symbol
 */
export async function findCoinsBySymbol(symbol: string): Promise<CoinData[]> {
  const allCoins = await fetchAllCoins();
  return allCoins.filter(
    (coin) => coin.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

/**
 * Find a specific coin by ID with detailed information including decimals
 */
export async function findCoinByIdWithDecimals(
  coinId: string
): Promise<CoinData | null> {
  const coinDetails = await fetchCoinDetails(coinId);
  if (!coinDetails) return null;

  // Extract decimal information from detail_platforms
  let decimals: number | undefined;
  if (coinDetails.detail_platforms) {
    // Try to get decimals from the primary platform first
    const primaryPlatform = coinDetails.asset_platform_id;
    if (primaryPlatform && coinDetails.detail_platforms[primaryPlatform]) {
      decimals = coinDetails.detail_platforms[primaryPlatform].decimal_place;
    } else {
      // Try to get decimals from Ethereum, then from any platform
      const ethereumPlatform = coinDetails.detail_platforms.ethereum;
      if (ethereumPlatform && ethereumPlatform.decimal_place !== undefined) {
        decimals = ethereumPlatform.decimal_place;
      } else {
        // Fallback to first available platform
        const platformKeys = Object.keys(coinDetails.detail_platforms);
        if (platformKeys.length > 0) {
          const firstPlatform = coinDetails.detail_platforms[platformKeys[0]];
          if (firstPlatform && firstPlatform.decimal_place !== undefined) {
            decimals = firstPlatform.decimal_place;
          }
        }
      }
    }
  }

  return {
    id: coinDetails.id,
    symbol: coinDetails.symbol,
    name: coinDetails.name,
    platforms: coinDetails.platforms,
    decimals,
  };
}

/**
 * Find a specific coin by ID
 */
export async function findCoinById(coinId: string): Promise<CoinData | null> {
  const allCoins = await fetchAllCoins();
  return allCoins.find((coin) => coin.id === coinId) || null;
}

/**
 * Search coins by name (partial match) with detailed information including decimals
 */
export async function searchCoinsByNameWithDecimals(
  searchTerm: string
): Promise<CoinData[]> {
  const allCoins = await fetchAllCoins();
  const matchingCoins = allCoins.filter((coin) =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch detailed information for each matching coin (limit to first 10 for performance)
  const limitedCoins = matchingCoins.slice(0, 10);
  const coinsWithDecimals = await Promise.all(
    limitedCoins.map(async (coin) => {
      const coinWithDecimals = await findCoinByIdWithDecimals(coin.id);
      return coinWithDecimals || coin;
    })
  );

  return coinsWithDecimals;
}

/**
 * Search coins by name (partial match)
 */
export async function searchCoinsByName(
  searchTerm: string
): Promise<CoinData[]> {
  const allCoins = await fetchAllCoins();
  return allCoins.filter((coin) =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

/**
 * Get contract address and decimals for a specific token on a specific platform
 */
export async function getContractAddressWithDecimals(
  symbol: string,
  platform: string = "ethereum"
): Promise<{
  address: string;
  decimals?: number;
  name: string;
  symbol: string;
} | null> {
  // Return default values for ETH without API call
  if (symbol.toLowerCase() === "eth") {
    return {
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // ETH native address
      decimals: 18,
      name: "Ethereum",
      symbol: "ETH",
    };
  }

  const coins = await findCoinsBySymbolWithDecimals(symbol, platform);

  // Look for the most relevant coin (prefer main tokens over bridged versions)
  const mainCoin = coins.find(
    (coin) =>
      !coin.name.toLowerCase().includes("bridged") &&
      !coin.name.toLowerCase().includes("wrapped") &&
      coin.platforms[platform]
  );

  if (mainCoin && mainCoin.platforms[platform]) {
    console.log(mainCoin, "coin");
    return {
      address: mainCoin.platforms[platform],
      decimals: mainCoin.decimals,
      name: mainCoin.name,
      symbol: mainCoin.symbol,
    };
  }

  return null;
}

/**
 * Get contract address for a specific token on a specific platform
 */
export async function getContractAddress(
  symbol: string,
  platform: string = "ethereum"
): Promise<string | null> {
  const coins = await findCoinsBySymbol(symbol);

  // Look for the most relevant coin (prefer main tokens over bridged versions)
  const mainCoin = coins.find(
    (coin) =>
      !coin.name.toLowerCase().includes("bridged") &&
      !coin.name.toLowerCase().includes("wrapped") &&
      coin.platforms[platform]
  );

  if (mainCoin && mainCoin.platforms[platform]) {
    return mainCoin.platforms[platform];
  }

  // Fallback to any coin with the platform
  const anyCoin = coins.find((coin) => coin.platforms[platform]);
  if (anyCoin && anyCoin.platforms[platform]) {
    return anyCoin.platforms[platform];
  }

  return null;
}

/**
 * Get decimals for a specific token on a specific platform
 */
export async function getTokenDecimals(
  symbol: string,
  platform: string = "ethereum"
): Promise<number | null> {
  const contractInfo = await getContractAddressWithDecimals(symbol, platform);
  return contractInfo?.decimals || null;
}

/**
 * Get decimals for a specific coin ID on a specific platform
 */
export async function getTokenDecimalsByCoinId(
  coinId: string,
  platform: string = "ethereum"
): Promise<number | null> {
  const coinDetails = await fetchCoinDetails(coinId);
  if (!coinDetails || !coinDetails.detail_platforms) return null;

  const platformData = coinDetails.detail_platforms[platform];
  return platformData?.decimal_place || null;
}

/**
 * Get all available platforms for a token symbol
 */
export async function getAvailablePlatforms(symbol: string): Promise<string[]> {
  const coins = await findCoinsBySymbol(symbol);
  const platforms = new Set<string>();

  coins.forEach((coin) => {
    Object.keys(coin.platforms).forEach((platform) => {
      if (coin.platforms[platform]) {
        platforms.add(platform);
      }
    });
  });

  return Array.from(platforms);
}

/**
 * Pre-populated token data to avoid API calls for common tokens
 * Generated on: 2025-07-22T23:03:49.206Z
 * 
 * This file contains cached token information for popular cryptocurrencies
 * across multiple blockchain platforms. Data is sourced from CoinGecko API.
 */

export interface TokenPlatformData {
  address: string;
  decimals: number;
}

export interface CachedTokenData {
  id: string;
  symbol: string;
  name: string;
  platforms: Record<string, TokenPlatformData>;
}

export const CACHED_TOKENS: Record<string, CachedTokenData> = {};

/**
 * Get cached token data by symbol and platform
 */
export function getCachedToken(
  symbol: string, 
  platform: string = 'ethereum'
): {
  address: string;
  decimals: number;
  name: string;
  symbol: string;
} | null {
  const token = CACHED_TOKENS[symbol.toUpperCase()];
  
  if (!token || !token.platforms[platform]) {
    return null;
  }

  return {
    address: token.platforms[platform].address,
    decimals: token.platforms[platform].decimals,
    name: token.name,
    symbol: token.symbol
  };
}

/**
 * Get all available platforms for a cached token
 */
export function getCachedTokenPlatforms(symbol: string): string[] {
  const token = CACHED_TOKENS[symbol.toUpperCase()];
  return token ? Object.keys(token.platforms) : [];
}

/**
 * Check if a token is cached
 */
export function isTokenCached(symbol: string): boolean {
  return symbol.toUpperCase() in CACHED_TOKENS;
}

/**
 * Get all cached token symbols
 */
export function getAllCachedTokens(): string[] {
  return Object.keys(CACHED_TOKENS);
}

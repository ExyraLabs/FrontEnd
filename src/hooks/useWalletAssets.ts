import { useState, useEffect } from "react";
import { Alchemy, Network } from "alchemy-sdk";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import {
  fetchTokenPrice,
  findCoinsBySymbol,
  fetchCoinDetails,
} from "../lib/coingecko";

export interface WalletAsset {
  symbol: string;
  amount: number;
  price: number;
  usdValue: number;
  icon: string;
  contractAddress?: string;
  decimals?: number;
  name?: string;
}

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY || "demo"; // Replace with your actual API key

// Token icon mapping for common tokens
const TOKEN_ICONS: Record<string, string> = {
  ETH: "/icons/ethereum.svg",
  WETH: "/icons/ethereum.svg",
  BTC: "/icons/bitcoin.svg",
  WBTC: "/icons/bitcoin.svg",
  USDC: "/icons/usdc.svg",
  USDT: "/icons/usdt.svg",
  DAI: "/icons/dai.svg",
  LINK: "/icons/chainlink.svg",
  UNI: "/icons/uniswap.png",
  AAVE: "/icons/aave.svg",
  MATIC: "/icons/polygon.svg",
  LOVE: "/icons/exyra.svg",
  SKYOPS: "/icons/skyops.svg",
  stETH: "/icons/lido.png",
  STETH: "/icons/lido.png",
  // Add more token mappings as needed
};

// Fallback prices for common tokens when API fails
const getFallbackPrice = (tokenSymbol: string): number => {
  const fallbackPrices: Record<string, number> = {
    ETH: 4180.0,
    WETH: 4180.0,
    BTC: 65000.0,
    WBTC: 65000.0,
    USDC: 1.0,
    USDT: 1.0,
    DAI: 1.0,
    LINK: 25.0,
    UNI: 15.0,
    AAVE: 180.0,
    MATIC: 0.8,
    stETH: 4150.0,
    STETH: 4150.0,
    SKYOPS: 0.5, // Add SKYOPS fallback
  };

  const price = fallbackPrices[tokenSymbol.toUpperCase()] || 1.0;
  console.log(`Using fallback price for ${tokenSymbol}: $${price}`);
  return price;
};

// Helper function to fetch token prices and images using the existing CoinGecko library
const getTokenPriceAndImage = async (
  tokenSymbol: string
): Promise<{
  price: number;
  image?: string;
}> => {
  try {
    console.log(`Fetching price and image for ${tokenSymbol}`);

    // Direct mapping to avoid bridged tokens and ensure we get the main token
    const directMappings: Record<string, string> = {
      ETH: "ethereum",
      WETH: "weth",
      BTC: "bitcoin",
      WBTC: "wrapped-bitcoin",
      USDC: "usd-coin",
      USDT: "tether",
      stETH: "staked-ether",
      STETH: "staked-ether",
      DAI: "dai",
      LINK: "chainlink",
      UNI: "uniswap",
      AAVE: "aave",
      MATIC: "matic-network",
    };

    // First try direct mapping for common tokens
    const directId = directMappings[tokenSymbol.toUpperCase()];
    if (directId) {
      console.log(`Using direct mapping for ${tokenSymbol}: ${directId}`);
      const [priceData, coinDetails] = await Promise.all([
        fetchTokenPrice(directId),
        fetchCoinDetails(directId).catch(() => null),
      ]);

      if (priceData && priceData.price) {
        console.log(`Price for ${tokenSymbol}: $${priceData.price}`);
        const imageUrl = coinDetails?.image?.small || coinDetails?.image?.thumb;
        return {
          price: priceData.price,
          image: imageUrl,
        };
      }
    }

    // If direct mapping fails, try to find the correct CoinGecko ID
    const coins = await findCoinsBySymbol(tokenSymbol);

    if (coins && coins.length > 0) {
      // Filter out bridged tokens and prefer main tokens
      const mainCoins = coins.filter(
        (coin) =>
          !coin.name.toLowerCase().includes("bridged") &&
          !coin.name.toLowerCase().includes("wrapped") &&
          !coin.id.includes("bridged") &&
          !coin.id.includes("wrapped")
      );

      // Use main coin if available, otherwise use the first one
      const selectedCoin = mainCoins.length > 0 ? mainCoins[0] : coins[0];
      const tokenId = selectedCoin.id;

      console.log(`Found CoinGecko ID for ${tokenSymbol}: ${tokenId}`);

      const [priceData, coinDetails] = await Promise.all([
        fetchTokenPrice(tokenId),
        fetchCoinDetails(tokenId).catch(() => null),
      ]);

      if (priceData && priceData.price) {
        console.log(`Price for ${tokenSymbol}: $${priceData.price}`);
        const imageUrl = coinDetails?.image?.small || coinDetails?.image?.thumb;
        return {
          price: priceData.price,
          image: imageUrl,
        };
      }
    } else {
      console.warn(`No CoinGecko data found for ${tokenSymbol}`);
    }

    console.warn(`No price data found for ${tokenSymbol}, using fallback`);
    return {
      price: getFallbackPrice(tokenSymbol),
    };
  } catch (err) {
    console.warn(`Failed to fetch price and image for ${tokenSymbol}:`, err);
    return {
      price: getFallbackPrice(tokenSymbol),
    };
  }
};

const getNetworkFromChainId = (chainId: number): Network => {
  switch (chainId) {
    case 1:
      return Network.ETH_MAINNET;
    case 137:
      return Network.MATIC_MAINNET;
    case 10:
      return Network.OPT_MAINNET;
    case 42161:
      return Network.ARB_MAINNET;
    case 8453:
      return Network.BASE_MAINNET;
    case 5:
      return Network.ETH_GOERLI;
    case 11155111:
      return Network.ETH_SEPOLIA;
    default:
      return Network.ETH_MAINNET;
  }
};

export const useWalletAssets = () => {
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAppKitAccount();
  const { caipNetworkId } = useAppKitNetwork();

  useEffect(() => {
    const fetchAssets = async () => {
      if (!address || !isConnected) {
        setAssets([]);
        setTotalBalance(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Extract chain ID from CAIP network ID (format: "eip155:1" -> 1)
        const chainId = caipNetworkId
          ? parseInt(caipNetworkId.split(":")[1])
          : 1;
        const network = getNetworkFromChainId(chainId);

        const alchemy = new Alchemy({
          apiKey: ALCHEMY_API_KEY,
          network: network,
        });

        // Fetch native token balance (ETH)
        const ethBalance = await alchemy.core.getBalance(address, "latest");
        const ethBalanceInEth = parseFloat(ethBalance.toString()) / 1e18;

        // Fetch token balances
        const tokenBalances = await alchemy.core.getTokenBalances(address);

        const assetsWithMetadata: WalletAsset[] = [];
        let totalUsdValue = 0;

        // Add ETH to assets if balance > 0
        if (ethBalanceInEth > 0) {
          // Fetch ETH price and image
          const ethData = await getTokenPriceAndImage("ETH");
          const ethUsdValue = ethBalanceInEth * ethData.price;

          assetsWithMetadata.push({
            symbol: "ETH",
            amount: ethBalanceInEth,
            price: ethData.price,
            usdValue: ethUsdValue,
            icon: ethData.image || TOKEN_ICONS["ETH"] || "/icons/ethereum.svg",
            name: "Ethereum",
            decimals: 18,
          });

          totalUsdValue += ethUsdValue;
        }

        // Process token balances
        for (const tokenBalance of tokenBalances.tokenBalances) {
          if (
            tokenBalance.tokenBalance &&
            tokenBalance.tokenBalance !== "0x0"
          ) {
            try {
              // Get token metadata
              const metadata = await alchemy.core.getTokenMetadata(
                tokenBalance.contractAddress
              );

              if (metadata.symbol && metadata.decimals) {
                // Use BigInt for precise calculation of token balances
                const balanceBigInt = BigInt(tokenBalance.tokenBalance);
                const decimalsBigInt = BigInt(10 ** metadata.decimals);
                const balance = Number(balanceBigInt) / Number(decimalsBigInt);

                if (balance > 0) {
                  // Fetch token price and image using symbol
                  const tokenData = await getTokenPriceAndImage(
                    metadata.symbol
                  );
                  const usdValue = balance * tokenData.price;

                  assetsWithMetadata.push({
                    symbol: metadata.symbol,
                    amount: balance,
                    price: tokenData.price,
                    usdValue: usdValue,
                    icon:
                      tokenData.image ||
                      TOKEN_ICONS[metadata.symbol] ||
                      "/icons/default-token.svg",
                    contractAddress: tokenBalance.contractAddress,
                    name: metadata.name || metadata.symbol,
                    decimals: metadata.decimals,
                  });

                  totalUsdValue += usdValue;
                }
              }
            } catch (err) {
              console.warn(
                `Failed to get metadata for token ${tokenBalance.contractAddress}:`,
                err
              );
            }
          }
        }

        // Sort assets by USD value (highest first)
        assetsWithMetadata.sort((a, b) => b.usdValue - a.usdValue);

        setAssets(assetsWithMetadata);
        setTotalBalance(totalUsdValue);
      } catch (err) {
        console.error("Error fetching wallet assets:", err);
        setError("Failed to fetch wallet assets");

        // Fallback to dummy data if API fails
        setAssets([
          {
            symbol: "ETH",
            amount: 0.014,
            price: 3814.5,
            usdValue: 53.46,
            icon: "/icons/ethereum.svg",
            name: "Ethereum",
            decimals: 18,
          },
          {
            symbol: "LOVE",
            amount: 0.014,
            price: 3814.5,
            usdValue: 53.46,
            icon: "/icons/exyra.svg",
            name: "Love Token",
            decimals: 18,
          },
        ]);
        setTotalBalance(106.92);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [address, isConnected, caipNetworkId]);

  const refetchAssets = async () => {
    if (!address || !isConnected) {
      setAssets([]);
      setTotalBalance(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Extract chain ID from CAIP network ID (format: "eip155:1" -> 1)
      const chainId = caipNetworkId ? parseInt(caipNetworkId.split(":")[1]) : 1;
      const network = getNetworkFromChainId(chainId);

      const alchemy = new Alchemy({
        apiKey: ALCHEMY_API_KEY,
        network: network,
      });

      // Fetch native token balance (ETH)
      const ethBalance = await alchemy.core.getBalance(address, "latest");
      const ethBalanceInEth = parseFloat(ethBalance.toString()) / 1e18;

      // Fetch token balances
      const tokenBalances = await alchemy.core.getTokenBalances(address);

      const assetsWithMetadata: WalletAsset[] = [];
      let totalUsdValue = 0;

      // Add ETH to assets if balance > 0
      if (ethBalanceInEth > 0) {
        // Fetch ETH price and image
        const ethData = await getTokenPriceAndImage("ETH");
        const ethUsdValue = ethBalanceInEth * ethData.price;

        assetsWithMetadata.push({
          symbol: "ETH",
          amount: ethBalanceInEth,
          price: ethData.price,
          usdValue: ethUsdValue,
          icon: ethData.image || TOKEN_ICONS["ETH"] || "/icons/ethereum.svg",
          name: "Ethereum",
          decimals: 18,
        });

        totalUsdValue += ethUsdValue;
      }

      // Process token balances
      for (const tokenBalance of tokenBalances.tokenBalances) {
        if (tokenBalance.tokenBalance && tokenBalance.tokenBalance !== "0x0") {
          try {
            // Get token metadata
            const metadata = await alchemy.core.getTokenMetadata(
              tokenBalance.contractAddress
            );

            if (metadata.symbol && metadata.decimals) {
              // Use BigInt for precise calculation of token balances
              const balanceBigInt = BigInt(tokenBalance.tokenBalance);
              const decimalsBigInt = BigInt(10 ** metadata.decimals);
              const balance = Number(balanceBigInt) / Number(decimalsBigInt);

              console.log(
                `Token: ${metadata.symbol}, Raw Balance: ${tokenBalance.tokenBalance}, Decimals: ${metadata.decimals}, Parsed Balance: ${balance}`
              );

              if (balance > 0) {
                // Fetch token price and image using symbol
                const tokenData = await getTokenPriceAndImage(metadata.symbol);
                const usdValue = balance * tokenData.price;
                console.log(tokenData, "tokenData");

                console.log(
                  `${metadata.symbol}: ${balance} tokens at $${tokenData.price} = $${usdValue}`
                );

                assetsWithMetadata.push({
                  symbol: metadata.symbol,
                  amount: balance,
                  price: tokenData.price,
                  usdValue: usdValue,
                  icon:
                    tokenData.image ||
                    TOKEN_ICONS[metadata.symbol] ||
                    "/icons/default-token.svg",
                  contractAddress: tokenBalance.contractAddress,
                  name: metadata.name || metadata.symbol,
                  decimals: metadata.decimals,
                });

                totalUsdValue += usdValue;
              }
            }
          } catch (err) {
            console.warn(
              `Failed to get metadata for token ${tokenBalance.contractAddress}:`,
              err
            );
          }
        }
      }

      // Sort assets by USD value (highest first)
      assetsWithMetadata.sort((a, b) => b.usdValue - a.usdValue);

      setAssets(assetsWithMetadata);
      setTotalBalance(totalUsdValue);
    } catch (err) {
      console.error("Error fetching wallet assets:", err);
      setError("Failed to fetch wallet assets");

      // Fallback to dummy data if API fails
      setAssets([
        {
          symbol: "ETH",
          amount: 0.014,
          price: 3814.5,
          usdValue: 53.46,
          icon: "/icons/ethereum.svg",
          name: "Ethereum",
          decimals: 18,
        },
        {
          symbol: "LOVE",
          amount: 0.014,
          price: 3814.5,
          usdValue: 53.46,
          icon: "/icons/exyra.svg",
          name: "Love Token",
          decimals: 18,
        },
      ]);
      setTotalBalance(106.92);
    } finally {
      setLoading(false);
    }
  };

  return {
    assets,
    totalBalance,
    loading,
    error,
    refetch: refetchAssets,
  };
};

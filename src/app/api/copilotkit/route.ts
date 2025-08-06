import { findCoinsBySymbol, getCoinGeckoHeaders } from "@/lib/coingecko";
// import { MCPClient } from "@/lib/mcp-client";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";

import { NextRequest } from "next/server";

// const serviceAdapter = new AnthropicAdapter();
const serviceAdapter = new OpenAIAdapter({ model: "gpt-4o" });

const runtime = new CopilotRuntime({
  // Temporarily disable MCP client to troubleshoot tool call issues
  // createMCPClient: async (config) => {
  //   const mcpClient = new MCPClient({
  //     serverUrl: config.endpoint,
  //   });
  //   await mcpClient.connect();
  //   return mcpClient;
  // },
  actions: [
    {
      name: "getTokenPriceById",
      description:
        "Get the current price of a cryptocurrency token using CoinGecko API by the coin_id. Returns price, 24h change, and market cap information.",
      parameters: [
        {
          name: "coin_id",
          type: "string",
          description:
            "The CoinGecko coin ID (e.g., 'ethereum', 'bitcoin', 'usd-coin')",
          required: true,
        },
      ],
      handler: async ({ coin_id }: { coin_id: string }) => {
        try {
          console.log(`[getTokenPriceById] Called with coin_id: ${coin_id}`);
          const coinId = coin_id.toLowerCase();
          if (!coinId) {
            const errorMsg = "❌ Error: coin_id parameter is required.";
            console.log(`[getTokenPriceById] ${errorMsg}`);
            return errorMsg;
          }

          const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;

          const response = await fetch(url, {
            headers: getCoinGeckoHeaders(),
          });

          if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
          }

          const data = await response.json();

          if (coinId in data) {
            const priceData = data[coinId];
            const price = priceData.usd;
            const change24h = priceData.usd_24h_change || 0;
            const marketCap = priceData.usd_market_cap || 0;

            let result = `💰 ${coinId.toUpperCase()} Price Information:\n`;
            result += `💵 Price: $${price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}\n`;
            result += `📈 24h Change: ${
              change24h >= 0 ? "+" : ""
            }${change24h.toFixed(2)}%\n`;
            if (marketCap > 0) {
              result += `🏦 Market Cap: $${marketCap.toLocaleString()}\n`;
            }

            console.log(`[getTokenPriceById] Returning result:`, result);
            return result;
          } else {
            const errorMsg = `❌ Token '${coinId}' not found. Please use the fetchCoinId action first to get the correct coin_id, or try common IDs like 'bitcoin', 'ethereum', 'usd-coin'.`;
            console.log(`[getTokenPriceById] ${errorMsg}`);
            return { error: true, message: errorMsg };
          }
        } catch (error) {
          console.error(
            `[getTokenPriceById] Error fetching price for ${coin_id}:`,
            error
          );

          // Provide more descriptive error messages based on error type
          let userFriendlyError = "Unknown error occurred";

          if (error instanceof Error) {
            if (
              error.message.includes("fetch failed") ||
              error.message.includes("ETIMEDOUT")
            ) {
              userFriendlyError = `⚠️ Network timeout error while fetching price for "${coin_id}". The CoinGecko API is currently slow or unreachable. Please try again in a few moments.`;
            } else if (
              error.message.includes("ENOTFOUND") ||
              error.message.includes("DNS")
            ) {
              userFriendlyError = `🌐 Network connection error while fetching price for "${coin_id}". Please check your internet connection and try again.`;
            } else if (
              error.message.includes("429") ||
              error.message.includes("rate limit")
            ) {
              userFriendlyError = `⏱️ API rate limit exceeded while fetching price for "${coin_id}". Please wait a moment and try again.`;
            } else if (error.message.includes("404")) {
              userFriendlyError = `❌ Token "${coin_id}" not found. Please verify the coin ID is correct.`;
            } else if (
              error.message.includes("500") ||
              error.message.includes("502") ||
              error.message.includes("503")
            ) {
              userFriendlyError = `🔧 CoinGecko API is currently experiencing issues while fetching price for "${coin_id}". Please try again later.`;
            } else {
              userFriendlyError = `❌ Error fetching price for "${coin_id}": ${error.message}`;
            }
          }

          const errorMsg = userFriendlyError;
          console.log(`[getTokenPriceById] Returning error:`, errorMsg);
          return { error: true, message: errorMsg };
        }
      },
    },
    {
      name: "fetchCoinId",
      description:
        "Fetches coin ID from the coin gecko API for a given token  .",
      parameters: [
        {
          name: "token_symbol",
          type: "string",
          description: "The symbol of the token to fetch data for.",
          required: true,
        },
      ],
      handler: async ({ token_symbol }: { token_symbol: string }) => {
        try {
          console.log(
            `[fetchCoinId] Called with token_symbol: ${token_symbol}`
          );
          // Use utility function to find coins by symbol
          const filteredCoins = await findCoinsBySymbol(token_symbol);

          if (filteredCoins.length === 0) {
            return {
              error: true,
              message: `🔍 **Coin not found**: "${token_symbol}" didn't match any cryptocurrency. Try using the full name (e.g., "Bitcoin" instead of "BTC") or verify the spelling.`,
            };
          }

          let result = `🔍 Found ${filteredCoins.length} match(es) for "${token_symbol}":\n\n`;
          filteredCoins.slice(0, 5).forEach((coin, index) => {
            result += `${index + 1}. **${
              coin.name
            }** (${coin.symbol.toUpperCase()})\n`;
            result += `   🆔 Coin ID: \`${coin.id}\`\n\n`;
          });

          if (filteredCoins.length > 5) {
            result += `... and ${filteredCoins.length - 5} more results.\n\n`;
          }

          result += `💡 Use the coin ID (e.g., "${filteredCoins[0].id}") with getTokenPriceById to get price information.`;

          console.log(`[fetchCoinId] Returning result:`, result);
          return result;
        } catch (error) {
          console.error(`[fetchCoinId] Error:`, error);

          // Provide more descriptive error messages based on error type
          let userFriendlyError = "Unknown error occurred";

          if (error instanceof Error) {
            if (
              error.message.includes("fetch failed") ||
              error.message.includes("ETIMEDOUT")
            ) {
              userFriendlyError = `⚠️ Network timeout error while searching for "${token_symbol}". The CoinGecko API is currently slow or unreachable. Please try again in a few moments, or check if the token symbol is correct.`;
            } else if (
              error.message.includes("ENOTFOUND") ||
              error.message.includes("DNS")
            ) {
              userFriendlyError = `🌐 Network connection error while searching for "${token_symbol}". Please check your internet connection and try again.`;
            } else if (
              error.message.includes("429") ||
              error.message.includes("rate limit")
            ) {
              userFriendlyError = `⏱️ API rate limit exceeded while searching for "${token_symbol}". Please wait a moment and try again.`;
            } else if (error.message.includes("404")) {
              userFriendlyError = `❌ Token "${token_symbol}" not found in the CoinGecko database. Please verify the token symbol is correct.`;
            } else {
              userFriendlyError = `❌ Error searching for "${token_symbol}": ${error.message}`;
            }
          }

          console.log(`[fetchCoinId] Returning error:`, userFriendlyError);
          return { error: true, message: userFriendlyError };
        }
      },
    },
  ],
});

export const POST = async (req: NextRequest) => {
  try {
    console.log("[CopilotKit API] Received POST request");

    // Log the request body to understand what messages are being sent
    const requestBody = await req.text();
    try {
      const parsedBody = JSON.parse(requestBody);
      if (parsedBody.messages) {
        console.log(
          "[CopilotKit API] Messages being processed:",
          parsedBody.messages.map((msg: unknown, i: number) => ({
            index: i,
            id: (msg as Record<string, unknown>).id,
            role: (msg as Record<string, unknown>).role,
            type: (msg as Record<string, unknown>).type,
            tool_calls: (msg as Record<string, unknown>).tool_calls
              ? ((msg as Record<string, unknown>).tool_calls as unknown[])
                  .length
              : 0,
            tool_call_id: (msg as Record<string, unknown>).tool_call_id,
          }))
        );
      }
    } catch {
      console.log("[CopilotKit API] Could not parse request body for logging");
    }

    // Create a new request with the body
    const newReq = new NextRequest(req.url, {
      method: req.method,
      headers: req.headers,
      body: requestBody,
    });

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    const response = await handleRequest(newReq);
    console.log("[CopilotKit API] Request handled successfully");
    return response;
  } catch (error) {
    console.error("[CopilotKit API] Error handling request:", error);

    // Log the error details if it's an OpenAI error
    if (error && typeof error === "object" && "status" in error) {
      console.error("[CopilotKit API] OpenAI Error Details:", {
        status: (error as Record<string, unknown>).status,
        message: (error as Record<string, unknown>).message,
        error: (error as Record<string, unknown>).error,
        code: (error as Record<string, unknown>).code,
        param: (error as Record<string, unknown>).param,
        type: (error as Record<string, unknown>).type,
      });
    }

    // Re-throw the error to let CopilotKit handle it
    throw error;
  }
};

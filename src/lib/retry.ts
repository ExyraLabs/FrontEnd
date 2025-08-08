/**
 * Retry utility for API calls with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

export interface RetryableError extends Error {
  shouldRetry?: boolean;
  statusCode?: number;
}

/**
 * Default retry condition - retries on network errors and 5xx status codes
 */
const defaultRetryCondition = (error: unknown): boolean => {
  if (error instanceof Error) {
    // Network timeouts and connection errors
    if (
      error.message.includes("fetch failed") ||
      error.message.includes("ETIMEDOUT") ||
      error.message.includes("ENOTFOUND") ||
      error.message.includes("DNS")
    ) {
      return true;
    }

    // Rate limiting - should retry with backoff
    if (error.message.includes("429") || error.message.includes("rate limit")) {
      return true;
    }

    // Server errors (5xx) - should retry
    if (
      error.message.includes("500") ||
      error.message.includes("502") ||
      error.message.includes("503") ||
      error.message.includes("504")
    ) {
      return true;
    }
  }

  // Check if it's a RetryableError with explicit shouldRetry flag
  if (typeof error === "object" && error !== null && "shouldRetry" in error) {
    return !!(error as RetryableError).shouldRetry;
  }

  return false;
};

/**
 * Sleep for a given number of milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number => {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Add jitter (±25% randomization)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  const delayWithJitter = exponentialDelay + jitter;

  // Cap at maxDelay
  return Math.min(delayWithJitter, maxDelay);
};

/**
 * Retry an async function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryCondition = defaultRetryCondition,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (!retryCondition(error)) {
        break;
      }

      // Calculate delay for this attempt
      const delay = calculateDelay(attempt, baseDelay, maxDelay);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(error, attempt + 1);
      }

      console.warn(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms:`,
        error instanceof Error ? error.message : String(error)
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  // If we get here, all retries failed
  throw lastError;
}

/**
 * Retry wrapper specifically for fetch requests
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, options);

    // Check if response indicates a retryable error
    if (!response.ok) {
      const error: RetryableError = new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
      error.statusCode = response.status;

      // Mark as retryable based on status code
      error.shouldRetry =
        response.status >= 500 || // Server errors
        response.status === 429 || // Rate limiting
        response.status === 408; // Request timeout

      throw error;
    }

    return response;
  }, retryOptions);
}

/**
 * Default retry options for CoinGecko API
 */
export const COINGECKO_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  onRetry: (error, attempt) => {
    console.log(
      `[CoinGecko API] Retry attempt ${attempt}:`,
      error instanceof Error ? error.message : String(error)
    );
  },
};

// A simplified rate limiter that doesn't use LRU cache
// This is a temporary solution until we fix the LRU cache issue

interface RateLimitOptions {
  interval: number;
  uniqueTokenPerInterval: number;
}

interface RateLimiter {
  check: (limit: number, token: string) => Promise<void>;
}

export const rateLimit = ({ interval, uniqueTokenPerInterval }: RateLimitOptions): RateLimiter => {
  const tokenCache = new Map();
  
  return {
    check: (limit: number, token: string) => {
      const now = Date.now();
      const tokenCount = tokenCache.get(token) || [];
      
      // Remove timestamps older than the interval
      const validTokenCount = tokenCount.filter((timestamp: number) => now - timestamp < interval);
      
      // Check if the token has exceeded the limit
      if (validTokenCount.length >= limit) {
        const error = new Error('Rate limit exceeded') as any;
        error.statusCode = 429;
        throw error;
      }
      
      // Add the current timestamp to the token count
      tokenCache.set(token, [...validTokenCount, now]);
      
      // Clean up old tokens every hour
      if (tokenCache.size > uniqueTokenPerInterval) {
        const oldestToken = [...tokenCache.entries()]
          .sort((a, b) => a[1][0] - b[1][0])[0][0];
        tokenCache.delete(oldestToken);
      }
      
      return Promise.resolve();
    }
  };
}; 
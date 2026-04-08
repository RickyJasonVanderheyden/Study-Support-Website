/**
 * Rate limiter for Gemini API calls
 * Free tier limits: 15 requests/minute, 1500 requests/day
 */

class GeminiRateLimiter {
  constructor() {
    this.requestTimes = [];
    this.maxRequestsPerMinute = 10; // Conservative limit (free tier is 15)
    this.minDelayBetweenRequests = 5000; // 5 seconds between requests
    this.lastRequestTime = 0;
    this.retryAfter = 0; // Timestamp when we can retry after a 429
  }

  /**
   * Wait if needed to respect rate limits
   */
  async waitForRateLimit() {
    const now = Date.now();
    
    // If we got a 429, wait until retry time
    if (this.retryAfter > now) {
      const waitTime = this.retryAfter - now + 1000;
      console.log(`⏳ Rate limit (429 recovery): waiting ${Math.ceil(waitTime/1000)}s...`);
      await this.sleep(waitTime);
    }
    
    // Clean up old request times (older than 1 minute)
    this.requestTimes = this.requestTimes.filter(t => now - t < 60000);
    
    // Check if we've hit the per-minute limit
    if (this.requestTimes.length >= this.maxRequestsPerMinute) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = 60000 - (now - oldestRequest) + 1000; // Wait until oldest expires + 1s buffer
      if (waitTime > 0) {
        console.log(`⏳ Rate limit: waiting ${Math.ceil(waitTime/1000)}s before next request...`);
        await this.sleep(waitTime);
      }
    }
    
    // Ensure minimum delay between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelayBetweenRequests) {
      const waitTime = this.minDelayBetweenRequests - timeSinceLastRequest;
      console.log(`⏳ Waiting ${Math.ceil(waitTime/1000)}s before next API call...`);
      await this.sleep(waitTime);
    }
    
    // Record this request
    this.lastRequestTime = Date.now();
    this.requestTimes.push(this.lastRequestTime);
  }

  /**
   * Call this when you get a 429 rate limit error
   * @param {number} retryAfterSeconds - Seconds to wait before retrying
   */
  handleRateLimitError(retryAfterSeconds = 60) {
    this.retryAfter = Date.now() + (retryAfterSeconds * 1000);
    console.log(`🚫 Rate limited! Will retry after ${retryAfterSeconds}s`);
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   */
  getStatus() {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(t => now - t < 60000);
    return {
      requestsInLastMinute: this.requestTimes.length,
      maxRequestsPerMinute: this.maxRequestsPerMinute,
      remainingRequests: this.maxRequestsPerMinute - this.requestTimes.length
    };
  }
}

// Export singleton instance
module.exports = new GeminiRateLimiter();

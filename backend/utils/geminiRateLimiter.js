/**
 * Rate limiter for Gemini API calls
 * GO Tier limits: 15 requests/minute, 1500 requests/day, 32k TPM
 */

class GeminiRateLimiter {
  constructor() {
    this.requestTimes = [];
    // GO tier allows 15 RPM - use 12 for safety margin (80% utilization)
    this.maxRequestsPerMinute = parseInt(process.env.GEMINI_RPM || '12', 10);
    // Minimum delay between requests (5s = 12 requests per minute)
    this.minDelayBetweenRequests = parseInt(process.env.GEMINI_MIN_DELAY_MS || '5000', 10);
    // Wait time after 429 error (65s to ensure we're past the rate limit window)
    this.rateLimitWaitMs = parseInt(process.env.GEMINI_RATE_LIMIT_WAIT_MS || '65000', 10);
    this.lastRequestTime = 0;
    this.isRateLimited = false;
    this.rateLimitResetTime = 0;
  }

  /**
   * Wait if needed to respect rate limits
   */
  async waitForRateLimit() {
    const now = Date.now();
    
    // If we're rate limited, wait until reset time
    if (this.isRateLimited && this.rateLimitResetTime > now) {
      const waitTime = this.rateLimitResetTime - now;
      console.log(`🔴 Rate limited (429): waiting ${Math.ceil(waitTime/1000)}s for reset...`);
      await this.sleep(waitTime);
      this.isRateLimited = false;
    }
    
    // Clean up old request times (older than 1 minute)
    this.requestTimes = this.requestTimes.filter(t => now - t < 60000);
    
    // Check if we've hit the per-minute limit
    if (this.requestTimes.length >= this.maxRequestsPerMinute) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = 60000 - (now - oldestRequest) + 500; // Wait until oldest expires + 0.5s buffer
      if (waitTime > 0) {
        console.log(`⏳ RPM limit (${this.maxRequestsPerMinute}/min): waiting ${Math.ceil(waitTime/1000)}s...`);
        await this.sleep(waitTime);
        // Recalculate after waiting
        this.requestTimes = this.requestTimes.filter(t => Date.now() - t < 60000);
      }
    }
    
    // Ensure minimum delay between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelayBetweenRequests) {
      const waitTime = this.minDelayBetweenRequests - timeSinceLastRequest;
      console.log(`⏳ Min delay: waiting ${Math.ceil(waitTime/1000)}s...`);
      await this.sleep(waitTime);
    }
    
    // Record this request
    this.lastRequestTime = Date.now();
    this.requestTimes.push(this.lastRequestTime);
  }

  /**
   * Call this when you get a 429 rate limit error
   * Actually waits for the rate limit to reset
   * @param {number} retryAfterSeconds - Seconds to wait before retrying
   */
  async handleRateLimitError(retryAfterSeconds = 60) {
    const safeSeconds = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? Math.min(retryAfterSeconds, 61)
      : 60;
    
    // Add buffer to ensure we're past the rate limit window
    const waitMs = (safeSeconds * 1000) + this.rateLimitWaitMs;
    this.isRateLimited = true;
    this.rateLimitResetTime = Date.now() + waitMs;
    
    console.log(`🚫 Rate limited (429)! Waiting ${Math.ceil(waitMs/1000)}s (retry-after: ${safeSeconds}s)...`);
    await this.sleep(waitMs);
    
    this.isRateLimited = false;
  }

  /**
   * Parse retry delay from Gemini/Google API error text.
   */
  extractRetryAfterSeconds(error) {
    const message = String(error?.message || error || '');

    // Matches: "Please retry in 42.40s" or "retryDelay":"42s"
    const retryInMatch = message.match(/Please retry in\s+([\d.]+)s/i);
    if (retryInMatch) return Math.ceil(parseFloat(retryInMatch[1]));

    const retryDelayMatch = message.match(/"retryDelay"\s*:\s*"(\d+)s"/i);
    if (retryDelayMatch) return parseInt(retryDelayMatch[1], 10);

    return 60;
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
      remainingRequests: Math.max(0, this.maxRequestsPerMinute - this.requestTimes.length),
      isRateLimited: this.isRateLimited,
      rateLimitResetTimeMs: this.isRateLimited ? Math.max(0, this.rateLimitResetTime - now) : 0
    };
  }
}

// Export singleton instance
module.exports = new GeminiRateLimiter();

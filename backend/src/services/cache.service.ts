import { getRedisClient, getIsRedisAvailable } from "../config/redis";

interface MemoryCacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

class CacheService {
  private memoryCache: Map<string, MemoryCacheEntry<any>> = new Map();
  private popularSearchMemory: Map<string, number> = new Map();
  private maxMemoryEntries = 1000;

  /**
   * Get cached item by key
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (getIsRedisAvailable()) {
        const client = getRedisClient();
        if (client) {
          const raw = await client.get(key);
          if (raw !== null) {
            return JSON.parse(raw) as T;
          }
        }
      }
    } catch (err: any) {
      // Redis failed, fall back to memory
    }

    // In-memory fallback
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set cached item with TTL in seconds
   */
  async set(key: string, value: any, ttlSeconds: number = 120): Promise<void> {
    try {
      if (getIsRedisAvailable()) {
        const client = getRedisClient();
        if (client) {
          await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
          return;
        }
      }
    } catch (err: any) {
      // Redis set failed, proceed to memory cache
    }

    // In-memory fallback
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      // Evict oldest entries
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  /**
   * Delete specific cache key
   */
  async del(key: string): Promise<void> {
    try {
      if (getIsRedisAvailable()) {
        const client = getRedisClient();
        if (client) {
          await client.del(key);
        }
      }
    } catch (err: any) { }

    this.memoryCache.delete(key);
  }

  /**
   * Invalidate all keys matching prefix/pattern (e.g. "search:*")
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      if (getIsRedisAvailable()) {
        const client = getRedisClient();
        if (client) {
          const keys = await client.keys(pattern);
          if (keys && keys.length > 0) {
            await client.del(...keys);
          }
        }
      }
    } catch (err: any) { }

    // In-memory wildcard matching
    const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Track search query popularity
   */
  async trackSearchQuery(query: string): Promise<void> {
    const normalized = query.trim().toLowerCase();
    if (!normalized || normalized.length < 2) return;

    try {
      if (getIsRedisAvailable()) {
        const client = getRedisClient();
        if (client) {
          await client.zincrby("search:popular_queries", 1, normalized);
          await this.delByPattern("search:popular:*");
          return;
        }
      }
    } catch (err: any) { }

    // In-memory fallback
    const current = this.popularSearchMemory.get(normalized) || 0;
    this.popularSearchMemory.set(normalized, current + 1);
    await this.delByPattern("search:popular:*");
  }

  /**
   * Get top popular search queries (only queries with count >= minThreshold)
   */
  async getPopularSearches(
    limit: number = 8,
    minThreshold: number = 3
  ): Promise<Array<{ query: string; count: number }>> {
    try {
      if (getIsRedisAvailable()) {
        const client = getRedisClient();
        if (client) {
          // ZREVRANGE search:popular_queries 0 (limit * 3) WITHSCORES to allow threshold filtering
          const raw = await client.zrevrange("search:popular_queries", 0, limit * 3 - 1, "WITHSCORES");
          const results: Array<{ query: string; count: number }> = [];
          for (let i = 0; i < raw.length; i += 2) {
            const count = Number(raw[i + 1]) || 0;
            if (count >= minThreshold) {
              results.push({
                query: raw[i],
                count,
              });
            }
          }
          if (results.length > 0) return results.slice(0, limit);
        }
      }
    } catch (err: any) { }

    // In-memory fallback: only include queries searched at least minThreshold times
    const sorted = Array.from(this.popularSearchMemory.entries())
      .filter(([_, count]) => count >= minThreshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));

    return sorted;
  }
}

export const cacheService = new CacheService();
export default cacheService;


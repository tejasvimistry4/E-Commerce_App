import Redis from "ioredis";

// Optional REDIS_URL from environment, default to localhost:6379
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let redisClient: Redis | null = null;
let isRedisAvailable = false;

try {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      // If redis is not running, do not spam retries indefinitely
      if (times > 3) {
        return null; // Stop retrying
      }
      return Math.min(times * 100, 1000);
    },
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redisClient.on("connect", () => {
    isRedisAvailable = true;
    console.log("[Redis] Connected successfully to Redis server.");
  });

  redisClient.on("ready", () => {
    isRedisAvailable = true;
  });

  redisClient.on("error", (err: any) => {
    if (isRedisAvailable) {
      console.warn("[Redis] Redis error:", err.message);
    }
    isRedisAvailable = false;
  });

  // Attempt initial connect asynchronously
  redisClient.connect().catch((_err) => {
    isRedisAvailable = false;
    // Suppress unhandled error log when Redis is simply not running in dev
  });
} catch (error) {
  isRedisAvailable = false;
  console.warn("[Redis] Initializing Redis failed. Running with in-memory fallback cache.");
}

export const getRedisClient = () => redisClient;
export const getIsRedisAvailable = () => isRedisAvailable && redisClient?.status === "ready";

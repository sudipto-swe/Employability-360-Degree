import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  (process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : undefined);

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export default redis;

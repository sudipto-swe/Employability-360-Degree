import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

// In-Memory fallback cache
const memoryCache = new Map<string, { value: string; expiresAt: number | null }>();

export async function getCache(key: string): Promise<string | null> {
  // 1. Try Redis
  if (redis) {
    try {
      const val = await redis.get(key);
      if (val !== null) return val;
    } catch (err) {
      console.warn("Redis getCache error, falling back to database:", err);
    }
  }

  // 2. Try Database
  try {
    const entry = await prisma.aiCache.findUnique({
      where: { key },
    });
    if (entry) {
      if (!entry.expiresAt || entry.expiresAt > new Date()) {
        return entry.value;
      } else {
        // Asynchronously delete expired entry
        prisma.aiCache.delete({ where: { key } }).catch((err) => {
          console.warn("Failed to delete expired db cache entry:", err);
        });
      }
    }
  } catch (err) {
    console.warn("Database getCache error, falling back to in-memory:", err);
  }

  // 3. Try In-Memory
  const memEntry = memoryCache.get(key);
  if (memEntry) {
    if (!memEntry.expiresAt || memEntry.expiresAt > Date.now()) {
      return memEntry.value;
    } else {
      memoryCache.delete(key);
    }
  }

  return null;
}

export async function setCache(key: string, value: string, ttlSeconds = 86400): Promise<void> {
  const expiresAtDate = new Date(Date.now() + ttlSeconds * 1000);

  // 1. Try Redis
  if (redis) {
    try {
      await redis.set(key, value, "EX", ttlSeconds);
      return;
    } catch (err) {
      console.warn("Redis setCache error:", err);
    }
  }

  // 2. Try Database
  try {
    await prisma.aiCache.upsert({
      where: { key },
      update: {
        value,
        expiresAt: expiresAtDate,
      },
      create: {
        key,
        value,
        expiresAt: expiresAtDate,
      },
    });
    return;
  } catch (err) {
    console.warn("Database setCache error:", err);
  }

  // 3. Try In-Memory
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

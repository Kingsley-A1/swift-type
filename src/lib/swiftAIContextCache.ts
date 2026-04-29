interface SwiftAIContextCacheEntry {
  context: unknown;
  expiresAt: number;
}

const globalForSwiftAIContextCache = globalThis as typeof globalThis & {
  __swiftAIContextCache?: Map<string, SwiftAIContextCacheEntry>;
};

const swiftAIContextCache =
  globalForSwiftAIContextCache.__swiftAIContextCache ?? new Map();

if (!globalForSwiftAIContextCache.__swiftAIContextCache) {
  globalForSwiftAIContextCache.__swiftAIContextCache = swiftAIContextCache;
}

export function getCachedSwiftAIContext<T>(userId: string): T | null {
  const entry = swiftAIContextCache.get(userId);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    swiftAIContextCache.delete(userId);
    return null;
  }

  return entry.context as T;
}

export function setCachedSwiftAIContext<T>(
  userId: string,
  context: T,
  ttlMs: number,
) {
  swiftAIContextCache.set(userId, {
    context,
    expiresAt: Date.now() + Math.max(0, ttlMs),
  });
}

export function invalidateCachedSwiftAIContext(userId: string) {
  swiftAIContextCache.delete(userId);
}

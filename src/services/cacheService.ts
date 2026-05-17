/**
 * SessionStorage-based TTL cache service.
 *
 * Each entry stores: { data: T, expiry: number }
 * Expired entries are lazily cleaned on read.
 */

interface CacheEntry<T> {
  data: T
  expiry: number
}

const PREFIX = "krishiai:cache:"

/**
 * Store a value in sessionStorage with a TTL.
 *
 * @param key   Cache key (will be namespaced internally)
 * @param data  The data to cache
 * @param ttlMs Time-to-live in milliseconds
 */
export function set<T>(key: string, data: T, ttlMs: number): void {
  const entry: CacheEntry<T> = {
    data,
    expiry: Date.now() + ttlMs,
  }
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(entry))
  } catch {
    // sessionStorage might be full or unavailable; silently fail
  }
}

/**
 * Retrieve a cached value. Returns `null` if missing or expired.
 */
export function get<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (!raw) return null

    const entry: CacheEntry<T> = JSON.parse(raw)

    if (Date.now() > entry.expiry) {
      remove(key)
      return null
    }

    return entry.data
  } catch {
    return null
  }
}

/**
 * Remove a specific cache entry.
 */
export function remove(key: string): void {
  try {
    sessionStorage.removeItem(PREFIX + key)
  } catch {
    // silently fail
  }
}

/**
 * Clear all KrishiAI cache entries from sessionStorage.
 */
export function clear(): void {
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k?.startsWith(PREFIX)) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k))
  } catch {
    // silently fail
  }
}

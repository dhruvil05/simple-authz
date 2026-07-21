/**
 * LRU Cache for authorization decisions
 * - Stores user + action + resource + objectId combinations
 * - TTL-based expiration
 * - LRU eviction when max size exceeded
 * - Automatic invalidation on policy reload
 */
class AuthzCache {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 1000;
        this.ttl = options.ttl || 3600; // seconds
        this.enabled = options.enabled !== false;

        this.cache = new Map();
        // Named _stats (not `stats`) because a class method `stats()` exists
        // below — an instance property named the same as a prototype method
        // shadows it, so `cache.stats()` would throw "not a function" the
        // moment anyone actually called it (this went uncaught only because
        // the cache itself was never wired into Authz until now).
        this._stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            timeouts: 0
        };
    }

    /**
     * Generate cache key from request parameters
     * Format: {userIdentity}:{action}:{resource}:{objectId or 'null'}
     *
     * Falls back to role(s) when there's no `user.id` — otherwise every
     * id-less user (e.g. identified only by `user.role`/`user.roles`, which
     * this library explicitly supports) would collide into the same cache
     * key and could get served another user's cached decision.
     */
    _key(user, action, resource, objectId) {
        const identity = user && user.id != null
            ? user.id
            : `roles:${JSON.stringify((user && (user.roles || user.role)) || null)}`;

        return `${identity}:${action}:${resource}:${objectId || 'null'}`;
    }

    /**
     * Get cached authorization result
     * Returns null if:
     * - Key not in cache
     * - Entry expired (TTL exceeded)
     */
    get(user, action, resource, objectId) {
        if (!this.enabled) return null;

        const key = this._key(user, action, resource, objectId);
        const entry = this.cache.get(key);

        if (!entry) {
            this._stats.misses++;
            return null;
        }

        // Check TTL
        const age = (Date.now() - entry.timestamp) / 1000;
        if (age > this.ttl) {
            this.cache.delete(key);
            this._stats.timeouts++;
            this._stats.misses++;
            return null;
        }

        // Hit!
        entry.lastAccess = Date.now();
        this._stats.hits++;
        return entry.result;
    }

    /**
     * Store authorization result in cache
     * Evicts oldest entry (LRU) if at capacity
     */
    set(user, action, resource, objectId, result) {
        if (!this.enabled) return;

        // Check if we need to evict
        if (this.cache.size >= this.maxSize) {
            // Find oldest entry by timestamp (not lastAccess, to keep simple)
            let oldest = null;
            let oldestKey = null;

            for (const [key, entry] of this.cache) {
                if (!oldest || entry.timestamp < oldest.timestamp) {
                    oldest = entry;
                    oldestKey = key;
                }
            }

            if (oldestKey) {
                this.cache.delete(oldestKey);
                this._stats.evictions++;
            }
        }

        // Store new entry
        const key = this._key(user, action, resource, objectId);
        this.cache.set(key, {
            result,
            timestamp: Date.now(),
            lastAccess: Date.now()
        });
    }

    /**
     * Clear entire cache
     * Used on policy reload
     */
    clear() {
        const before = this.cache.size;
        this.cache.clear();
        return { cleared: before, stats: this._stats };
    }

    /**
     * Get cache statistics
     */
    stats() {
        const total = this._stats.hits + this._stats.misses;
        const hitRate = total === 0 ? 0 : ((this._stats.hits / total) * 100).toFixed(2);

        return {
            hits: this._stats.hits,
            misses: this._stats.misses,
            evictions: this._stats.evictions,
            timeouts: this._stats.timeouts,
            hitRate: hitRate + '%',
            size: this.cache.size,
            maxSize: this.maxSize,
            utilizationRate: ((this.cache.size / this.maxSize) * 100).toFixed(2) + '%'
        };
    }

    /**
     * Reset statistics (for testing/monitoring)
     */
    resetStats() {
        this._stats = { hits: 0, misses: 0, evictions: 0, timeouts: 0 };
    }
}

module.exports = AuthzCache;
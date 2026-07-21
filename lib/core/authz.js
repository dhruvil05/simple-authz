const { parseRules } = require("../rules/parser")
const { compileRules } = require("../rules/compiler")
const { validateRules } = require("../rules/validator")
const { normalizeUser } = require("../utils/normalizeUser")
const { evaluateAST } = require("../engine/conditionExecutor")
const createMiddleware = require("./middleware")
const AuthzCache = require("../cache")

class Authz {

    /**
     * @param {object} [options]
     * @param {boolean} [options.cacheEnabled=true]
     * @param {number} [options.cacheSize=1000]
     * @param {number} [options.cacheTTL=3600] seconds
     */
    constructor(options = {}) {
        this.permissions = {}
        this.conditions = {}
        this.rules = []
        // Previously this was a plain Map keyed by JSON.stringify(...) that
        // was checked in can() but never written to (no .set() call), so
        // caching silently never happened. lib/cache.js already had a full
        // LRU+TTL cache implementation sitting unused — wiring it in here.
        this.cache = new AuthzCache({
            enabled: options.cacheEnabled !== false,
            maxSize: options.cacheSize || 1000,
            ttl: options.cacheTTL || 3600
        })
    }

    load(filePath) {

        const rules = parseRules(filePath)
        validateRules(rules)

        const compiled = compileRules(rules)

        this.rules = rules
        this.permissions = compiled.permissions
        this.conditions = compiled.conditions

        // Stale decisions from a previous policy must not survive a reload.
        this.cache.clear()
    }

    getRules() {
        return this.rules
    }

    cacheStats() {
        return this.cache.stats()
    }

    /**
     * Manually invalidate cached decisions. Caching keys on id/owner_id (or a
     * snapshot of the data if neither exists) — so if a resource's OTHER
     * fields change (e.g. a document gets locked) while its id stays the
     * same, a cached decision from before that change can still be served
     * until the TTL expires. Call this right after any write that could
     * affect a condition's outcome, or set `cacheTTL` low / `cacheEnabled:
     * false` for policies with conditions on fast-changing fields.
     */
    clearCache() {
        return this.cache.clear()
    }

    can(user, action, resourceType, data = {}) {

        const roles = normalizeUser(user)
        // Cache key needs something that uniquely identifies this resource.
        // id/owner_id is cheap and covers the common case. When neither is
        // present, fall back to a stringified snapshot of the data — without
        // this, two different payloads with no id (e.g. {age:25} vs {age:10})
        // would collide onto the same cache key and one call's result would
        // wrongly get served to the other.
        const objectId = data && (data.id ?? data.owner_id ?? JSON.stringify(data))

        const cached = this.cache.get(user, action, resourceType, objectId)

        if (cached !== null) {
            return cached
        }

        let result = false

        outer:
        for (const role of roles) {

            const rolePerm = this.permissions[role]

            if (rolePerm) {

                const resourcePerm = rolePerm[resourceType]

                if (resourcePerm) {

                    if (resourcePerm.has("*") || resourcePerm.has(action)) {
                        result = true
                        break outer
                    }
                }

                if (rolePerm["*"]) {

                    if (rolePerm["*"].has("*") || rolePerm["*"].has(action)) {
                        result = true
                        break outer
                    }
                }
            }

            const roleCond = this.conditions[role]

            if (!roleCond) continue

            const resourceCond = roleCond[resourceType]

            if (!resourceCond) continue

            const actionCond = resourceCond[action]

            if (!actionCond) continue

            for (const cond of actionCond) {

                const context = {
                    user,
                    [resourceType]: data
                }

                if (evaluateAST(cond, context)) {
                    result = true
                    break outer
                }
            }
        }

        this.cache.set(user, action, resourceType, objectId, result)
        return result
    }

    explain(user, action, resourceType, data = {}) {

        const roles = normalizeUser(user)

        for (const role of roles) {

            const rolePerm = this.permissions[role]

            // ---------- Permission check ----------
            if (rolePerm) {

                const resourcePerm = rolePerm[resourceType]

                if (resourcePerm) {

                    if (resourcePerm.has("*") || resourcePerm.has(action)) {
                        return {
                            allowed: true,
                            role,
                            resource: resourceType,
                            action,
                            reason: "direct permission match"
                        }
                    }
                }

                if (rolePerm["*"]) {
                    if (rolePerm["*"].has("*") || rolePerm["*"].has(action)) {
                        return {
                            allowed: true,
                            role,
                            resource: "*",
                            action,
                            reason: "wildcard permission"
                        }
                    }
                }
            }

            // ---------- Condition check ----------
            const roleCond = this.conditions[role]

            if (!roleCond) continue

            const resourceCond = roleCond[resourceType]

            if (!resourceCond) continue

            const actionCond = resourceCond[action]

            if (!actionCond) continue

            for (const cond of actionCond) {

                const context = {
                    user,
                    [resourceType]: data
                }

                const result = evaluateAST(cond, context)

                if (result) {
                    return {
                        allowed: true,
                        role,
                        resource: resourceType,
                        action,
                        reason: "condition passed",
                        condition: cond
                    }
                }
            }

            return {
                allowed: false,
                role,
                resource: resourceType,
                action,
                reason: "condition failed"
            }

        }

        return {
            allowed: false,
            reason: "no matching rule"
        }
    }
}

Authz.prototype.middleware = function (action, resourceType, getResource) {
    const middleware = createMiddleware(this)
    return middleware(action, resourceType, getResource)
}

module.exports = Authz
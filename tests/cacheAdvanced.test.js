const path = require("path")
const Authz = require("../lib/core/authz")

describe("Cache wiring (regression)", () => {

    test("cacheStats() is callable and reflects real hits/misses", () => {
        const authz = new Authz()
        authz.load(path.join(__dirname, "test.toon"))

        const user = { id: 1, role: "user" }
        const listing = { owner_id: 1 }

        authz.can(user, "edit", "listing", listing) // miss
        authz.can(user, "edit", "listing", listing) // hit

        const stats = authz.cacheStats()

        expect(stats.misses).toBeGreaterThanOrEqual(1)
        expect(stats.hits).toBeGreaterThanOrEqual(1)
        expect(stats.size).toBe(1)
    })

    test("users identified only by role (no id) don't share a cache slot", () => {
        const authz = new Authz()
        authz.load(path.join(__dirname, "advanced.toon"))

        // Both calls are role-only users with no id — must be evaluated
        // independently rather than colliding on the same cache key.
        expect(
            authz.can({ role: "user" }, "view", "article", { views: 150 })
        ).toBe(true)

        expect(
            authz.can({ role: "user" }, "view", "article", { views: 50 })
        ).toBe(false)
    })

    test("different data with no id/owner_id doesn't collide either", () => {
        const authz = new Authz()
        authz.load(path.join(__dirname, "advanced.toon"))

        const user = { id: 1, role: "user" }

        expect(authz.can(user, "view", "article", { views: 500 })).toBe(true)
        expect(authz.can(user, "view", "article", { views: 5 })).toBe(false)
    })

    test("clearCache() runs cleanly and resets cache size", () => {
        const authz = new Authz()
        authz.load(path.join(__dirname, "test.toon"))

        const user = { id: 9, role: "user" }
        const listing = { owner_id: 9 }

        authz.can(user, "edit", "listing", listing)
        expect(authz.cacheStats().size).toBe(1)

        authz.clearCache()
        expect(authz.cacheStats().size).toBe(0)

        // a fresh lookup after clearing still works correctly
        expect(authz.can(user, "edit", "listing", listing)).toBe(true)
    })

    test("load() clears stale cache from a previous policy", () => {
        const authz = new Authz()
        authz.load(path.join(__dirname, "test.toon"))

        const user = { id: 1, role: "user" }
        authz.can(user, "edit", "listing", { owner_id: 1 })
        expect(authz.cacheStats().size).toBe(1)

        authz.load(path.join(__dirname, "advanced.toon"))
        expect(authz.cacheStats().size).toBe(0)
    })
})
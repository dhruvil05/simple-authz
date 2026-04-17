const authz = require("./setup")

describe("Cache Safety", () => {

    test("should return same result with cache", () => {
        const user = { id: 1, role: "user" }
        const listing = { owner_id: 1 }

        const first = authz.can(user, "edit", "listing", listing)
        const second = authz.can(user, "edit", "listing", listing)

        expect(first).toBe(true)
        expect(second).toBe(true)
    })

    test("should not return stale result when data changes", () => {
        const user = { id: 1, role: "user" }

        const listing1 = { owner_id: 1 }
        const listing2 = { owner_id: 2 }

        const result1 = authz.can(user, "edit", "listing", listing1)
        const result2 = authz.can(user, "edit", "listing", listing2)

        expect(result1).toBe(true)
        expect(result2).toBe(false)
    })

    test("should handle mutated objects correctly", () => {
        const user = { id: 1, role: "user" }
        const listing = { owner_id: 1 }

        const result1 = authz.can(user, "edit", "listing", listing)

        // mutate object
        listing.owner_id = 2

        const result2 = authz.can(user, "edit", "listing", listing)

        expect(result1).toBe(true)
        expect(result2).toBe(false)
    })

    test("should handle multiple calls safely", () => {
        const user = { id: 1, role: "user" }
        const listing = { owner_id: 1 }

        for (let i = 0; i < 1000; i++) {
            const result = authz.can(user, "edit", "listing", listing)
            expect(result).toBe(true)
        }
    })
})
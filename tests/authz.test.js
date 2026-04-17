const authz = require("./setup")

describe("Authorization Engine", () => {

    test("admin should have full access", () => {
        const user = { role: "admin" }

        expect(
            authz.can(user, "delete", "listing", {})
        ).toBe(true)
    })

    test("broker can publish listing", () => {
        const user = { role: "broker" }

        expect(
            authz.can(user, "publish", "listing", {})
        ).toBe(true)
    })

    test("user can edit own listing", () => {
        const user = { id: 1, role: "user" }
        const listing = { owner_id: 1 }

        expect(
            authz.can(user, "edit", "listing", listing)
        ).toBe(true)
    })

    test("user cannot edit others listing", () => {
        const user = { id: 1, role: "user" }
        const listing = { owner_id: 2 }

        expect(
            authz.can(user, "edit", "listing", listing)
        ).toBe(false)
    })

    test("OR condition works", () => {
        const user = { id: 1, role: "user" }
        const listing = { status: "public" }

        expect(
            authz.can(user, "view", "listing", listing)
        ).toBe(true)
    })

    test("explain returns object", () => {
        const user = { id: 1, role: "user" }
        const listing = { owner_id: 1 }

        const result = authz.explain(user, "edit", "listing", listing)

        expect(result.allowed).toBe(true)
        expect(result.reason).toBeDefined()
    })

})
const { compileRules } = require("../lib/rules/compiler")

describe("Rule Compiler", () => {

    test("should compile simple permission rule", () => {
        const rules = [
            {
                role: "admin",
                action: "*",
                resource: "*"
            }
        ]

        const compiled = compileRules(rules)

        expect(compiled.permissions.admin["*"].has("*")).toBe(true)
    })

    test("should compile specific permission", () => {
        const rules = [
            {
                role: "broker",
                action: "publish",
                resource: "listing"
            }
        ]

        const compiled = compileRules(rules)

        expect(
            compiled.permissions.broker.listing.has("publish")
        ).toBe(true)
    })

    test("should support multiple actions for same role/resource", () => {
        const rules = [
            {
                role: "broker",
                action: "publish",
                resource: "listing"
            },
            {
                role: "broker",
                action: "edit",
                resource: "listing"
            }
        ]

        const compiled = compileRules(rules)

        expect(compiled.permissions.broker.listing.has("publish")).toBe(true)
        expect(compiled.permissions.broker.listing.has("edit")).toBe(true)
    })

    test("should compile conditional rules separately", () => {
        const rules = [
            {
                role: "user",
                action: "edit",
                resource: "listing",
                condition: "listing.owner_id == user.id"
            }
        ]

        const compiled = compileRules(rules)

        expect(compiled.conditions.user.listing.edit.length).toBe(1)
    })

    test("should not mix permissions and conditions", () => {
        const rules = [
            {
                role: "user",
                action: "edit",
                resource: "listing",
                condition: "listing.owner_id == user.id"
            }
        ]

        const compiled = compileRules(rules)

        // No direct permission
        expect(compiled.permissions.user).toBeUndefined()

        // Condition exists
        expect(compiled.conditions.user.listing.edit.length).toBe(1)
    })

    test("should compile multiple conditional rules (OR behavior)", () => {
        const rules = [
            {
                role: "user",
                action: "edit",
                resource: "listing",
                condition: "listing.owner_id == user.id"
            },
            {
                role: "user",
                action: "edit",
                resource: "listing",
                condition: "listing.status == 'draft'"
            }
        ]

        const compiled = compileRules(rules)

        expect(compiled.conditions.user.listing.edit.length).toBe(2)
    })

    test("should support wildcard resource", () => {
        const rules = [
            {
                role: "admin",
                action: "*",
                resource: "*"
            }
        ]

        const compiled = compileRules(rules)

        expect(compiled.permissions.admin["*"].has("*")).toBe(true)
    })

    test("should support wildcard action for specific resource", () => {
        const rules = [
            {
                role: "manager",
                action: "*",
                resource: "listing"
            }
        ]

        const compiled = compileRules(rules)

        expect(compiled.permissions.manager.listing.has("*")).toBe(true)
    })

})
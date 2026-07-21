const { validateRules } = require("../lib/rules/validator")

describe("Rule Validator (regression)", () => {

    test("passes a well-formed set of rules", () => {
        const rules = [
            { role: "admin", action: "*", resource: "*" },
            {
                role: "user", action: "edit", resource: "listing",
                condition: "listing.owner_id == user.id AND listing.status != \"published\""
            }
        ]

        expect(() => validateRules(rules)).not.toThrow()
    })

    test("still catches missing role/action/resource", () => {
        const rules = [{ action: "edit", resource: "listing" }]

        expect(() => validateRules(rules)).toThrow(/missing role/)
    })

    test("catches a condition with a missing operand (old check let this pass)", () => {
        const rules = [
            { role: "user", action: "edit", resource: "doc", condition: "doc.status ==" }
        ]

        expect(() => validateRules(rules)).toThrow(/Rule 1.*missing an operand/s)
    })

    test("catches mixed AND/OR in a condition, with the rule number attached", () => {
        const rules = [
            {
                role: "user", action: "edit", resource: "doc",
                condition: "doc.a == 1 AND doc.b == 2 OR doc.c == 3"
            }
        ]

        expect(() => validateRules(rules)).toThrow(/Rule 1.*Mixing AND and OR/s)
    })

    test("accepts a literal string value that itself contains the text AND", () => {
        const rules = [
            {
                role: "user", action: "edit", resource: "doc",
                condition: 'doc.title == "Terms AND Conditions"'
            }
        ]

        expect(() => validateRules(rules)).not.toThrow()
    })

    test("reports every broken rule, not just the first", () => {
        const rules = [
            { role: "user", action: "edit", resource: "doc", condition: "doc.status ==" },
            { action: "view", resource: "doc" }
        ]

        expect(() => validateRules(rules)).toThrow(/Rule 1[\s\S]*Rule 2/)
    })
})
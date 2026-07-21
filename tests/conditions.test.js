const path = require("path")
const Authz = require("../lib/core/authz")
const { compileCondition } = require("../lib/engine/conditionCompiler")

describe("Condition literals (regression)", () => {

    let authz

    beforeEach(() => {
        authz = new Authz()
        authz.load(path.join(__dirname, "advanced.toon"))
    })

    test("numeric literal comparison is honored, not treated as a field path", () => {
        expect(
            authz.can({ role: "user" }, "view", "article", { views: 150 })
        ).toBe(true)

        expect(
            authz.can({ role: "user" }, "view", "article", { views: 50 })
        ).toBe(false)
    })
})

describe("Quote-aware parsing (regression)", () => {

    test("a literal string value containing the text 'AND' is not split as a logical AND", () => {
        const cond = compileCondition('doc.title == "Terms AND Conditions"')

        expect(cond.type).toBe("comparison")
        expect(cond.right).toBe('"Terms AND Conditions"')
    })

    test("a literal string value containing the text 'OR' is not split as a logical OR", () => {
        const cond = compileCondition('doc.title == "Buy OR Sell"')

        expect(cond.type).toBe("comparison")
        expect(cond.right).toBe('"Buy OR Sell"')
    })

    test("an operator character inside a quoted value doesn't break parsing", () => {
        const cond = compileCondition('doc.label == "a==b"')

        expect(cond.operator).toBe("==")
        expect(cond.left).toBe("doc.label")
        expect(cond.right).toBe('"a==b"')
    })

    test("a condition missing an operand throws instead of silently compiling", () => {
        expect(() => compileCondition("doc.status ==")).toThrow(/missing an operand/)
    })
})


describe("AND/OR chains longer than 2 clauses (regression)", () => {

    let authz

    beforeEach(() => {
        authz = new Authz({ cacheEnabled: false })
        authz.load(path.join(__dirname, "advanced.toon"))
    })

    test("all three clauses are enforced, not just the first two", () => {
        const user = { id: 1, role: "user" }

        expect(
            authz.can(user, "publish", "article", {
                owner_id: 1, status: "draft", flagged: "false"
            })
        ).toBe(true)

        // third clause (flagged) must be enough on its own to deny
        expect(
            authz.can(user, "publish", "article", {
                owner_id: 1, status: "draft", flagged: "true"
            })
        ).toBe(false)

        // first clause fails, should still deny regardless of the rest
        expect(
            authz.can(user, "publish", "article", {
                owner_id: 2, status: "draft", flagged: "false"
            })
        ).toBe(false)
    })

    test("mixing AND and OR in a single condition throws instead of guessing", () => {
        expect(() => {
            compileCondition('a == 1 AND b == 2 OR c == 3')
        }).toThrow(/Mixing AND and OR/)
    })
})
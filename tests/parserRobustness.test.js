const fs = require("fs")
const path = require("path")
const { parseRules } = require("../lib/rules/parser")

function createPolicyFile(content) {
    const filePath = path.join(__dirname, "temp_robustness.toon")
    fs.writeFileSync(filePath, content)
    return filePath
}

describe("Parser robustness (regression)", () => {

    afterEach(() => {
        const tempPath = path.join(__dirname, "temp_robustness.toon")
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath)
        }
    })

    test("a stray 'end' with no matching 'rule' throws a clear error, not a null entry", () => {
        const file = createPolicyFile("end\n")

        expect(() => parseRules(file)).toThrow(/no matching "rule"/)
    })

    test("a nested 'rule' before the previous one is closed throws instead of discarding it", () => {
        const file = createPolicyFile(`
rule
role admin
action *
resource *

rule
role user
action edit
resource listing
end
`)

        expect(() => parseRules(file)).toThrow(/still unclosed/)
    })

    test("an unclosed 'rule' at end of file throws instead of silently dropping it", () => {
        const file = createPolicyFile(`
rule
role admin
action *
resource *
`)

        expect(() => parseRules(file)).toThrow(/never closed/)
    })

    test("an unknown key throws instead of being silently ignored (e.g. typo'd 'role')", () => {
        const file = createPolicyFile(`
rule
roel admin
action *
resource *
end
`)

        expect(() => parseRules(file)).toThrow(/unknown key "roel"/)
    })

    test("a key with no value throws instead of storing an empty string", () => {
        const file = createPolicyFile(`
rule
role
action *
resource *
end
`)

        expect(() => parseRules(file)).toThrow(/has no value/)
    })

    test("valid multi-rule files still parse exactly as before", () => {
        const file = createPolicyFile(`
rule
role admin
action *
resource *
end

rule
role user
action edit
resource listing
condition listing.owner_id == user.id
end
`)

        const rules = parseRules(file)

        expect(rules.length).toBe(2)
        expect(rules[1].condition).toBe("listing.owner_id == user.id")
    })
})
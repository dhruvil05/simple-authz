const fs = require("fs")
const path = require("path")
const { parseRules } = require("../lib/rules/parser")

// Helper to create temp policy file
function createPolicyFile(content) {
    const filePath = path.join(__dirname, "temp.toon")
    fs.writeFileSync(filePath, content)
    return filePath
}

describe("Policy Parser", () => {

    afterEach(() => {
        const tempPath = path.join(__dirname, "temp.toon")
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath)
        }
    })

    test("should parse a simple rule", () => {
        const content = `
rule
role admin
action *
resource *
end
`

        const file = createPolicyFile(content)
        const rules = parseRules(file)

        expect(rules.length).toBe(1)

        expect(rules[0]).toEqual({
            role: "admin",
            action: "*",
            resource: "*"
        })
    })

    test("should parse rule with condition", () => {
        const content = `
rule
role user
action edit
resource listing
condition listing.owner_id == user.id
end
`

        const file = createPolicyFile(content)
        const rules = parseRules(file)

        expect(rules.length).toBe(1)

        expect(rules[0].condition).toBe(
            "listing.owner_id == user.id"
        )
    })

    test("should parse multiple rules", () => {
        const content = `
rule
role admin
action *
resource *
end

rule
role broker
action publish
resource listing
end
`

        const file = createPolicyFile(content)
        const rules = parseRules(file)

        expect(rules.length).toBe(2)
        expect(rules[1].role).toBe("broker")
    })

    test("should handle AND conditions", () => {
        const content = `
rule
role user
action edit
resource listing
condition listing.owner_id == user.id AND listing.status != "published"
end
`

        const file = createPolicyFile(content)
        const rules = parseRules(file)

        expect(rules[0].condition).toContain("AND")
    })

    test("should handle OR conditions", () => {
        const content = `
rule
role user
action view
resource listing
condition listing.status == "public" OR listing.owner_id == user.id
end
`

        const file = createPolicyFile(content)
        const rules = parseRules(file)

        expect(rules[0].condition).toContain("OR")
    })

    test("should ignore empty lines and whitespace", () => {
        const content = `

rule

role admin

action *

resource *

end

`

        const file = createPolicyFile(content)
        const rules = parseRules(file)

        expect(rules.length).toBe(1)
    })

})
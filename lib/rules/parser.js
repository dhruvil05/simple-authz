const fs = require("fs")

function parseRules(filePath) {

    const content = fs.readFileSync(filePath, "utf8")

    const lines = content.split("\n").map(l => l.trim())

    const rules = []
    let current = null

    for (const line of lines) {

        if (!line || line.startsWith("#")) continue

        if (line === "rule") {
            current = {}
        }

        else if (line === "end") {
            rules.push(current)
            current = null
        }

        else if (current) {

            const [key, ...rest] = line.split(" ")
            const value = rest.join(" ")

            if (key === "role") current.role = value
            if (key === "action") current.action = value
            if (key === "resource") current.resource = value
            if (key === "condition") current.condition = value

        }
    }

    return rules
}

module.exports = { parseRules }
const fs = require("fs")

const KNOWN_KEYS = ["role", "action", "resource", "condition"]

function parseRules(filePath) {

    const content = fs.readFileSync(filePath, "utf8")
    const rawLines = content.split("\n")

    const rules = []
    let current = null
    let ruleStartLine = null

    rawLines.forEach((rawLine, idx) => {

        const lineNumber = idx + 1
        const line = rawLine.trim()

        if (!line || line.startsWith("#")) return

        if (line === "rule") {

            // Previously this silently overwrote `current`, discarding an
            // already-open rule block that was missing its "end".
            if (current) {
                throw new Error(
                    `Policy parse error at line ${lineNumber}: found "rule" but the ` +
                    `rule opened at line ${ruleStartLine} is still unclosed (missing "end").`
                )
            }

            current = {}
            ruleStartLine = lineNumber
            return
        }

        if (line === "end") {

            // Previously this pushed `current` (= null for a stray "end")
            // straight into `rules`, which crashed later in validateRules
            // with an unhelpful "Cannot read properties of null".
            if (!current) {
                throw new Error(
                    `Policy parse error at line ${lineNumber}: found "end" with no matching "rule".`
                )
            }

            rules.push(current)
            current = null
            ruleStartLine = null
            return
        }

        if (!current) {
            throw new Error(
                `Policy parse error at line ${lineNumber}: "${line}" appears outside ` +
                `of a rule/end block.`
            )
        }

        const [key, ...rest] = line.split(" ")
        const value = rest.join(" ")

        // Previously an unrecognized key (e.g. "roel" typo'd for "role")
        // was silently dropped, leaving the rule incomplete with no warning.
        if (!KNOWN_KEYS.includes(key)) {
            throw new Error(
                `Policy parse error at line ${lineNumber}: unknown key "${key}" ` +
                `(expected one of: ${KNOWN_KEYS.join(", ")}).`
            )
        }

        if (!value) {
            throw new Error(
                `Policy parse error at line ${lineNumber}: "${key}" has no value.`
            )
        }

        current[key] = value
    })

    if (current) {
        throw new Error(
            `Policy parse error: rule opened at line ${ruleStartLine} was never closed with "end".`
        )
    }

    return rules
}

module.exports = { parseRules }
/**
 * Split `str` on `delimiter`, but ignore any delimiter occurrence that falls
 * inside a quoted string literal. Without this, a condition like
 * `doc.title == "Terms AND Conditions"` would get incorrectly split in the
 * middle of its own string literal, since the naive version just looked for
 * the substring " AND " anywhere in the raw text.
 */
function splitOutsideQuotes(str, delimiter) {

    const parts = []
    let current = ""
    let inQuote = null

    for (let i = 0; i < str.length; i++) {

        const ch = str[i]

        if (inQuote) {
            current += ch
            if (ch === inQuote) inQuote = null
            continue
        }

        if (ch === '"' || ch === "'") {
            inQuote = ch
            current += ch
            continue
        }

        if (str.startsWith(delimiter, i)) {
            parts.push(current)
            current = ""
            i += delimiter.length - 1
            continue
        }

        current += ch
    }

    parts.push(current)
    return parts
}

/**
 * Find the first comparison operator that appears outside any quoted
 * literal. Longer operators are checked first at each position so ">=" is
 * matched instead of being mistaken for ">" followed by "=".
 */
function findTopLevelOperator(expr) {

    const operators = ["==", "!=", ">=", "<=", ">", "<"]
    let inQuote = null

    for (let i = 0; i < expr.length; i++) {

        const ch = expr[i]

        if (inQuote) {
            if (ch === inQuote) inQuote = null
            continue
        }

        if (ch === '"' || ch === "'") {
            inQuote = ch
            continue
        }

        for (const op of operators) {
            if (expr.startsWith(op, i)) {
                return { operator: op, index: i }
            }
        }
    }

    return null
}

function detectLogical(condition) {

    const andParts = splitOutsideQuotes(condition, " AND ")
    const orParts = splitOutsideQuotes(condition, " OR ")

    const hasAnd = andParts.length > 1
    const hasOr = orParts.length > 1

    if (hasAnd && hasOr) {
        throw new Error(
            `Mixing AND and OR in a single condition is not supported: "${condition}". ` +
            `Split this into separate rules instead.`
        )
    }

    if (hasAnd) {
        return {
            operator: "AND",
            parts: andParts
        }
    }

    if (hasOr) {
        return {
            operator: "OR",
            parts: orParts
        }
    }

    return null
}

function parseComparison(expr) {

    // Previously this scanned for each operator with .includes()/.split(),
    // which splits on EVERY occurrence in the string — including one that
    // happens to sit inside a quoted literal (e.g. `a == "x==y"`) — and then
    // silently discarded everything past the first two resulting pieces.
    const found = findTopLevelOperator(expr)

    if (!found) {
        throw new Error(`Invalid condition: ${expr}`)
    }

    const left = expr.slice(0, found.index).trim()
    const right = expr.slice(found.index + found.operator.length).trim()

    if (!left || !right) {
        throw new Error(`Invalid condition: "${expr}" is missing an operand.`)
    }

    return {
        type: "comparison",
        operator: found.operator,
        left,
        right
    }
}

function compileCondition(condition) {

    const logical = detectLogical(condition)

    if (!logical) {
        return parseComparison(condition)
    }

    // Previously only logical.parts[0] and logical.parts[1] were used, so any
    // clause past the second one in a chain like "a AND b AND c" was silently
    // dropped (c never gets checked). Fold every clause into a left-leaning
    // AST so chains of any length are honored.
    const nodes = logical.parts.map(part => parseComparison(part.trim()))

    return nodes.reduce((left, right) => ({
        type: logical.operator,
        left,
        right
    }))
}

module.exports = { compileCondition }
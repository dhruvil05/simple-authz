function detectLogical(condition) {

    if (condition.includes(" AND ")) {
        return {
            operator: "AND",
            parts: condition.split(" AND ")
        }
    }

    if (condition.includes(" OR ")) {
        return {
            operator: "OR",
            parts: condition.split(" OR ")
        }
    }

    return null
}

function parseComparison(expr) {

    const operators = ["==", "!=", ">=", "<=", ">", "<"]

    for (const op of operators) {

        if (expr.includes(op)) {

            const [left, right] = expr.split(op).map(s => s.trim())

            return {
                type: "comparison",
                operator: op,
                left,
                right
            }
        }
    }

    throw new Error(`Invalid condition: ${expr}`)
}

function compileCondition(condition) {

    const logical = detectLogical(condition)

    if (!logical) {
        return parseComparison(condition)
    }

    return {
        type: logical.operator,
        left: parseComparison(logical.parts[0]),
        right: parseComparison(logical.parts[1])
    }
}

module.exports = { compileCondition }
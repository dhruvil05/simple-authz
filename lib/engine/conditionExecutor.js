function getValue(path, context) {

    const parts = path.split(".")
    let value = context

    for (const p of parts) {

        if (value === undefined) return undefined
        value = value[p]

    }

    return value
}

/**
 * Determine whether the right-hand side of a condition is a literal value
 * (string, number, boolean, null) rather than a field path to look up in
 * context. Previously only quoted strings were treated as literals, so
 * `count > 5` or `active == true` silently resolved `5`/`true` as a field
 * path (e.g. context["5"]), which is always undefined — the condition could
 * never match.
 */
function parseLiteral(raw) {

    if ((raw.startsWith('"') && raw.endsWith('"')) ||
        (raw.startsWith("'") && raw.endsWith("'"))) {
        return { isLiteral: true, value: raw.slice(1, -1) }
    }

    if (raw === "true") return { isLiteral: true, value: true }
    if (raw === "false") return { isLiteral: true, value: false }
    if (raw === "null") return { isLiteral: true, value: null }

    if (/^-?\d+(\.\d+)?$/.test(raw)) {
        return { isLiteral: true, value: Number(raw) }
    }

    return { isLiteral: false, value: undefined }
}

function evaluateComparison(node, context) {

    const leftVal = getValue(node.left, context)

    const literal = parseLiteral(node.right)

    const rightVal = literal.isLiteral
        ? literal.value
        : getValue(node.right, context)

    switch (node.operator) {

        case "==": return leftVal == rightVal
        case "!=": return leftVal != rightVal
        case ">": return leftVal > rightVal
        case "<": return leftVal < rightVal
        case ">=": return leftVal >= rightVal
        case "<=": return leftVal <= rightVal
    }

    return false
}

function evaluateAST(node, context) {

    if (node.type === "comparison") {
        return evaluateComparison(node, context)
    }

    if (node.type === "AND") {
        return (
            evaluateAST(node.left, context) &&
            evaluateAST(node.right, context)
        )
    }

    if (node.type === "OR") {
        return (
            evaluateAST(node.left, context) ||
            evaluateAST(node.right, context)
        )
    }

    return false
}

module.exports = { evaluateAST }
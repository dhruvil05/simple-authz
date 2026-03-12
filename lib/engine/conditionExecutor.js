function getValue(path, context) {

    const parts = path.split(".")
    let value = context

    for (const p of parts) {

        if (value === undefined) return undefined
        value = value[p]

    }

    return value
}

function evaluateComparison(node, context) {

    const leftVal = getValue(node.left, context)

    let rightVal

    if (node.right.startsWith('"') || node.right.startsWith("'")) {
        rightVal = node.right.slice(1, -1)
    } else {
        rightVal = getValue(node.right, context)
    }

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
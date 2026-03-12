const { compileCondition } = require("../engine/conditionCompiler")

function compileRules(rules) {

    const permissions = {}
    const conditions = {}

    for (const rule of rules) {

        const { role, action, resource, condition } = rule

        if (condition) {

            if (!conditions[role]) conditions[role] = {}
            if (!conditions[role][resource]) conditions[role][resource] = {}
            if (!conditions[role][resource][action])
                conditions[role][resource][action] = []

            const compiledCondition = compileCondition(condition)

            conditions[role][resource][action].push(compiledCondition)

        } else {

            if (!permissions[role]) permissions[role] = {}
            if (!permissions[role][resource])
                permissions[role][resource] = new Set()

            permissions[role][resource].add(action)
        }
    }

    return { permissions, conditions }
}

module.exports = { compileRules }
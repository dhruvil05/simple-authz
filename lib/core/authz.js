const { parseRules } = require("../rules/parser")
const { compileRules } = require("../rules/compiler")
const { validateRules } = require("../rules/validator")
const { normalizeUser } = require("../utils/normalizeUser")
const { evaluateAST } = require("../engine/conditionExecutor")

class Authz {

    constructor() {
        this.permissions = {}
        this.conditions = {}
    }

    load(filePath) {

        const rules = parseRules(filePath)
        validateRules(rules)

        const compiled = compileRules(rules)

        this.permissions = compiled.permissions
        this.conditions = compiled.conditions
    }

    can(user, action, resourceType, data = {}) {

        const roles = normalizeUser(user)

        for (const role of roles) {

            const rolePerm = this.permissions[role]

            if (rolePerm) {

                const resourcePerm = rolePerm[resourceType]

                if (resourcePerm) {

                    if (resourcePerm.has("*") || resourcePerm.has(action)) {
                        return true
                    }
                }

                if (rolePerm["*"]) {

                    if (rolePerm["*"].has("*") || rolePerm["*"].has(action)) {
                        return true
                    }
                }
            }

            const roleCond = this.conditions[role]

            if (!roleCond) continue

            const resourceCond = roleCond[resourceType]

            if (!resourceCond) continue

            const actionCond = resourceCond[action]

            if (!actionCond) continue

            for (const cond of actionCond) {

                const context = {
                    user,
                    [resourceType]: data
                }

                if (evaluateAST(cond, context)) {
                    return true
                }
            }
        }

        return false
    }
}

module.exports = Authz
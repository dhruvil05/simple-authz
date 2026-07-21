const { compileCondition } = require("../engine/conditionCompiler")

function validateRules(rules) {

    const errors = []

    rules.forEach((rule, index) => {

        const ruleNumber = index + 1

        if (!rule.role) {
            errors.push(`Rule ${ruleNumber}: missing role`)
        }

        if (!rule.action) {
            errors.push(`Rule ${ruleNumber}: missing action`)
        }

        if (!rule.resource) {
            errors.push(`Rule ${ruleNumber}: missing resource`)
        }

        if (rule.condition) {

            // Previously this only checked whether an operator substring
            // (e.g. "==") appeared ANYWHERE in the condition text — it never
            // actually verified the condition parses. A condition like
            // "doc.status ==" (missing right-hand side) or one with mismatched
            // AND/OR usage would pass this check and then either crash later
            // deep inside the compiler with no rule number attached, or (worse)
            // silently compile into a broken/always-false comparison.
            //
            // Actually attempting to compile it here catches real structural
            // problems immediately, at the rule they belong to.
            try {
                compileCondition(rule.condition)
            } catch (err) {
                errors.push(
                    `Rule ${ruleNumber}: invalid condition "${rule.condition}" — ${err.message}`
                )
            }
        }

    })

    if (errors.length > 0) {

        throw new Error(
            "Policy validation failed:\n\n" +
            errors.join("\n")
        )
    }

}

module.exports = { validateRules }
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

            const validOperators = [
                "==", "!=", ">", "<", ">=", "<="
            ]

            const hasOperator = validOperators.some(op =>
                rule.condition.includes(op)
            )

            if (!hasOperator) {
                errors.push(
                    `Rule ${ruleNumber}: invalid condition "${rule.condition}"`
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
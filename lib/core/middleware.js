module.exports = function (authz) {
    return function (action, resourceType) {
        return (req, res, next) => {
            const user = req.user
            const resource = req.body || {}

            if (!user) {
                return res.status(401).json({ error: "Unauthorized" })
            }

            const allowed = authz.can(user, action, resourceType, resource)

            if (allowed) {
                return next()
            }

            return res.status(403).json({
                error: "Forbidden"
            })
        }
    }
}
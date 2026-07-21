/**
 * @param {Authz} authz
 */
module.exports = function (authz) {
    /**
     * @param {string} action
     * @param {string} resourceType
     * @param {(req: import('express').Request) => any | Promise<any>} [getResource]
     *   Optional loader that returns the REAL resource (e.g. fetched from DB)
     *   to authorize against. If omitted, falls back to `req.body` for
     *   backwards compatibility — but be aware `req.body` is client-controlled
     *   and MUST NOT be trusted for ownership/condition checks (a caller can
     *   put whatever `owner_id` they want in the body). Always pass
     *   `getResource` when your policy uses conditions like
     *   `resource.owner_id == user.id`.
     */
    return function (action, resourceType, getResource) {
        return async (req, res, next) => {
            const user = req.user

            if (!user) {
                return res.status(401).json({ error: "Unauthorized" })
            }

            try {
                const resource = typeof getResource === "function"
                    ? await getResource(req)
                    : (req.body || {})

                const allowed = authz.can(user, action, resourceType, resource)

                if (allowed) {
                    return next()
                }

                return res.status(403).json({
                    error: "Forbidden"
                })
            } catch (err) {
                return next(err)
            }
        }
    }
}
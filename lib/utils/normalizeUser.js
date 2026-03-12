function normalizeUser(user) {

    if (user.roles) return user.roles

    if (user.role) return [user.role]

    return []
}

module.exports = { normalizeUser }
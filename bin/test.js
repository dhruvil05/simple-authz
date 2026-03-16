const Authz = require("../lib/core/authz")

const authz = new Authz()

authz.load("./policies/authz.toon")

const user = {
  id: 5,
  role: "user"
}

const listing = {
  owner_id: 5
}

console.log(
  authz.can(user, "edit", "listing", listing)
)

const result = authz.explain(user, "edit", "listing", listing)

console.log(result)
const path = require("path")
const authz = require("../lib")

authz.load(path.join(__dirname, "test.toon"))

module.exports = authz
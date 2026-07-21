const path = require("path")
const Authz = require("../lib/core/authz")

describe("Middleware resource loading (regression)", () => {

    let authz

    beforeEach(() => {
        authz = new Authz()
        authz.load(path.join(__dirname, "test.toon"))
    })

    function mockRes() {
        return {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
    }

    test("still falls back to req.body when no loader is given (back-compat)", () => {
        const req = { user: { id: 1, role: "user" }, body: { owner_id: 1 } }
        const res = mockRes()
        const next = jest.fn()

        authz.middleware("edit", "listing")(req, res, next)

        expect(next).toHaveBeenCalled()
    })

    test("getResource loader is used instead of a client-supplied body claiming ownership", async () => {
        // Attacker sends a body that lies about owning the resource...
        const req = {
            user: { id: 1, role: "user" },
            body: { owner_id: 1 },
            params: { id: "42" }
        }
        const res = mockRes()
        const next = jest.fn()

        // ...but the real resource, fetched server-side, belongs to someone else.
        const getResource = jest.fn().mockResolvedValue({ owner_id: 999 })

        await authz.middleware("edit", "listing", getResource)(req, res, next)

        expect(getResource).toHaveBeenCalledWith(req)
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" })
        expect(next).not.toHaveBeenCalled()
    })

    test("getResource loader can legitimately allow access based on real data", async () => {
        const req = { user: { id: 1, role: "user" }, body: {}, params: { id: "1" } }
        const res = mockRes()
        const next = jest.fn()

        const getResource = jest.fn().mockResolvedValue({ owner_id: 1 })

        await authz.middleware("edit", "listing", getResource)(req, res, next)

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    test("a rejected getResource loader is forwarded to next(err), not swallowed", async () => {
        const req = { user: { id: 1, role: "user" }, body: {} }
        const res = mockRes()
        const next = jest.fn()

        const boom = new Error("db unavailable")
        const getResource = jest.fn().mockRejectedValue(boom)

        await authz.middleware("edit", "listing", getResource)(req, res, next)

        expect(next).toHaveBeenCalledWith(boom)
    })
})
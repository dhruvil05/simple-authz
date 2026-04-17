const authz = require("./setup")

describe("Middleware", () => {

  test("should call next() when allowed", () => {
    const req = {
      user: { id: 1, role: "user" },
      body: { owner_id: 1 }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const next = jest.fn()

    const middleware = authz.middleware("edit", "listing")

    middleware(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  test("should return 403 when denied", () => {
    const req = {
      user: { id: 1, role: "user" },
      body: { owner_id: 2 }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const next = jest.fn()

    const middleware = authz.middleware("edit", "listing")

    middleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" })
    expect(next).not.toHaveBeenCalled()
  })

})
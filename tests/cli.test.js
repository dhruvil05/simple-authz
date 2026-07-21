const path = require("path")
const { execFileSync } = require("child_process")

const CLI = path.join(__dirname, "..", "bin", "simple-authz", "index.js")
const POLICY = path.join(__dirname, "test.toon")

// Strip ANSI color codes (chalk output) so assertions don't depend on
// whether a given terminal/CI environment decides color is supported.
// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;]*m/g

function run(args) {
    const out = execFileSync("node", [CLI, ...args], {
        encoding: "utf8",
        env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" }
    })
    return out.replace(ANSI, "")
}

describe("CLI (regression — this was completely broken before)", () => {

    test("validate command runs and reports rules loaded", () => {
        const out = run(["validate", POLICY])
        expect(out).toMatch(/Policy file is valid/)
        expect(out).toMatch(/Rules loaded:\s*5/)
    })

    test("check command runs and correctly allows an admin", () => {
        const out = run([
            "check", POLICY,
            "--user", JSON.stringify({ id: 1, roles: ["admin"] }),
            "--action", "delete",
            "--resource", "listing"
        ])
        expect(out).toMatch(/ALLOWED/)
    })

    test("check command runs and correctly denies a mismatched owner", () => {
        expect(() => {
            run([
                "check", POLICY,
                "--user", JSON.stringify({ id: 1, roles: ["user"] }),
                "--action", "edit",
                "--resource", "listing",
                "--context", JSON.stringify({ owner_id: 2 })
            ])
        }).toThrow() // CLI exits 1 on denial — execFileSync throws on non-zero exit
    })

    test("benchmark command runs and prints real cache statistics", () => {
        const out = run(["benchmark", POLICY, "--iterations", "500"])
        expect(out).toMatch(/Checks\/sec/)
        expect(out).toMatch(/Cache Statistics/)
        expect(out).toMatch(/Hit rate:\s*\d/)
    })
})
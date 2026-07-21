---

# Simple Authz

A lightweight and flexible **authorization engine for Node.js** built around a simple policy language called **TOON (Token-Oriented Object Notation)**.

Simple Authz allows developers to **centralize authorization logic** using policy files instead of scattering permission checks across application code.

The goal of this project is to make authorization **simple, fast, readable, and scalable**.

---

## ⚠️ Development Status

**simple-authz** is currently under active development.

Some features may change, and there may be inconsistencies between the documentation and the package behavior.

We recommend testing thoroughly before using it in production.

---

# Table of Contents

- Overview
- Why Simple Authz
- Key Features
- Installation
- Quick Start
- Core Concepts
- Policy Language (TOON)
- Policy Examples
- Using Conditions
- Working with Roles
- Authorization API
- Middleware (Express)
- Example Integrations
- Project Structure
- Performance
- Security Model
- Roadmap
- Contributing
- License

---

# Overview

Most applications implement authorization like this:

```javascript
if(user.role === "admin") { ... }
if(user.id === listing.owner_id) { ... }
if(user.permissions.includes("edit_listing")) { ... }
```

Over time this logic spreads across many files and becomes difficult to maintain.

**Simple Authz solves this by moving authorization rules into policy files.**

---

# Why Simple Authz

Benefits of centralized authorization:

* Clear separation between **business logic and security rules**
* Easy permission updates without touching application code
* Better maintainability for large projects
* Safer and more predictable access control
* Easier onboarding for new developers

---

# Key Features

* Simple and readable **policy language (TOON)**
* Fast permission lookup (compiled rules)
* Built-in **caching for repeated checks**
* Support for **multiple user roles**
* Logical **conditional rules (AND / OR)**
* Policy **validation**
* Policy **AST compilation (no eval)**
* Express middleware support
* Debugging via `authz.explain()`
* TypeScript support
* Lightweight with minimal dependencies

---

# Installation

```bash
npm install simple-authz
```

---

# Quick Start

## 1. Import the library

```javascript
const authz = require("simple-authz");
```

---

## 2. Create a policy file

```
authz.toon
```

```toon
rule
  role admin
  action *
  resource *
end

rule
  role user
  action edit
  resource listing
  condition listing.owner_id == user.id
end
```

---

## 3. Load the policy

```javascript
authz.load("./authz.toon");
```

---

## 4. Check permissions

```javascript
authz.can(user, "edit", "listing", listing);
```

---

## 5. Debug with `authz.explain()`

```javascript
const result = authz.explain(user, "edit", "listing", listing);

console.log(result);
```

Example output:

```javascript
{
  allowed: true,
  role: "user",
  resource: "listing",
  action: "edit",
  reason: "condition passed"
}
```

---

# Middleware (Express)

Protect routes easily:

```javascript
const express = require("express");
const authz = require("simple-authz");

const app = express();
app.use(express.json());

authz.load("./authz.toon");

app.post(
  "/listing",
  authz.middleware("edit", "listing"),
  (req, res) => {
    res.send("Allowed");
  }
);
```

> ⚠️ **Security note:** by default the middleware checks against `req.body`.
> That's fine for actions where the body *is* the thing being created, but
> if your policy has conditions like `listing.owner_id == user.id`, a client
> can put whatever `owner_id` it wants in its own request body and bypass
> the check. Pass a third argument — an (optionally async) function that
> loads the **real** resource from your database — whenever a condition
> depends on data the client shouldn't be trusted to supply:
>
> ```javascript
> app.post(
>   "/listing/:id",
>   authz.middleware("edit", "listing", async (req) => {
>     return await db.listings.findById(req.params.id);
>   }),
>   (req, res) => {
>     res.send("Allowed");
>   }
> );
> ```

---

# Core Concepts

```
Subject → Action → Resource
```

| Component | Description   |
| --------- | ------------- |
| Subject   | User          |
| Action    | Operation     |
| Resource  | Target object |

---

# Policy Language (TOON)

Basic syntax:

```
rule
  role <role>
  action <action>
  resource <resource>
end
```

The parser is strict on purpose: a stray `end`, a `rule` opened twice without
closing it, an unrecognized key (e.g. a typo'd `roel`), or a key with no
value all throw a clear error with the line number, instead of silently
dropping or mis-parsing part of your policy. `authz.load()` runs full
validation too — every condition is actually compiled during validation, so
a broken condition (missing operand, mixed `AND`/`OR`, etc.) is reported
against its rule number at load time rather than failing later, mid-request,
somewhere inside the evaluator.

---

# Wildcards

```
action *
resource *
```

---

# Conditional Rules

Example:

```
condition listing.owner_id == user.id AND listing.status != "published"
```

Chains of any length work: `a == 1 AND b == 2 AND c == 3`. You can also
compare against numbers and booleans directly (`listing.views > 100`), not
just strings.

Only one operator type per condition — `AND` and `OR` can't be mixed in the
same condition (`a == 1 AND b == 2 OR c == 3` throws an error). Split that
into two separate rules instead.

String literals are quote-safe: a value like
`doc.title == "Terms AND Conditions"` is treated as one literal, not
accidentally split on the "AND" inside it.

---

# Policy Examples

### Ownership Rule

```
rule
  role user
  action edit
  resource listing
  condition listing.owner_id == user.id
end
```

---

# Working with Roles

```javascript
user.role = "admin";
```

or

```javascript
user.roles = ["user", "editor"];
```

Access is granted if **any role matches**.

---

# Authorization API

## Load policy

```javascript
authz.load("./authz.toon");
```

---

## Check permission

```javascript
authz.can(user, action, resource, data);
```

---

## Explain decision

```javascript
authz.explain(user, action, resource, data);
```

---

# Example Integration

```javascript
if (!authz.can(req.user, "edit", "listing", req.listing)) {
  return res.status(403).send("Access denied");
}
```

---

# Project Structure Example

```
project/
├── policies/
│   └── authz.toon
├── src/
├── app.js
└── package.json
```

---

# Performance

* Rules compiled into indexed structure
* AST-based condition evaluation
* O(1) permission lookup
* Built-in LRU cache with TTL-based expiration, keyed by user + action +
  resource + object id (falls back to a data snapshot if there's no id)

**Caching caveat:** because the cache keys on object *identity* (id/owner_id),
if a resource's *other* fields change while its id stays the same (e.g. a
document gets locked) within the TTL window, a stale decision can be served.
Call `authz.clearCache()` right after any write that could flip a condition's
outcome, or lower `cacheTTL` / set `cacheEnabled: false` for policies with
conditions on fast-changing fields:

```javascript
const authz = new Authz({ cacheEnabled: true, cacheSize: 1000, cacheTTL: 60 });
```

---

# CLI

```bash
npx simple-authz validate ./policies/authz.toon
npx simple-authz check ./policies/authz.toon --user '{"id":1,"roles":["user"]}' --action edit --resource listing --context '{"owner_id":1}'
npx simple-authz benchmark ./policies/authz.toon --iterations 10000
```

* `validate` — parses and validates a policy file, lists roles found
* `check` — runs `authz.explain()` against a policy and prints the decision
* `benchmark` — runs repeated checks and prints throughput + cache stats

---

# Security Model

**Deny by default**

```
no rule → deny
rule exists → allow
```

---

# Roadmap

### v1.2

* Role hierarchy
* Modular policies

### v2.0

* Advanced ABAC
* Distributed policies
* Policy versioning

---

# Contributing

1. Fork repository
2. Create branch
3. Submit PR

---

# License

Apache 2.0

---
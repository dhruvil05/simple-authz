Your README is already strong — we just need to **upgrade it to reflect v1.1.0 features** without breaking its structure.

I’ll **edit and improve your version**, not rewrite from scratch.

---

# ✅ Updated README (v1.1.0 Improvements Applied)

Below is your improved version with:

* ✔ middleware added
* ✔ caching mentioned
* ✔ TypeScript support
* ✔ `authz.explain()` refined
* ✔ Quick Start fixed (you exported instance, not class ⚠️)
* ✔ small clarity + professionalism upgrades

---

````markdown
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
````

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
* Built-in caching layer

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

* CLI tool
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

# Keywords

authorization, rbac, abac, nodejs, security, policy-engine

````


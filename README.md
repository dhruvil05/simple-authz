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

Example policy file:

```
rule
  role admin
  action *
  resource *
end

rule
  role broker
  action publish
  resource listing
end

rule
  role user
  action edit
  resource listing
  condition listing.owner_id == user.id
end
```

Your application then only needs to ask:

```javascript
authz.can(user, "edit", "listing", listing);
```

---

# Why Simple Authz

Benefits of centralized authorization:

- Clear separation between **business logic and security rules**
- Easy permission updates without touching application code
- Better maintainability for large projects
- Safer and more predictable access control
- Easier onboarding for new developers

---

# Key Features

- Simple and readable **policy language**
- Fast permission lookup
- Support for **multiple user roles**
- Logical **conditional rules**
- Policy **validation**
- Policy **AST compilation**
- Lightweight with minimal dependencies
- Works with any Node.js framework

---

# Installation

Install using npm:

```bash
npm install simple-authz
```

---

# Quick Start

## 1. Import the library

```javascript
const Authz = require("simple-authz");

const authz = new Authz();
```

---

## 2. Create a policy file

Create a file called:

```
authz.toon
```

Example policy:

```
rule
  role admin
  action *
  resource *
end

rule
  role broker
  action publish
  resource listing
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
const allowed = authz.can(user, "edit", "listing", listing);
```

Example usage:

```javascript
if (authz.can(user, "edit", "listing", listing)) {
  updateListing();
} else {
  throw new Error("Access denied");
}
```

---

## 5. `authz.explain()` (Optional)

The `authz.explain()` method helps debug authorization decisions by returning detailed information about **why access was allowed or denied**.

Unlike `authz.can()`, which returns only `true` or `false`, this method returns an object explaining the result.

### Usage

```javascript
authz.explain(user, "edit", "listing", listing);
```

### Example

```javascript
const result = authz.explain(user, "edit", "listing", listing);

console.log(result);
```

### Example Output

```javascript
{
  allowed: true,
  role: "user",
  resource: "listing",
  action: "edit",
  reason: "condition passed"
}
```

If no rule matches:

```javascript
{
  allowed: false,
  reason: "no matching rule"
}
```

Use `authz.explain()` for **debugging and development**, and `authz.can()` for **regular authorization checks**.

---

# Core Concepts

Simple Authz follows a common authorization model:

```
Subject → Action → Resource
```

| Component | Description                    |
| --------- | ------------------------------ |
| Subject   | The user performing the action |
| Action    | What the user wants to do      |
| Resource  | The object being accessed      |

Example:

```
broker → edit → listing
```

---

# Policy Language (TOON)

Policies are written in **TOON format**.

Basic rule syntax:

```
rule
  role <Role>
  action <Action>
  resource <Resource>
end
```

Example:

```
rule
  role admin
  action *
  resource *
end

rule
  role broker
  action publish
  resource listing
end

rule
  role user
  action edit
  resource listing
  condition listing.owner_id == user.id
end
```

---

# Wildcard Permissions

You can use `*` to allow everything.

Example:

```
rule
  role admin
  action *
  resource *
end
```

This allows the admin role to perform **any action on any resource**.

---

# Conditional Rules

Policies can include conditions.

Syntax:

```
rule
  role <role>
  action <action>
  resource <resource>
  condition <condition1> OR <condition2>
end
```

Example:

```
rule
  role user
  action view
  resource listing
  condition listing.status == "public" OR listing.owner_id == user.id
end
```

Meaning:

A broker can only edit listings they own.

---

# Condition Variables

Conditions can reference:

| Variable | Description           |
| -------- | --------------------- |
| user     | authenticated user    |
| resource | target resource       |
| context  | optional request data |

Example:

```
rule
  role user
  action edit
  resource profile
  condition user.id == resource.id
end
```

---

# Policy Examples

## Example 1 – Basic Roles

```
rule
  role admin
  action *
  resource *
end

rule
  role broker
  action publish
  resource listing
end

rule
  role user
  action edit
  resource listing
end
```

---

## Example 2 – Ownership Rules

```
rule
  role broker
  action edit
  resource listing
  condition listing.owner_id == user.id
end
```

---

## Example 3 – Multiple Rules

```
rule
  role admin
  action *
  resource *
end

rule
  role broker
  action publish
  resource listing
end

rule
  role user
  action edit
  resource listing
  condition listing.owner_id == user.id
end
```

---

# Working with Roles

Users can have one or multiple roles.

Example user:

```javascript
const user = {
  id: 10,
  roles: ["broker"],
};
```

Multiple roles:

```javascript
const user = {
  id: 5,
  roles: ["user", "editor"],
};
```

The engine checks permissions against **all roles**.

---

# Authorization API

## Load policy file

```javascript
authz.load("./authz.toon");
```

---

## Check permission

```javascript
authz.can(user, action, resource, object);
```

Example:

```javascript
authz.can(user, "edit", "listing", listing);
```

Returns:

```
true
false
```

---

# Example Integration

## Example: Listing System

User:

```javascript
const user = {
  id: 10,
  roles: ["broker"],
};
```

Listing:

```javascript
const listing = {
  owner_id: 10,
};
```

Permission check:

```javascript
authz.can(user, "edit", "listing", listing);
```

Result:

```
true
```

---

# Example: Express.js Integration

Example route protection:

```javascript
app.put("/listing/:id", async (req, res) => {
  const allowed = authz.can(req.user, "edit", "listing", req.listing);

  if (!allowed) {
    return res.status(403).send("Access denied");
  }

  updateListing();
});
```

---

# Project Structure Example

Recommended project layout:

```
project
│
├── policies
│   └── authz.toon
│
├── src
│
├── app.js
│
└── package.json
```

---

# Performance

Policies are compiled into an **internal permission index** for fast lookups.

Authorization checks are optimized to avoid scanning all rules.

This allows the engine to remain efficient even as policy files grow.

---

# Security Model

Default behavior follows the **deny-by-default principle**.

Meaning:

If no rule allows an action, access is automatically denied.

```
no rule → deny
rule exists → allow
```

This reduces the risk of unintended access.

---

# Roadmap

Future versions may include:

- Policy hot reloading
- Role inheritance
- Policy debugger
- Middleware helpers
- Permission caching
- Modular policy files
- Distributed policy storage

---

# Contributing

Contributions are welcome.

Steps:

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Open a pull request

---

# License

This project is licensed under the [Apache 2.0 license](LICENSE).

---

# Author

Simple Authz was created to simplify authorization logic in modern Node.js applications.

# Keywords

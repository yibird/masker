# Overview

**masker** is a **TypeScript data-masking toolkit** for Node.js, Bun, and modern frontend build pipelines.

It solves one very specific problem: phone numbers, emails, card numbers, JWTs, and URL tokens routinely show up in business logs, HTTP responses, and audit trails. You need to turn them into something readable-but-unusable **before they leave the process**, while also:

- Avoiding large dependencies or hand-rolled regex piles
- Avoiding `JSON.stringify` on the whole object for every call
- Avoiding fights with `any` in TypeScript
- Avoiding masking logic that corrupts the input object

## Design principles

| Principle            | What it means                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------- |
| **Simple**           | `maskEmail(value)` works with zero configuration                                         |
| **Configurable**     | Each type has semantic options instead of a one-size-fits-all `keepStart`                |
| **Composable**       | Single function → `maskObject` schema → precompiled `createMasker` for hot paths         |
| **Type-safe**        | No `any` in the public API; preset names and options all use literal types               |
| **Side-effect free** | Inputs are never mutated by default; copy-on-write keeps untouched subtrees by reference |
| **Predictable**      | Same input + same config → same output                                                   |
| **Fast**             | Constant regexes, ASCII fast paths, schema precompilation, no exceptions on hot paths    |

## What it's not for

masker is **not**:

- An encryption library (masking ≠ encryption)
- A JWT verifier (it never base64-decodes or checks signatures)
- An implicit prerequisite for card Luhn checks (`isLuhnValid` is a standalone API)
- A framework plugin system (no IoC, decorators, or plugins)

## Capability map

```text
String-level
  maskEmail · maskPhone · maskName · maskAddress
  maskCreditCard · maskBankAccount · maskIdCard
  maskVehicle (plate / VIN) · maskMac
  maskJwt · maskIp · maskUrl · maskGeneric

Object-level
  maskFields(path schema)  — paths + { type, options }, single call
  maskObject(schema)     — paths + wildcards, single call
  createMasker(schema)   — precompiled, reusable on hot paths
  maskLog({ fields })    — match by field name at any depth (logger-friendly)

Utilities
  isLuhnValid            — validation decoupled from masking
```

## Where to start

- Install → [Installation](/en/guide/installation)
- Five-minute onboarding → [Quick Start](/en/guide/quick-start)
- Try it live → [Playground](/en/playground)
- Logging integration → [Logger](/en/advanced/logger)
- Full signatures → [API Reference](/en/reference/api)

## Relationship to the README

This site goes beyond the README with **more complete examples, interactive demos, and scenario guides**; API semantics stay consistent with the README. If you find a discrepancy, the code and unit tests are the source of truth.

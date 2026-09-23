# FAQ

## Why ESM only?

Modern Node (18+) and Bun support ESM natively; dual-format builds multiply conditional-export and interop costs. `sideEffects: false` plus pure ESM helps tree-shaking. For CJS, use `await import('masker')`.

## What is the difference between masking and encryption?

Masking is **irreversible truncation/masking** for logs and display; encryption is reversible and meant for storage and transport. See [Security](/en/advanced/security).

## Does `maskCreditCard` check whether a card number is valid?

No. Call `isLuhnValid` explicitly when you need validity checks. The two are decoupled: an invalid number that merely looks like a card can still be masked.

## Why doesn't the JWT get decoded?

Decoding would pull in validation duties and payload-handling risks. masker only splits on `.` — the focused intent is "keep tokens out of logs in plaintext."

## Do empty strings / invalid input throw?

Data maskers **never throw**; invalid input is returned as-is.  
Schema / `createMasker` **configuration errors** throw a `TypeError` at compile time (surfacing at startup, not on the first log line).

## Are objects mutated?

No. `maskObject` / `maskLog` / `masker.mask` are all copy-on-write; unchanged subtrees keep their original references. `source !== result` only when something actually changed.

## How do wildcards perform?

Paths are built into a trie at `createMasker` / first compilation time; each `.mask()` call does not re-run `split('.')`.

## Is CommonJS `require('masker')` supported?

No. See the rationale above.

## How do I handle `Authorization: Bearer …`?

```ts
maskJwt(auth.replace(/^Bearer\s+/i, ''));
// or mask the whole string with maskGeneric({ keepStart: 7, keepEnd: 0 })
```

## How do I choose between `maskLog` and `maskObject`?

|                | Exact path | Deep by field name | Typical use                 |
| -------------- | ---------- | ------------------ | --------------------------- |
| `maskObject`   | ✓          | ✗                  | API responses, fixed DTOs   |
| `maskLog`      | ✗          | ✓                  | Log bodies, variable shapes |
| `createMasker` | ✓ / fields | ✓                  | Reuse on hot paths          |

They compose: `createMasker({ schema, fields })` runs both.

## How does an `Error` message get into `fields`?

`maskLog` materializes an `Error` as `{ name, message, stack }`. `maskObject` does not expand `Error`s.

## Why is there no `new Masker()` class-instance API?

There is no mutable state across calls; the only "state" is precompiled rules. `createMasker()` therefore returns a lightweight object, avoiding an OOP hierarchy.

## Are Chinese / emoji lengths correct?

Lengths are counted in **grapheme clusters** (`Intl.Segmenter`, available on Node 18+ / Bun). Without `Segmenter` it falls back to code points, without pulling in a large Unicode dependency.

## How do you keep examples consistent with the code?

On the docs site, `MaskExample` / `HomeDemo` / `Playground` **import the source directly** and run it; outputs come from the real implementation, not hand-written fake results.

## Are there benchmarks?

Yes: `npm run bench` (`benchmark/bench.mjs`). The docs **do not hard-code** absolute numbers that have not been verified on a given machine — see [Performance](/en/advanced/performance).

## Can it run in the browser?

The library uses no Node-only APIs, so bundling it for the frontend works; consider whether you want masking rules exposed on the client (usually the server boundary is more appropriate).

## Minimum Node version?

`engines.node: >= 18` (`URL`, `Intl.Segmenter`, ESM).

Related: [API](/en/reference/api) · [Security](/en/advanced/security)

# Performance

masker is built for **loggers, middleware, and high-QPS response masking**, with a design that minimizes allocations and repeated parsing.

## What it does

| Technique               | Description                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ |
| Constant regexes        | Module-level regexes; no per-call `new RegExp`                                       |
| ASCII fast path         | Pure-ASCII strings use UTF-16 indexing and skip Segmenter (Email / Name / Generic)   |
| Schema identity cache   | Same schema object reference reuses the compiled trie (`WeakMap`)                    |
| Schema precompilation   | Paths are parsed into a trie at `createMasker`; `.mask()` never re-runs `split('.')` |
| Copy-on-write           | Missed subtrees keep their references; no full deep copy                             |
| Single-pass scan        | Phone / Card / Bank walk once; pure-digit phones use a slice fast path               |
| Interned array keys     | Indices `0..63` use pre-interned strings — avoids `String(i)` allocations            |
| Native URL              | `URL` / `URLSearchParams`; no giant URL regex                                        |
| Lazy allocation         | Empty schema / no fields returns the original reference immediately                  |
| No JSON on the hot path | Does not use `JSON.stringify` / `parse` for masking                                  |

## What it does not do

- No runtime dependencies
- No per-call closure factories (presets resolve at compile time)
- No decorators / reflection / plugin bus

## Complexity (intuition)

| Operation            | Complexity                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Single-string masker | O(n) where n = string length (ASCII ≈ O(n) without segmentation)                                                          |
| `maskObject`         | O(visited nodes) × active path set (usually tiny); compile is skipped when the same schema object hits the identity cache |
| `createMasker`       | O(total path segments), once only                                                                                         |
| `maskLog(fields)`    | O(object tree size) — one Map lookup per key                                                                              |

Wildcards are not re-parsed during traversal; active trie nodes advance and are pruned as you descend.

::: tip Treat schema objects as immutable
`maskObject` / `maskFields` / `createMasker` cache compiled tries in a `WeakMap` keyed by **schema object identity**. Do not mutate keys after the first compile — create a new object instead.
:::

## When to use which API

```text
At startup
  createMasker(schema | fields)     ← compile once

Per request / per log line
  masker.mask(value)                ← hot path

Scripts / tests / one-offs
  maskObject(value, schema)
  maskLog(value, { fields })        ← includes compile; acceptable
```

## Run benchmarks locally

The repo ships a script (**real runs — no invented numbers in the docs**):

```bash
npm run build
npm run bench
# equivalent to
# node benchmark/bench.mjs
```

Scenarios covered:

- `maskEmail` / `maskPhone` / `maskGeneric` / `maskUrl`
- `maskObject` one-shot (including schema compile)
- `createMasker().mask` (precompiled)
- `maskLog` fields
- Large arrays (10k elements)

### Compare on Bun

```bash
npm run build
bun benchmark/bench.mjs
```

> **Note:** If Bun is not installed in the development environment for this project, the docs will not quote Bun numbers. Run them on your target machine and record the results yourself.

### Reading results

- Look at `ops/s` and `ms` first; run several times to observe variance
- Large-object scenarios are sensitive to GC
- Do not compare absolute microbenchmark values across machines

## Practical advice

1. **Precompile** schemas/fields instead of compiling per line in `maskLog`
2. Keep field-name maps **small** (hot Map lookups)
3. For very large payloads, **trim at the boundary** before masking (drop fields that should not be there)
4. For very long secrets, use `maskLength` so the mask string stays short
5. Avoid “mask → JSON → parse again” on the hot path

## Memory

- Copy-on-write: no changes → no new tree
- Mask strings are allocated only when something actually changes
- JWT masks are fixed length by default; they do not scale linearly with segment length

Related: [Path & Schema](/en/object/path-schema) · [benchmark/bench.mjs](https://github.com/masker-js/masker/blob/main/benchmark/bench.mjs)

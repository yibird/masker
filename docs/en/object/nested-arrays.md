# Nested & Arrays

Real business objects are rarely flat. This page collects behavior for nesting, arrays, Map/Set, circular references, and readonly values.

## Deeply nested objects

```ts
import { maskObject } from 'masker';

const payload = {
  id: 'evt_01',
  actor: {
    id: 7,
    profile: {
      email: 'zhangsan@example.com',
      phone: '13812345678',
      private: {
        ssnLike: '11010119900101',
        note: 'internal',
      },
    },
  },
};

const safe = maskObject(payload, {
  'actor.profile.email': 'email',
  'actor.profile.phone': 'phone',
  'actor.profile.private.ssnLike': (v: string) =>
    v.length > 6 ? v.slice(0, 6) + '********' : '********',
});
```

```text
safe.actor.profile.email             → z******n@example.com
safe.actor.profile.phone             → 138****5678
safe.actor.profile.private.ssnLike   → 110101********
safe.actor.profile.private.note      → internal   (not configured; as-is)
payload itself stays unchanged
```

## Arrays

### Element-level fields

```ts
const data = {
  users: [
    { name: 'Alice', email: 'alice@x.com' },
    { name: 'Bob', email: 'bob@x.com' },
    { name: '张三', email: 'zhangsan@x.com' },
  ],
};

const out = maskObject(data, {
  'users.*.name': 'name',
  'users.*.email': 'email',
});
```

```text
[
  { name: 'A***e', email: '*@x.com' },
  { name: 'B*', email: '*@x.com' },
  { name: '张*', email: 'z******n@x.com' },
]
```

### Whole array values

If the rule targets the array field itself and the value is `string[]`, only **string leaves** get the masker:

```ts
maskObject({ tokens: ['aaa.bbb.ccc'] }, { tokens: 'jwt' });
// rule is on tokens; the implementation applies the current path’s terminal to string leaves
```

> In practice, prefer `*` over inner array fields, e.g. `'tokens.*': 'jwt'`.

### Sparse / mixed arrays

```ts
const arr = [null, undefined, { email: 'a@b.com' }, 42];

maskObject({ list: arr }, { 'list.*.email': 'email' });
// list[0] → null
// list[1] → undefined
// list[2].email → *@b.com
// list[3] → 42
```

## Map and Set

```ts
const src = {
  m: new Map<string, string>([['email', 'a@b.com']]),
  s: new Set(['x']),
};

const out = maskObject(src, { 'm.email': 'email' });
// out.m.get('email') → *@b.com
// out.m !== src.m (Map was cloned)
// out.s === src.s (unchanged)
// src.m is still a@b.com
```

`Set` elements have no key names, so path rules usually miss them; expand to an array on the outside first, or use `maskLog` for key-bearing structures only.

## Date / atomic values

```ts
const src = {
  createdAt: new Date('2020-01-01T00:00:00Z'),
  flag: true,
  n: 1,
  z: null,
  u: undefined,
};

maskObject(src, { email: 'email' }) === src; // true, no changes
// Date keeps the same reference; it is never cloned into {} or a string
```

## Readonly / frozen

```ts
const src = Object.freeze({
  name: '张三',
  profile: Object.freeze({ email: 'a@b.com' }),
});

const out = maskObject(src, {
  name: 'name',
  'profile.email': 'email',
});
// out.name → 张*
// out.profile.email → *@b.com
// the source object is not written (no strict-mode error)
```

## Circular references

```ts
type Node = { email: string; self?: Node };

const src: Node = { email: 'a@b.com' };
src.self = src;

const out = maskObject(src, { email: 'email' });
// out.email → *@b.com
// out.self === src or out — no RangeError
// src.email is still a@b.com
```

The implementation keeps a `Set<object>` for the current path; when a cycle is detected it returns the **original reference** (copy-on-write avoids infinite cloning).

## Copy-on-Write details

```ts
const out = maskObject(big, { name: 'name' });
// if no rules hit the big.profile / big.users subtrees:
out.profile === big.profile; // true
out.users === big.users; // true
```

Only branches that actually change get `{ ...parent }`. Empty schema:

```ts
maskObject(big, {}) === big; // true
```

## Difference from maskLog (Error)

|          | `maskObject`               | `maskLog`                                                      |
| -------- | -------------------------- | -------------------------------------------------------------- |
| `Error`  | atomic, original reference | materialized as `{ name, message, stack }` then fields applied |
| Matching | path                       | field name at any depth                                        |

See [Logger](/en/advanced/logger).

Related: [maskObject](/en/object/overview) · [Path & Schema](/en/object/path-schema)

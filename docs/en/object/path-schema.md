# Path & Schema

A schema is a table of **path → masking rule**. Understanding paths, wildcards, and `createMasker` precompilation is what lets you use masker on high-QPS log pipelines.

## Why a schema?

Hand-writing per field:

```ts
const safe = {
  ...user,
  email: maskEmail(user.email),
  phone: maskPhone(user.phone),
  profile: {
    ...user.profile,
    creditCard: maskCreditCard(user.profile.creditCard),
  },
};
```

Problems:

1. Every new nesting level must be expanded by hand; missed fields are easy to miss
2. Arrays / map-like structures need your own recursion
3. Adding a sensitive field means updating every call site

A schema collapses “where and how to mask” into one table:

```ts
const schema = {
  email: 'email',
  phone: 'phone',
  'profile.creditCard': 'creditCard',
  'users.*.email': 'email',
};

maskObject(user, schema);
```

## Path syntax

| Syntax            | Meaning                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `email`           | `email` on the root                                                  |
| `profile.address` | nested object                                                        |
| `a.b.c.d`         | any depth                                                            |
| `users.*.phone`   | `phone` on **every** item under `users` (array element or map value) |
| `*`               | any single key / index                                               |

Rules:

- The separator is always `.`
- Empty segments (`a..b`, `''.`, `a.`) → `TypeError` at compile time
- `*` does **not** span multiple levels (`a.*` is not `a.**`)
- Non-existent paths are skipped silently (not an error)

## Preset vs object rule vs function

```ts
// preset — concise
{
  email: 'email';
}

// { type, options } — preferred form for maskFields
{
  'user.email': { type: 'email' };
  'user.phone': { type: 'phone', options: { keepEnd: 4 } };
}

// function — bind any logic
import { maskPhone } from 'masker';
{
  phone: (v: string) => maskPhone(v, { mask: '#' });
}

// direct reference (default options)
{
  email: maskEmail;
}
```

One-shot path-precise masking with `maskFields`:

```ts
import { maskFields } from 'masker';

maskFields(
  {
    user: {
      email: 'jane@company.com',
      phone: '+14155550123',
    },
  },
  {
    'user.email': { type: 'email' },
    'user.phone': { type: 'phone' },
  },
);
```

Unknown string presets / unknown `type`:

```ts
{
  email: 'nope';
} // TypeError: Invalid masker…

{
  email: {
    type: 'nope';
  }
} // TypeError: Invalid masker type…
```

Valid presets:

`email` `phone` `name` `address` `creditCard` `idCard` `bankAccount` `mac` `vehicle` `jwt` `ip` `url` `generic`

## Wildcards in practice

### Arrays

```ts
const data = {
  users: [
    { email: 'a@x.com', phone: '13812345678' },
    { email: 'b@x.com', phone: '13999999999' },
  ],
};

const out = maskObject(data, {
  'users.*.email': 'email',
  'users.*.phone': 'phone',
});
```

```text
users[0].email → *@x.com
users[0].phone → 138****5678
users[1].email → *@x.com
users[1].phone → 139****9999
```

### Object maps

```ts
const groups = {
  a: { email: 'a@x.com' },
  b: { email: 'b@x.com' },
};

maskObject(groups, { '*': 'generic' });
// { a: '*******', b: '*******' } — mind types when the rule hits values directly

maskObject({ groups }, { 'groups.*.email': 'email' });
```

### Mixing exact paths and wildcards

```ts
maskObject(data, {
  email: 'email', // exact
  'profile.secret': 'generic',
  'items.*.token': 'jwt',
});
```

Under the hood, paths compile into a **trie**: each key descent tries both the exact child and the wildcard child — **no** `split('.')` on every `.mask()`.

## createMasker — precompilation

```ts
import { createMasker } from 'masker';

const masker = createMasker({
  email: 'email',
  phone: 'phone',
  'users.*.phone': 'phone',
  'profile.creditCard': 'creditCard',
});

// hot path
logger.info(masker.mask(payload));
```

### Parsing happens at creation

| Phase            | What happens                                                         |
| ---------------- | -------------------------------------------------------------------- |
| `createMasker()` | parse paths, build trie, resolve presets/functions, normalize config |
| `masker.mask()`  | traverse + apply only; no schema parsing                             |

### fields + schema together

`createMasker` also accepts field-name patterns (Logger style):

```ts
const masker = createMasker({
  fields: {
    password: 'generic',
    token: 'generic',
    email: 'email',
  },
  schema: {
    'profile.creditCard': 'creditCard',
  },
});

masker.mask(user);
// 1) walk the path schema once
// 2) then deep-match fields by field name
```

Fields only:

```ts
createMasker({ fields: { password: 'generic' } });
```

Path only (shorthand):

```ts
createMasker({ email: 'email', phone: 'phone' });
```

### Invalid configuration

```ts
createMasker(null); // TypeError
createMasker({ schema: { 'a..b': 'email' } }); // TypeError
createMasker({ fields: { x: 'nope' } }); // TypeError
createMasker({}); // valid: no-op masker
```

## Type Safety

```ts
import type { ObjectSchema, SchemaMasker, PresetName } from 'masker';

const schema = {
  email: 'email',
  custom: (v: string) => v.slice(0, 2) + '***',
} satisfies ObjectSchema;
```

`satisfies` checks that preset names are legal without widening the type.

## Performance guidance

| Scenario                               | Recommendation                          |
| -------------------------------------- | --------------------------------------- |
| Configure at startup, call per request | `createMasker`                          |
| Tests / scripts / one-shot transforms  | `maskObject(value, schema)`             |
| Field names only, structure unknown    | `maskLog` or `createMasker({ fields })` |

Related: [Nested & Arrays](/en/object/nested-arrays) · [Performance](/en/advanced/performance) · [API](/en/reference/api)

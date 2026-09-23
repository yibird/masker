# maskObject

`maskObject` walks and masks deeply according to a **schema (path → rule)**, **does not mutate the input by default**, and is copy-on-write: subtrees with no rule hits keep their original references, avoiding pointless deep copies.

```ts
function maskObject<T>(value: T, schema: ObjectSchema): T;
```

## Full example

```ts
import { maskObject } from 'masker';

const user = {
  id: 10001,
  name: '张三',
  email: 'zhangsan@example.com',
  phone: '13812345678',
  profile: {
    address: '北京市朝阳区xxx街道xxx号',
    creditCard: '4111111111111111',
  },
};

const masked = maskObject(user, {
  name: 'name',
  email: 'email',
  phone: 'phone',
  'profile.address': 'address',
  'profile.creditCard': 'creditCard',
});
```

### Before

```json
{
  "id": 10001,
  "name": "张三",
  "email": "zhangsan@example.com",
  "phone": "13812345678",
  "profile": {
    "address": "北京市朝阳区xxx街道xxx号",
    "creditCard": "4111111111111111"
  }
}
```

### After (actual structure)

```json
{
  "id": 10001,
  "name": "张*",
  "email": "z******n@example.com",
  "phone": "138****5678",
  "profile": {
    "address": "北京市朝阳区*********",
    "creditCard": "************1111"
  }
}
```

### Immutability

```ts
masked !== user; // true
user.name === '张三'; // source data is not rewritten
```

Fields not listed in the schema (like `id`) and **sibling fields that did not match** keep their values; if `profile` changes as a whole it becomes a shallow copy, while unchanged subtrees such as `users` may still be `===` the original reference (see below).

## Three ways to write schema values

### 1. Preset name strings

```ts
maskObject(data, {
  email: 'email',
  phone: 'phone',
});
```

Available presets: `email` · `phone` · `name` · `address` · `creditCard` · `idCard` · `bankAccount` · `mac` · `vehicle` · `jwt` · `ip` · `url` · `generic`

### 2. `{ type, options }` object rules (same as `maskFields`)

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

// With options:
maskFields(data, {
  email: { type: 'email', options: { keepStart: 2, keepEnd: 2 } },
  secret: { type: 'generic', options: { keepStart: 2, keepEnd: 2, mask: '#' } },
});
```

`maskObject`, `maskLog` `fields`, and `createMasker` also accept this object form.

### 3. Functions (bring your own options)

```ts
import { maskObject, maskEmail, maskPhone, maskGeneric } from 'masker';

maskObject(data, {
  email: maskEmail,
  phone: (v: string) => maskPhone(v, { mask: '#' }),
  secret: (v: string) => maskGeneric(v, { keepStart: 2, keepEnd: 2 }),
});
```

## Deep paths

Paths are joined with `.` to any depth:

```ts
maskObject(data, {
  'account.billing.card': 'creditCard',
  'meta.device.fingerprint': 'generic',
});
```

## Wildcard `*`

`*` matches **one** object key or array index (details under [Path & Schema](/en/object/path-schema)):

```ts
maskObject(data, {
  'users.*.email': 'email',
  'users.*.phone': 'phone',
});
```

## Supported value types

| Type                                    | Behavior                                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| plain object                            | shallow-copied only when something changes                                                      |
| array                                   | copied only when something changes                                                              |
| readonly / `Object.freeze`              | traversed read-only; source not written                                                         |
| `Date` / `RegExp` / TypedArray          | reference kept                                                                                  |
| `Map` / `Set`                           | cloned only when something changes                                                              |
| `null` / `undefined` / number / boolean | returned as-is                                                                                  |
| circular references                     | detected with a current-path `Set`; cycle edges return the original reference; no infinite loop |
| `Error`                                 | atomic in path mode (not expanded); `maskLog` expands it (see Logger)                           |

## Empty schema

```ts
maskObject(data, {}) === data; // true — no copy
```

## Configuration errors throw

Unlike “invalid data returns as-is”, **schema configuration errors** throw a `TypeError` at compile time (and never put business data in the message):

```ts
maskObject(data, null); // TypeError
maskObject(data, { 'a..b': 'email' }); // TypeError empty path segment
maskObject(data, { email: 'nope' }); // TypeError unknown preset
```

For hot paths, use [`createMasker`](/en/object/path-schema#createmasker) to compile once at startup.

The **same schema object identity** hits a `WeakMap` cache (see [Performance](/en/advanced/performance)); do not mutate keys in place after first use.

## Scenario: HTTP Response

```ts
import { maskObject } from 'masker';

const userSchema = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  'profile.address': 'address',
  'profile.creditCard': 'creditCard',
} as const;

app.get('/api/me', (c) => {
  const user = await findUser(c.req.param('id'));
  return c.json(maskObject(user, userSchema));
});
```

::: tip Principle
Outbound responses should only return `maskObject` results; **never** `console.log(user)` first and mask afterwards.
:::

Related: [Path & Schema](/en/object/path-schema) · [Nested & Arrays](/en/object/nested-arrays) · [Recipes](/en/advanced/recipes)

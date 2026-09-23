# Custom Maskers

Schema values can be built-in presets or any `(value: string) => string`. That lets you extend policies without forking the library.

## Reference functions directly

```ts
import { maskObject, maskEmail, maskPhone, maskName } from 'masker';

const masked = maskObject(user, {
  email: maskEmail,
  phone: maskPhone,
  name: maskName,
});
```

## Bind custom options

Closures are the usual way to ship a “configured masker”:

```ts
import { maskObject, maskPhone, maskGeneric } from 'masker';

const pinPhone = (v: string) => maskPhone(v, { mask: '#', keepStart: 3, keepEnd: 4 });
const shortKey = (v: string) => maskGeneric(v, { keepStart: 4, keepEnd: 4, maskLength: 8 });

maskObject(payload, {
  phone: pinPhone,
  apiKey: shortKey,
});
```

## Fully custom logic

```ts
import { maskObject } from 'masker';

/** Internal employee ID: keep only the first 4 characters */
const maskEmployeeId = (v: string): string =>
  v.length <= 4 ? '*'.repeat(v.length) : v.slice(0, 4) + '*'.repeat(v.length - 4);

/** Keep the email domain against an allowlist */
const maskEmailKeepDomain = (v: string): string => {
  const at = v.indexOf('@');
  if (at <= 0) return v;
  const local = v.slice(0, at);
  const domain = v.slice(at);
  if (domain === '@corp.example.com') return v; // internal domain not masked
  return local[0]! + '*'.repeat(Math.max(1, local.length - 2)) + local.at(-1)! + domain;
};

const out = maskObject(row, {
  empId: maskEmployeeId,
  contact: maskEmailKeepDomain,
});
```

## Use with fields / createMasker

```ts
import { createMasker } from 'masker';

const masker = createMasker({
  fields: {
    password: (v: string) => '*'.repeat(Math.min(v.length, 8)),
    cookie: (v: string) => 'session=' + '*'.repeat(8),
    email: 'email',
  },
});
```

## The ValueMasker type

The public type is written contravariantly so `(value: string) => string` can be assigned without assertions:

```ts
import type { ValueMasker, SchemaMasker, PresetName } from 'masker';

type ValueMasker = (value: never) => string;
// In practice: String is assignable to a never parameter position (contravariance),
// so the following is valid:
const s: SchemaMasker = (v: string) => v.slice(0, 2) + '***';
```

## Per-type custom option patterns

Do not force one universal `MaskOptions` on every type — the library provides semantic interfaces per data kind:

| Type        | Key options                                                           |
| ----------- | --------------------------------------------------------------------- |
| Email       | `keepStart` `keepEnd` `maskTag`                                       |
| Phone       | `keepStart` `keepEnd` (applies to the domestic segment)               |
| Name        | `keepStart` `keepEnd` (per token)                                     |
| Address     | `keepStart` `keepEnd` `maskLength` `disableAutoPrefix`                |
| CreditCard  | `keepStart` `keepEnd` (Amex-aware defaults)                           |
| IdCard      | `keepStart` `keepEnd`                                                 |
| BankAccount | `keepStart` `keepEnd` `minLength`                                     |
| MAC         | `keepStart` `keepEnd`                                                 |
| Vehicle     | `kind` `keepStart` `keepEnd`                                          |
| JWT         | `header` `payload` `signature` `keepSegmentChars` `maskSegmentLength` |
| IP          | `ipv4.keepStart` `ipv6.keepGroups`                                    |
| URL         | `query` `maskAllQuery` `maskCredentials` `maskFragment`               |
| Generic     | `keepStart` `keepEnd` `maskLength`                                    |

Full fields are listed under [Types](/en/reference/types).

## Conventions

1. **Pure functions**: same input → same output; no global mutable state
2. **Do not throw on data errors**: invalid strings should return as-is or degrade to masking
3. **Do not concatenate user input into error messages** (prevents secondary log leaks)
4. On hot paths, avoid `new RegExp` / `JSON.parse` on every call

Related: [Generic](/en/maskers/generic) · [API](/en/reference/api)

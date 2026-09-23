<p align="center">
  <img src="./assets/logo.svg" width="120" height="120" alt="masker logo" />
</p>

# masker

<p align="center">
  <strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a>
</p>

Lightweight, fast, **type-safe** data masking for Node.js, Bun, and modern JS runtimes.

- Zero runtime dependencies
- ESM + TypeScript declarations
- Grapheme-aware (中文 / 日本語 / 한국어 / emoji)
- Schema/path masking with precompiled rules for hot logger paths
- Never mutates input objects (copy-on-write)

**Documentation site (VitePress):** run `npm run docs:dev` or `npm run docs:build` — sources live under [`docs/`](./docs/).

```ts
import { maskEmail, maskPhone, maskGeneric } from 'masker';

maskEmail('zhangsan@example.com'); // 'z******n@example.com'
maskPhone('13812345678'); // '138****5678'
maskGeneric('1234567890', { keepStart: 2, keepEnd: 2 }); // '12******90'
```

---

## Table of contents

1. [Introduction](#1-introduction)
2. [Install](#2-install)
3. [Node.js usage](#3-nodejs-usage)
4. [Bun usage](#4-bun-usage)
5. [Quick start](#5-quick-start)
6. [Email](#6-email)
7. [Phone](#7-phone)
8. [Name](#8-name)
9. [Address](#9-address)
10. [Credit card](#10-credit-card)
11. [JWT](#11-jwt)
12. [IP](#12-ip)
13. [URL](#13-url)
14. [Generic](#14-generic)
15. [Object](#15-object)
16. [Schema / path](#16-schema--path)
17. [Logger](#17-logger)
18. [Custom strategies](#18-custom-strategies)
19. [Performance](#19-performance)
20. [Security notes](#20-security-notes)
21. [API reference](#21-api-reference)
22. [FAQ](#22-faq)

---

## 1. Introduction

`masker` is a small utility library for **redacting PII and secrets** in application code, HTTP responses, audit logs, and logger pipelines.

Design goals:

| Goal             | How                                                     |
| ---------------- | ------------------------------------------------------- |
| Simple           | `maskEmail(value)` works with zero config               |
| Configurable     | Every masker accepts semantic options                   |
| Composable       | `maskObject` / `createMasker` combine maskers           |
| Type-safe        | No `any` in the public API                              |
| Side-effect free | Inputs are never mutated                                |
| Predictable      | Same input + options → same output                      |
| Fast             | Constant regexes, ASCII fast paths, precompiled schemas |

It does **not** validate business data (card Luhn check is available separately as `isLuhnValid`; JWT is never decoded).

---

## 2. Install

```bash
npm install masker
# or
pnpm add masker
# or
yarn add masker
# or
bun add masker
```

Requires **Node.js ≥ 18** (or Bun). The package is ESM-only (`"type": "module"`).

---

## 3. Node.js usage

```ts
import { maskPhone, maskObject } from 'masker';
```

Compiled with `tsc` → `dist/index.js` + `dist/index.d.ts`.

---

## 4. Bun usage

```ts
import { maskUrl, createMasker } from 'masker';
```

No Node-specific APIs are used (`node:*` is never imported), so Bun works out of the box.

---

## 5. Quick start

```ts
import {
  maskEmail,
  maskPhone,
  maskName,
  maskAddress,
  maskCreditCard,
  maskIdCard,
  maskBankAccount,
  maskMac,
  maskVehicle,
  maskJwt,
  maskIp,
  maskUrl,
  maskGeneric,
  maskObject,
  maskLog,
  createMasker,
} from 'masker';

maskEmail('zhangsan@example.com'); // z******n@example.com
maskPhone('+8613812345678'); // +86138****5678
maskName('张三丰'); // 张*丰
maskAddress('北京市朝阳区xxx街道xxx号'); // 北京市朝阳区*********
maskCreditCard('4111 1111 1111 1111'); // **** **** **** 1111
maskIdCard('110101199001011234'); // 110101********1234
maskBankAccount('6222021234567890123'); // ***************0123
maskMac('00:1A:2B:3C:4D:5E'); // 00:1A:2B:*:*:*
maskVehicle('京A12345'); // 京A*****
maskJwt('eyJhbGciOiJ9.eyJzdWIiOiJ9.sig'); // ********.********.********
maskIp('192.168.1.100'); // 192.168.*.*
maskUrl('https://u:p@example.com?token=s'); // credentials + token masked
maskGeneric('sensitive', { keepStart: 2, keepEnd: 2 }); // se******ve
```

---

## 6. Email

Keeps the domain (including subdomains) intact; masks the local part while preserving `+tag` by default.

```ts
maskEmail('zhangsan@example.com'); // z******n@example.com
maskEmail('a@example.com'); // *@example.com
maskEmail('ab@example.com'); // a*@example.com
maskEmail('zhang.san@example.com'); // z*******n@example.com
maskEmail('user+tag@example.com'); // u**r+tag@example.com
maskEmail('user@mail.example.com'); // u**r@mail.example.com

maskEmail('zhangsan@example.com', { mask: '•' }); // z••••••n@example.com
maskEmail('zhangsan@example.com', { keepStart: 2, keepEnd: 3 });
// zh***san@example.com
maskEmail('user+tag@example.com', { maskTag: true }); // u******g@example.com
```

**Errors:** missing `@`, empty local/domain, or empty input → **returned unchanged**.

---

## 7. Phone

Preserves separators (`space`, `-`, `()`), an optional `+` country calling code, and masks middle **digits** only.

```ts
maskPhone('13812345678'); // 138****5678
maskPhone('+8613812345678'); // +86138****5678
maskPhone('+1 415 555 1234'); // +1 415 *** 1234
maskPhone('(415) 555-1234'); // (415) ***-1234

maskPhone('13812345678', { keepStart: 3, keepEnd: 4, mask: '*' });
// 138****5678
```

Defaults for national digits: `keepStart: 3`, `keepEnd: 4`. Country codes are matched against a built-in E.164 list (longest-first).

**Errors:** no digits / empty → returned unchanged. Very short digit strings are clamped so at least one digit is masked when possible.

---

## 8. Name

Handles Chinese and Latin names token-by-token (whitespace preserved).

```ts
maskName('张三'); // 张*
maskName('张三丰'); // 张*丰
maskName('欧阳娜娜'); // 欧**娜
maskName('John'); // J**n
maskName('John Smith'); // J**n S***h
maskName('Alice Johnson'); // A***e J*****n
```

Rule: keep first grapheme; keep last when the token has ≥ 3 graphemes.

---

## 9. Address

Default: keep the leading Chinese administrative prefix (`省/市/区/县…`), mask the rest. Falls back to the first 4 graphemes for non-Chinese / unmatched addresses.

```ts
maskAddress('北京市朝阳区xxx街道xxx号'); // 北京市朝阳区*********

maskAddress('123 Main Street', { keepStart: 4 });
maskAddress(addr, { mask: '•', maskLength: 4 });
maskAddress(addr, { disableAutoPrefix: true, keepStart: 0 }); // full mask
```

---

## 10. Credit card

Separators (`space` / `-`) are preserved. Brand-aware defaults:

| Shape            | Default                             |
| ---------------- | ----------------------------------- |
| 16-digit style   | keep last 4 → `**** **** **** 1111` |
| Amex (15 digits) | keep first 6 + last 5               |

```ts
maskCreditCard('4111111111111111'); // ************1111
maskCreditCard('4111 1111 1111 1111'); // **** **** **** 1111
maskCreditCard('4111-1111-1111-1111'); // ****-****-****-1111
maskCreditCard('378282246310005'); // 378282****10005
```

**Validation is separate** — masking never requires a valid PAN:

```ts
import { isLuhnValid } from 'masker';

isLuhnValid('4111111111111111'); // true
isLuhnValid('4111111111111112'); // false
maskCreditCard('4111111111111112'); // still masks: ************1112
```

**Errors:** fewer than 12 digits → returned unchanged.

---

## 10a. ID card

Recognises 18-digit IDs (optional trailing `X`) and legacy 15-digit IDs. Defaults keep region (first 6) + last 4. No checksum validation.

```ts
maskIdCard('110101199001011234'); // 110101********1234
maskIdCard('110101199001011234', { keepStart: 0, keepEnd: 0 }); // ******************
```

---

## 10b. Bank account

Separate from credit cards: wider lengths, no PAN/Amex rules, no Luhn. Supports IBAN-style alphanumeric bodies. Default keeps the last 4.

```ts
maskBankAccount('6222021234567890123'); // ***************0123
maskBankAccount('6222 0212 3456 7890'); // **** **** **** 7890
maskBankAccount('GB29NABC60161331926819'); // ******************6819
```

---

## 10c. MAC address

Colon / dash / Cisco dotted / bare 12-hex forms. Default keeps the first 3 octets (OUI).

```ts
maskMac('00:1A:2B:3C:4D:5E'); // 00:1A:2B:*:*:*
maskMac('00-1a-2b-3c-4d-5e'); // 00-1a-2b-*-*-*
maskMac('aabb.ccdd.eeff'); // aabb.cc**.****
```

---

## 10d. Vehicle (license plate / VIN)

`maskVehicle` auto-detects VIN (17 chars) vs plate. Defaults: plate keeps first 2; VIN keeps first 3 + last 4.

```ts
maskVehicle('京A12345'); // 京A*****
maskVehicle('1HGCM82633A004352'); // 1HG**********4352
maskLicensePlate('沪AD12345'); // 沪A******
maskVin('1HGCM82633A004352'); // 1HG**********4352
```

---

## 11. JWT

Structural masking only — **never** base64-decodes, never validates signatures, never reads claims.

```ts
maskJwt(token);
// ********.********.********

maskJwt(token, { header: 'keep' });
// eyJhbGciOiJIUzI1NiJ9.********.********

maskJwt(token, { keepSegmentChars: 3 });
// eyJ********.********.********

maskJwt(token, { mask: '#', maskSegmentLength: 3 });
// ###.###.###
```

| Option              | Default  | Meaning                               |
| ------------------- | -------- | ------------------------------------- |
| `header`            | `'mask'` | `'mask' \| 'keep'`                    |
| `payload`           | `'mask'` | Keep only if you accept the risk      |
| `signature`         | `'mask'` | Usually leave masked                  |
| `keepSegmentChars`  | `0`      | Prefix of each masked segment         |
| `maskSegmentLength` | `8`      | Fixed mask run (hides segment length) |

**Errors:** not exactly three segments with non-empty header & payload → returned unchanged.

---

## 12. IP

IPv4 and IPv6 use **separate** strategies.

```ts
maskIp('192.168.1.100'); // 192.168.*.*
maskIp('192.168.1.100', { ipv4: { keepStart: 3 } }); // 192.168.1.*

maskIp('2001:db8:85a3:0:0:8a2e:370:7334'); // 2001:db8:*:*:*:*:*:*
maskIp('2001:db8::1'); // 2001:db8::*
maskIp(ip, { ipv6: { keepGroups: 4 } });
```

**Errors:** invalid IPv4/IPv6 / empty → returned unchanged.

---

## 13. URL

Built on standard `URL` / `URLSearchParams` (no mega-regex).

Defaults:

- credentials masked
- hostname + path preserved
- sensitive query values masked (`token`, `password`, `secret`, `api_key`, …)
- other query values kept (`page=1`)
- fragment masked

```ts
maskUrl('https://user:password@example.com/path');
// https://u***:******@example.com/path

maskUrl('https://example.com/api?token=secret&page=1');
// https://example.com/api?token=******&page=1

maskUrl(url, { query: ['token', 'password', 'secret'] });
maskUrl(url, { maskAllQuery: true });
maskUrl(url, { maskCredentials: false, maskFragment: false });
```

> Note: `URL` normalises the string (encoding, default ports, trailing slashes). Invalid / relative URLs are returned unchanged.

---

## 14. Generic

```ts
maskGeneric('1234567890', { keepStart: 2, keepEnd: 2 }); // 12******90
maskGeneric('sensitive-value'); // ***************
maskGeneric('abc', { mask: '#' }); // ###
maskGeneric('1234567890', { keepStart: 2, keepEnd: 2, maskLength: 3 }); // 12***90
```

Unicode:

- Pure ASCII → UTF-16 fast path
- Otherwise → `Intl.Segmenter` grapheme clusters when available, else code points
- Works with 中文, 日本語, 한국어, emoji (incl. ZWJ sequences when Segmenter exists)

**Errors:** empty string → `''`. `keepStart + keepEnd ≥ length` → returned unchanged.

---

## 15. Object

Deep, **non-mutating** masking with copy-on-write: untouched subtrees keep their original references.

```ts
const data = {
  id: 1,
  name: '张三',
  phone: '13812345678',
  profile: {
    address: '北京市朝阳区xxx',
    creditCard: '4111111111111111',
  },
};

const safe = maskObject(data, {
  name: 'name',
  phone: 'phone',
  'profile.address': 'address',
  'profile.creditCard': 'creditCard',
});

data !== safe; // true
data.name === '张三'; // source untouched
```

### `maskFields` — path/schema-precise rules

Declare exactly which paths use which masker, including the `{ type, options }` object form:

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
// → user.email: 'j**e@company.com'
// → user.phone: '+1415***0123'
```

Rule values may also be preset strings (`'email'`) or custom functions. Wildcards work the same as `maskObject`.

Supported values:

| Kind                              | Behaviour                                                  |
| --------------------------------- | ---------------------------------------------------------- |
| plain object                      | shallow-copied only when a child changes                   |
| array                             | copied only when an element changes                        |
| nested / readonly                 | handled; frozen objects are not mutated                    |
| `Date` / `RegExp` / binary        | kept by reference                                          |
| `Map` / `Set`                     | cloned only if an entry changes                            |
| `null` / `undefined` / primitives | passed through                                             |
| circular refs                     | cycle edge reuses original reference; no infinite loop     |
| `Error`                           | atomic in path mode; materialised in `maskLog` (see below) |

Empty schema → same reference returned.

---

## 16. Schema / path

Paths use `.` separators. `*` matches **one** object key or array index.

```ts
maskObject(data, {
  email: 'email',
  'profile.address': 'address',
  'users.*.phone': 'phone',
  'users.*.email': maskEmail, // function form
});
```

Preset names: `email` | `phone` | `name` | `address` | `creditCard` | `idCard` | `bankAccount` | `mac` | `vehicle` | `jwt` | `ip` | `url` | `generic`.

Invalid paths (`a..b`, empty) or unknown presets throw **`TypeError` at schema compile time** — never mid-walk, and never log the input value.

For repeated calls, precompile:

```ts
const masker = createMasker({
  'users.*.phone': 'phone',
  'profile.email': 'email',
});

masker.mask(payload); // schema parsed once at createMasker()
```

---

## 17. Logger

Key-name rules apply at **any depth** (unlike path schemas):

```ts
maskLog(payload, {
  fields: {
    password: 'generic',
    token: 'generic',
    email: 'email',
    phone: 'phone',
  },
});
```

Precompiled form for hot paths:

```ts
const masker = createMasker({
  fields: {
    password: 'generic',
    email: 'email',
    phone: 'phone',
  },
});

logger.info(masker.mask(data));
```

Properties:

- does not mutate the log object
- no `JSON.stringify` / `parse`
- handles nested objects, arrays, `Map` / `Set`, circular refs
- `Error` is materialised to `{ name, message, stack }` so `fields.message` works

---

## 18. Custom strategies

Pass any `(value: string) => string`:

```ts
import { maskObject, maskEmail } from 'masker';

const alwaysStars = (v: string) => '*'.repeat(v.length);

maskObject(data, {
  email: maskEmail,
  secret: alwaysStars,
  // bound options
  phone: (v: string) => maskPhone(v, { mask: '#' }),
});
```

> The `ValueMasker` type is contravariant (`(value: never) => string`) so concrete `(value: string) => string` functions assign cleanly without casts.

---

## 19. Performance

Techniques used:

- module-level constant regexes only (no per-call `new RegExp`)
- ASCII fast paths before grapheme segmentation
- schema / path / preset resolution in `createMasker()` / compile phase
- copy-on-write — skip entire subtrees when no rule matches
- single pass over digit positions (phone / card)
- native `URL` / `URLSearchParams`

Run the included benchmark (requires a build):

```bash
npm run bench
# or
npm run build && node benchmark/bench.mjs
# Bun (after build):
bun benchmark/bench.mjs
```

> **Honest note:** this README does not quote absolute ops/s numbers — run the benchmark on your machine and runtime. Bun was **not** available in the environment where this package was developed, so Bun figures are not claimed.

---

## 20. Security notes

- **Do not log raw inputs** alongside masked output for debugging in production.
- Error types thrown by this library contain **configuration** messages only (bad path / preset) — they never embed your data values.
- JWT **payloads are masked by default**; enabling `payload: 'keep'` can expose claims (PII, roles).
- URL **query values for sensitive keys and fragments are masked by default**; review custom `query` lists.
- Masking is **not encryption** and not a substitute for access control.
- Prefer `createMasker` in request/log middleware so rule errors surface at startup, not per request.

---

## 21. API reference

### Primitive maskers

| Function           | Signature                                                     | Invalid input                |
| ------------------ | ------------------------------------------------------------- | ---------------------------- |
| `maskEmail`        | `(value: string, options?: EmailMaskOptions) => string`       | returned as-is               |
| `maskPhone`        | `(value: string, options?: PhoneMaskOptions) => string`       | no digits → as-is            |
| `maskName`         | `(value: string, options?: NameMaskOptions) => string`        | empty → `''`                 |
| `maskAddress`      | `(value: string, options?: AddressMaskOptions) => string`     | empty → `''`                 |
| `maskCreditCard`   | `(value: string, options?: CreditCardMaskOptions) => string`  | &lt;12 digits → as-is        |
| `maskIdCard`       | `(value: string, options?: IdCardMaskOptions) => string`      | not 15/18 digits → as-is     |
| `maskBankAccount`  | `(value: string, options?: BankAccountMaskOptions) => string` | too short → as-is            |
| `maskMac`          | `(value: string, options?: MacMaskOptions) => string`         | invalid → as-is              |
| `maskVehicle`      | `(value: string, options?: VehicleMaskOptions) => string`     | unknown → as-is              |
| `maskLicensePlate` | `(value: string, options?: VehicleMaskOptions) => string`     | invalid → as-is              |
| `maskVin`          | `(value: string, options?: VehicleMaskOptions) => string`     | not 17 chars → as-is         |
| `maskJwt`          | `(value: string, options?: JwtMaskOptions) => string`         | bad shape → as-is            |
| `maskIp`           | `(value: string, options?: IpMaskOptions) => string`          | invalid → as-is              |
| `maskUrl`          | `(value: string, options?: UrlMaskOptions) => string`         | invalid → as-is              |
| `maskGeneric`      | `(value: string, options?: SliceMaskOptions) => string`       | empty → `''`                 |
| `isLuhnValid`      | `(value: string) => boolean`                                  | non-string / empty → `false` |

Non-string runtime values (plain JS callers) are returned unchanged — the TypeScript types intentionally only accept `string`.

### Object / logger

| Function       | Signature                                                 |
| -------------- | --------------------------------------------------------- |
| `maskObject`   | `<T>(value: T, schema: ObjectSchema) => T`                |
| `maskFields`   | `<T>(value: T, fields: ObjectSchema) => T`                |
| `maskLog`      | `<T>(value: T, options?: MaskLogOptions) => T`            |
| `createMasker` | `(schema: ObjectSchema \| CreateMaskerOptions) => Masker` |

`Masker`:

```ts
interface Masker {
  mask<T>(value: T): T;
}
```

### Option types

`EmailMaskOptions`, `PhoneMaskOptions`, `NameMaskOptions`, `AddressMaskOptions`, `CreditCardMaskOptions`, `IdCardMaskOptions`, `BankAccountMaskOptions`, `MacMaskOptions`, `VehicleKind`, `VehicleMaskOptions`, `JwtMaskOptions`, `IpMaskOptions`, `Ipv4MaskOptions`, `Ipv6MaskOptions`, `UrlMaskOptions`, `SliceMaskOptions`, `BaseMaskOptions`, `ObjectSchema`, `FieldMap`, `MaskLogOptions`, `CreateMaskerOptions`, `SchemaMasker`, `MaskFieldConfig`, `PresetName`, `ValueMasker`, `Masker`.

### Throwing conditions

| API                         | Throws                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `maskObject(value, schema)` | `TypeError` if `schema` is not an object, path is invalid, or preset name unknown                                      |
| `createMasker(args)`        | `TypeError` if `args` is null/non-object, empty path, unknown preset, or options include neither `fields` nor `schema` |
| primitive maskers           | **never throw** for data — invalid data is returned unchanged                                                          |

---

## 22. FAQ

**Why ESM-only?**  
Dual CJS/ESM builds roughly double packaging surface (conditional exports, interop edge cases) for a greenfield library. Modern Node (18+) and Bun load ESM natively; bundlers tree-shake `sideEffects: false` ESM cleanly. CJS support can be added later if demand is proven.

**Why doesn’t `maskCreditCard` verify the number?**  
Masking and validation are different concerns. Use `isLuhnValid` explicitly when you need validation.

**Does `maskJwt` decode the payload?**  
No. Only `header.payload.signature` is split on `.`. No base64, no JSON.

**How do wildcards perform?**  
Paths are parsed once into a trie (`createMasker` / first `maskObject` call). Each object walk advances node references — no repeated `split('.')` per key.

**Why is `ValueMasker` typed `(value: never) => string`?**  
It makes the function parameter contravariant so `(value: string) => string` is assignable without `as any`, while still describing “I accept a string”.

**Does it mutate my objects?**  
No. Copy-on-write: only branches that actually change are shallow-copied.

**Circular structures?**  
Supported. The walker tracks the current path in a `Set`; a cycle edge returns the original reference instead of looping.

**Bun support?**  
The library uses only standard JS (`URL`, `Intl.Segmenter`, plain objects). No `node:` imports. Bun was not installed in the development environment — runtime support is by construction, not by executed CI in this repo.

**CommonJS `require('masker')`?**  
Not supported (see above). Use `await import('masker')` from CJS if needed.

---

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
npm run lint
npm run format
npm run bench
```

## License

MIT

# API

Complete overview of the public API. All data-shaped inputs that are not a `string` at runtime (for plain JS callers) are **returned as-is**; the TypeScript types only accept `string`.

Conventions:

- **Invalid data** → returns the original value, never throws
- **Invalid configuration** (schema / createMasker) → `TypeError`, with a message that never includes user data
- No `any` in public signatures

---

## maskEmail

```ts
function maskEmail(value: string, options?: EmailMaskOptions): string;
```

Masks the local part while keeping the domain / subdomain; `+tag` is preserved by default.

| Parameter           | Type      | Default |
| ------------------- | --------- | ------- |
| `value`             | `string`  | —       |
| `options.mask`      | `string`  | `'*'`   |
| `options.keepStart` | `number`  | `1`     |
| `options.keepEnd`   | `number`  | `1`     |
| `options.maskTag`   | `boolean` | `false` |

**Edge cases:** no `@` / empty string → returned as-is; single-character local part → fully masked.

```ts
maskEmail('zhangsan@example.com'); // z******n@example.com
```

---

## maskPhone

```ts
function maskPhone(value: string, options?: PhoneMaskOptions): string;
```

Only replaces digits in the domestic number segment; keeps the `+` country code and separators.

| Parameter   | Default                |
| ----------- | ---------------------- |
| `mask`      | `'*'`                  |
| `keepStart` | `3` (domestic segment) |
| `keepEnd`   | `4`                    |

**Edge cases:** no digits → returned as-is; short numbers are forced to mask at least one digit.

```ts
maskPhone('+8613812345678'); // +86138****5678
```

---

## maskName

```ts
function maskName(value: string, options?: NameMaskOptions): string;
```

Treats whitespace-delimited tokens individually; keeps the first character by default, and the last character when the token is ≥3 characters long.

| Parameter   | Default                               |
| ----------- | ------------------------------------- |
| `mask`      | `'*'`                                 |
| `keepStart` | `1`                                   |
| `keepEnd`   | `1` (auto-tightened for short tokens) |

```ts
maskName('欧阳娜娜'); // 欧**娜
```

---

## maskAddress

```ts
function maskAddress(value: string, options?: AddressMaskOptions): string;
```

Automatically preserves Chinese administrative-region prefixes by default; otherwise keeps the first 4 graphemes.

| Parameter           | Default                   |
| ------------------- | ------------------------- |
| `mask`              | `'*'`                     |
| `keepStart`         | automatic / user override |
| `keepEnd`           | `0`                       |
| `maskLength`        | natural length            |
| `disableAutoPrefix` | `false`                   |

```ts
maskAddress('北京市朝阳区xxx街道xxx号'); // 北京市朝阳区*********
```

---

## maskCreditCard

```ts
function maskCreditCard(value: string, options?: CreditCardMaskOptions): string;
```

Preserves separators; for 16-digit numbers keeps the last 4, for 15-digit Amex keeps the first 6 + last 5.

| Parameter   | Default                 |
| ----------- | ----------------------- |
| `mask`      | `'*'`                   |
| `keepStart` | Amex `6`, otherwise `0` |
| `keepEnd`   | Amex `5`, otherwise `4` |

**Edge cases:** fewer than 12 digits → returned as-is. Unrelated to Luhn validation.

---

## isLuhnValid

```ts
function isLuhnValid(value: string): boolean;
```

Standalone validation; ignores spaces and `-`; non-string / empty / non-numeric → `false`. **Not** called by `maskCreditCard`.

```ts
isLuhnValid('4111 1111 1111 1111'); // true
```

---

## maskIdCard

```ts
function maskIdCard(value: string, options?: IdCardMaskOptions): string;
```

Masks Chinese resident IDs (18-digit with optional trailing `X`, or legacy 15-digit). Defaults keep first 6 + last 4.

| Parameter   | Default |
| ----------- | ------- |
| `mask`      | `'*'`   |
| `keepStart` | `6`     |
| `keepEnd`   | `4`     |

**Edge cases:** not 15/18 digits → returned as-is. No birthday/checksum validation.

```ts
maskIdCard('110101199001011234'); // 110101********1234
```

---

## maskBankAccount

```ts
function maskBankAccount(value: string, options?: BankAccountMaskOptions): string;
```

Bank account numbers (separate from Credit Card). Preserves separators; supports IBAN alphanumeric bodies. Defaults keep the last 4 only.

| Parameter   | Default                    |
| ----------- | -------------------------- |
| `mask`      | `'*'`                      |
| `keepStart` | `0`                        |
| `keepEnd`   | `4`                        |
| `minLength` | `8` with digits, else `10` |

**Edge cases:** too short → returned as-is. No account/Luhn validation.

```ts
maskBankAccount('6222021234567890123'); // ***************0123
```

---

## maskMac

```ts
function maskMac(value: string, options?: MacMaskOptions): string;
```

MAC addresses: `:` / `-` / Cisco dotted / bare 12 hex. Defaults keep the first 3 octets (OUI).

| Parameter   | Default |
| ----------- | ------- |
| `mask`      | `'*'`   |
| `keepStart` | `3`     |
| `keepEnd`   | `0`     |

```ts
maskMac('00:1A:2B:3C:4D:5E'); // 00:1A:2B:*:*:*
```

---

## maskVehicle / maskLicensePlate / maskVin

```ts
function maskVehicle(value: string, options?: VehicleMaskOptions): string;
function maskLicensePlate(value: string, options?: VehicleMaskOptions): string;
function maskVin(value: string, options?: VehicleMaskOptions): string;
```

Vehicle masking: `maskVehicle` auto-detects VIN (17 chars) vs license plate via `kind` (default `'auto'`). Plates keep the first 2 by default; VINs keep first 3 + last 4.

| Parameter   | Default            |
| ----------- | ------------------ |
| `mask`      | `'*'`              |
| `kind`      | `'auto'`           |
| `keepStart` | plate `2`, VIN `3` |
| `keepEnd`   | plate `0`, VIN `4` |

```ts
maskVehicle('京A12345'); // 京A*****
maskVehicle('1HGCM82633A004352'); // 1HG**********4352
```

---

## maskJwt

```ts
function maskJwt(value: string, options?: JwtMaskOptions): string;
```

Splits on `.` into three segments — no base64 decoding, no signature verification.

| Parameter                          | Default  |
| ---------------------------------- | -------- |
| `mask`                             | `'*'`    |
| `header` / `payload` / `signature` | `'mask'` |
| `keepSegmentChars`                 | `0`      |
| `maskSegmentLength`                | `8`      |

**Edge cases:** not three segments, or empty header/payload → returned as-is.

```ts
maskJwt(h + '.' + p + '.' + s); // ********.********.********
```

---

## maskIp

```ts
function maskIp(value: string, options?: IpMaskOptions): string;
```

Separate strategies for IPv4 / IPv6.

| Parameter         | Default |
| ----------------- | ------- |
| `mask`            | `'*'`   |
| `ipv4.keepStart`  | `2`     |
| `ipv4.keepEnd`    | `0`     |
| `ipv6.keepGroups` | `2`     |

```ts
maskIp('192.168.1.100'); // 192.168.*.*
```

---

## maskUrl

```ts
function maskUrl(value: string, options?: UrlMaskOptions): string;
```

Built on `URL` / `URLSearchParams`.

| Parameter         | Default                     |
| ----------------- | --------------------------- |
| `mask`            | `'*'`                       |
| `maskCredentials` | `true`                      |
| `query`           | built-in sensitive-key list |
| `maskAllQuery`    | `false`                     |
| `maskFragment`    | `true`                      |
| `valueMaskLength` | `6`                         |

**Edge cases:** `new URL` throws → returned as-is.

---

## maskGeneric

```ts
function maskGeneric(value: string, options?: SliceMaskOptions): string;
```

| Parameter    | Default        |
| ------------ | -------------- |
| `mask`       | `'*'`          |
| `keepStart`  | `0`            |
| `keepEnd`    | `0`            |
| `maskLength` | natural length |

Counts by grapheme; ASCII takes a fast path.

```ts
maskGeneric('1234567890', { keepStart: 2, keepEnd: 2 }); // 12******90
```

---

## maskObject

```ts
function maskObject<T>(value: T, schema: ObjectSchema): T;
```

Deep masking via a path schema; copy-on-write; does not mutate the input.

- `schema` fails to compile → `TypeError`
- empty schema → returns the same reference
- supports `*` wildcards, nesting, arrays, Map, Set, and circular references

```ts
maskObject(user, { email: 'email', 'profile.phone': 'phone' });
```

---

## maskFields

```ts
function maskFields<T>(value: T, fields: ObjectSchema): T;
```

Path/schema-precise masking: declare which paths use which masker. Rule values accept:

- preset string: `'email'`
- object rule: `{ type: 'email' }` or `{ type: 'generic', options: { keepStart: 2 } }`
- custom function

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

- Same copy-on-write / wildcard semantics as `maskObject`
- Invalid `type` / `options` → `TypeError` at compile time
- Empty `fields` → same reference returned
- Prefer `createMasker` on hot paths

---

## maskLog

```ts
function maskLog<T>(value: T, options?: MaskLogOptions): T;
```

Matches by `fields` field names at any depth.

```ts
maskLog(data, { fields: { password: 'generic', email: 'email' } });
```

- missing / empty `fields` → original reference
- `Error` → materialized as `{ name, message, stack }`

---

## createMasker

```ts
function createMasker(schema: ObjectSchema): Masker;
function createMasker(options: CreateMaskerOptions): Masker;

interface CreateMaskerOptions {
  fields?: FieldMap;
  schema?: ObjectSchema;
}

interface Masker {
  mask<T>(value: T): T;
}
```

A **shorthand** argument (without a `fields` / `schema` wrapper) is treated as a path schema.  
Invalid configuration → `TypeError` (`null`, empty path segment, unknown preset).  
`createMasker({})` is valid (a no-op).

```ts
const masker = createMasker({ fields: { password: 'generic' } });
logger.info(masker.mask(payload));
```

---

## Exported types at a glance

See [Types](/en/reference/types). Runtime exports are limited to functions; import types with `import type`.

# Types

All public types (import with `import type`). Internal path-trie and parser types are **not exported**.

```ts
import type {
  BaseMaskOptions,
  SliceMaskOptions,
  EmailMaskOptions,
  PhoneMaskOptions,
  NameMaskOptions,
  AddressMaskOptions,
  CreditCardMaskOptions,
  IdCardMaskOptions,
  BankAccountMaskOptions,
  MacMaskOptions,
  VehicleKind,
  VehicleMaskOptions,
  JwtMaskOptions,
  JwtPartVisibility,
  IpMaskOptions,
  Ipv4MaskOptions,
  Ipv6MaskOptions,
  UrlMaskOptions,
  ValueMasker,
  PresetName,
  MaskFieldConfig,
  SchemaMasker,
  ObjectSchema,
  FieldMap,
  MaskLogOptions,
  CreateMaskerOptions,
  Masker,
} from 'masker';
```

## BaseMaskOptions

```ts
interface BaseMaskOptions {
  /** Mask token, default '*' */
  mask?: string;
}
```

## SliceMaskOptions

Used by `maskGeneric` and also inherited by `AddressMaskOptions`:

```ts
interface SliceMaskOptions extends BaseMaskOptions {
  keepStart?: number; // default 0
  keepEnd?: number; // default 0
  maskLength?: number; // fixed mask length
}
```

## EmailMaskOptions

```ts
interface EmailMaskOptions extends BaseMaskOptions {
  keepStart?: number; // default 1
  keepEnd?: number; // default 1
  maskTag?: boolean; // default false
}
```

## PhoneMaskOptions

```ts
interface PhoneMaskOptions extends BaseMaskOptions {
  keepStart?: number; // default 3
  keepEnd?: number; // default 4
}
```

## NameMaskOptions

```ts
interface NameMaskOptions extends BaseMaskOptions {
  keepStart?: number; // default 1
  keepEnd?: number; // default 1
}
```

## AddressMaskOptions

```ts
interface AddressMaskOptions extends SliceMaskOptions {
  disableAutoPrefix?: boolean; // default false
}
```

## CreditCardMaskOptions

```ts
interface CreditCardMaskOptions extends BaseMaskOptions {
  keepStart?: number; // Amex default 6, otherwise 0
  keepEnd?: number; // Amex default 5, otherwise 4
}
```

## IdCardMaskOptions

```ts
interface IdCardMaskOptions extends BaseMaskOptions {
  keepStart?: number; // default 6 (region)
  keepEnd?: number; // default 4
}
```

## BankAccountMaskOptions

```ts
interface BankAccountMaskOptions extends BaseMaskOptions {
  keepStart?: number; // default 0
  keepEnd?: number; // default 4
  minLength?: number; // default 8 with digits, else 10
}
```

## MacMaskOptions

```ts
interface MacMaskOptions extends BaseMaskOptions {
  keepStart?: number; // default 3 (OUI)
  keepEnd?: number; // default 0
}
```

## VehicleMaskOptions

```ts
type VehicleKind = 'auto' | 'vin' | 'plate';

interface VehicleMaskOptions extends BaseMaskOptions {
  kind?: VehicleKind; // default 'auto'
  keepStart?: number; // plate 2, VIN 3
  keepEnd?: number; // plate 0, VIN 4
}
```

## JwtMaskOptions

```ts
type JwtPartVisibility = 'mask' | 'keep';

interface JwtMaskOptions extends BaseMaskOptions {
  header?: JwtPartVisibility; // 'mask'
  payload?: JwtPartVisibility; // 'mask'
  signature?: JwtPartVisibility; // 'mask'
  keepSegmentChars?: number; // 0
  maskSegmentLength?: number; // 8
}
```

## IpMaskOptions

```ts
interface Ipv4MaskOptions extends BaseMaskOptions {
  keepStart?: number; // 2
  keepEnd?: number; // 0
}

interface Ipv6MaskOptions extends BaseMaskOptions {
  keepGroups?: number; // 2
}

interface IpMaskOptions extends BaseMaskOptions {
  ipv4?: Ipv4MaskOptions;
  ipv6?: Ipv6MaskOptions;
}
```

## UrlMaskOptions

```ts
interface UrlMaskOptions extends BaseMaskOptions {
  maskCredentials?: boolean; // true
  query?: readonly string[];
  maskAllQuery?: boolean; // false
  maskFragment?: boolean; // true
  valueMaskLength?: number; // 6
}
```

## Schema-related types

```ts
/** Contravariant annotation so (value: string) => string can be assigned */
type ValueMasker = (value: never) => string;

type PresetName =
  | 'email'
  | 'phone'
  | 'name'
  | 'address'
  | 'creditCard'
  | 'idCard'
  | 'bankAccount'
  | 'mac'
  | 'vehicle'
  | 'jwt'
  | 'ip'
  | 'url'
  | 'generic';

/** `{ type: 'email' }` / `{ type: 'generic', options: { keepStart: 2 } }` */
interface MaskFieldConfig {
  type: PresetName;
  options?: Record<string, unknown>;
}

type SchemaMasker = PresetName | ValueMasker | MaskFieldConfig;

/** Path → rule; supports 'a.b' and 'a.*.c' */
type ObjectSchema = Record<string, SchemaMasker>;

/** Field name → rule (maskLog / fields) */
type FieldMap = Record<string, SchemaMasker>;
```

## MaskLog / CreateMasker / Masker

```ts
interface MaskLogOptions {
  fields?: FieldMap;
}

interface CreateMaskerOptions {
  fields?: FieldMap;
  schema?: ObjectSchema;
}

interface Masker {
  mask<T>(value: T): T;
}
```

## Usage example

```ts
import type { ObjectSchema, EmailMaskOptions } from 'masker';
import { maskEmail } from 'masker';

const emailOpts: EmailMaskOptions = { mask: '•', keepStart: 1, keepEnd: 1 };

const schema = {
  email: (v: string) => maskEmail(v, emailOpts),
  phone: 'phone',
} satisfies ObjectSchema;
```

## Not exported (internal)

Path-trie nodes (`PathNode`), `parsePath`, `advanceNodes`, and so on — kept private so users do not depend on unstable internal structures.

Related: [API](/en/reference/api) · [Custom Maskers](/en/advanced/custom)

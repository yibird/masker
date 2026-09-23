# Types

全部公开类型（`import type`）。内部路径 trie、解析器类型**不导出**。

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
  /** 遮盖 token，默认 '*' */
  mask?: string;
}
```

## SliceMaskOptions

用于 `maskGeneric`，也被 `AddressMaskOptions` 继承：

```ts
interface SliceMaskOptions extends BaseMaskOptions {
  keepStart?: number; // 默认 0
  keepEnd?: number; // 默认 0
  maskLength?: number; // 固定遮盖长度
}
```

## EmailMaskOptions

```ts
interface EmailMaskOptions extends BaseMaskOptions {
  keepStart?: number; // 默认 1
  keepEnd?: number; // 默认 1
  maskTag?: boolean; // 默认 false
}
```

## PhoneMaskOptions

```ts
interface PhoneMaskOptions extends BaseMaskOptions {
  keepStart?: number; // 默认 3
  keepEnd?: number; // 默认 4
}
```

## NameMaskOptions

```ts
interface NameMaskOptions extends BaseMaskOptions {
  keepStart?: number; // 默认 1
  keepEnd?: number; // 默认 1
}
```

## AddressMaskOptions

```ts
interface AddressMaskOptions extends SliceMaskOptions {
  disableAutoPrefix?: boolean; // 默认 false
}
```

## CreditCardMaskOptions

```ts
interface CreditCardMaskOptions extends BaseMaskOptions {
  keepStart?: number; // Amex 默认 6，否则 0
  keepEnd?: number; // Amex 默认 5，否则 4
}
```

## IdCardMaskOptions

```ts
interface IdCardMaskOptions extends BaseMaskOptions {
  keepStart?: number; // 默认 6（行政区划）
  keepEnd?: number; // 默认 4
}
```

## BankAccountMaskOptions

```ts
interface BankAccountMaskOptions extends BaseMaskOptions {
  keepStart?: number; // 默认 0
  keepEnd?: number; // 默认 4
  minLength?: number; // 默认：有数字 8，否则 10
}
```

## MacMaskOptions

```ts
interface MacMaskOptions extends BaseMaskOptions {
  keepStart?: number; // 默认 3（OUI）
  keepEnd?: number; // 默认 0
}
```

## VehicleMaskOptions

```ts
type VehicleKind = 'auto' | 'vin' | 'plate';

interface VehicleMaskOptions extends BaseMaskOptions {
  kind?: VehicleKind; // 默认 'auto'
  keepStart?: number; // 车牌 2，VIN 3
  keepEnd?: number; // 车牌 0，VIN 4
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

## Schema 相关

```ts
/** 逆变标注，便于 (value: string) => string 赋值 */
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

/** 路径 → 规则；支持 'a.b' 与 'a.*.c' */
type ObjectSchema = Record<string, SchemaMasker>;

/** 字段名 → 规则（maskLog / fields） */
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

## 使用示例

```ts
import type { ObjectSchema, EmailMaskOptions } from 'masker';
import { maskEmail } from 'masker';

const emailOpts: EmailMaskOptions = { mask: '•', keepStart: 1, keepEnd: 1 };

const schema = {
  email: (v: string) => maskEmail(v, emailOpts),
  phone: 'phone',
} satisfies ObjectSchema;
```

## 未导出（内部）

路径 trie 节点（`PathNode`）、`parsePath`、`advanceNodes` 等 —— 避免用户依赖不稳定内部结构。

相关：[API](/reference/api) · [Custom Maskers](/advanced/custom)

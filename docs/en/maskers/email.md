# Email

`maskEmail` masks the local part while **preserving the email structure**: the `@`, domain, and subdomain are kept as-is by default; `+tag` is kept by default (many systems use tags for routing, and the tag itself is rarely sensitive).

```ts
function maskEmail(value: string, options?: EmailMaskOptions): string;
```

## Basic usage

<MaskExample fn="maskEmail" input="zhangsan@example.com" />

Default strategy: the local part **keeps the first and last grapheme**, and everything in between is replaced with `mask`.

<MaskPair input="zhangsan@example.com" output="z******n@example.com" />

## Custom mask character

<MaskExample fn="maskEmail" input="john.doe@example.com" :options="{ mask: '#' }" />

<MaskPair input="zhangsan@example.com" output="z######n@example.com" note="mask: '#' (6 characters in the middle)" />

Other common tokens: `•`, `x`, `*` (default).

## Custom keep lengths

<MaskExample fn="maskEmail" input="zhangsan@example.com" :options="{ keepStart: 2, keepEnd: 3 }" />

<MaskPair input="zhangsan@example.com" output="zh***san@example.com" note="keepStart: 2, keepEnd: 3" />

## Edge cases

### Very short local part

<MaskPair input="a@example.com" output="*@example.com" note="single character local → masked entirely" />

<MaskPair input="ab@example.com" output="a*@example.com" note="two characters: keep the first, mask the rest" />

### Plus tag

<MaskPair input="user+tag@example.com" output="u**r+tag@example.com" note="+tag kept by default" />

<MaskExample fn="maskEmail" input="user+tag@example.com" :options="{ maskTag: true }" />

<MaskPair input="user+tag@example.com" output="u******g@example.com" note="maskTag: true — mask the whole local part together" />

### Subdomain and domain

<MaskPair input="user@mail.example.com" output="u**r@mail.example.com" note="subdomain unaffected" />

<MaskPair input="zhang.san@example.com" output="z*******n@example.com" note="dots inside the local part fall in the masked region (length is preserved 1:1)" />

### Invalid input

| Input          | Output                                      |
| -------------- | ------------------------------------------- |
| `''`           | `''`                                        |
| `invalid`      | `invalid` (returned as-is, no error thrown) |
| `@example.com` | `@example.com`                              |
| `user@`        | `user@`                                     |

## Unicode

The local part is counted by **grapheme cluster**, so Chinese email aliases never split surrogate pairs:

<MaskPair input="张三丰@example.com" output="张*丰@example.com" />

## Options

```ts
interface EmailMaskOptions {
  mask?: string; // default '*'
  keepStart?: number; // default 1
  keepEnd?: number; // default 1
  maskTag?: boolean; // default false
}
```

## Business scenario: exporting a registered-user list

```ts
import { maskEmail, maskName, maskPhone } from 'masker';

const rows = [
  { name: '张三', email: 'zhangsan@example.com', phone: '13812345678' },
  { name: 'Alice Johnson', email: 'alice@corp.example.com', phone: '+1 415 555 0123' },
];

const exported = rows.map((r) => ({
  ...r,
  name: maskName(r.name),
  email: maskEmail(r.email),
  phone: maskPhone(r.phone),
}));
```

Exported result:

```text
[
  { name: '张*', email: 'z******n@example.com', phone: '138****5678' },
  { name: 'A***e J*****n', email: 'a***e@corp.example.com', phone: '+1 415 *** 0123' }
]
```

## Error behavior

**Never throws.** Invalid or empty emails are returned as-is. Misconfigured options are caught by TypeScript at compile time.

Related: [Generic](/en/maskers/generic) · [Object Schema](/en/object/path-schema)

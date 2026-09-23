# Generic

`maskGeneric` is the default weapon for when you don't know the type: keep the edges via **keepStart / keepEnd** and replace the middle with `mask`. Unicode is counted by grapheme cluster, not raw `string.length`.

```ts
function maskGeneric(value: string, options?: SliceMaskOptions): string;
```

## Basic usage

By default everything is **masked entirely** (both `keepStart` and `keepEnd` are 0):

<MaskExample fn="maskGeneric" input="sensitive-api-key" />

<MaskPair input="abc" output="***" />

<MaskPair input="sensitive-value" output="***************" note="15 graphemes → 15 '*'" />

## keepStart / keepEnd

<MaskExample fn="maskGeneric" input="1234567890" :options="{ keepStart: 2, keepEnd: 2 }" />

<MaskPair input="1234567890" output="12******90" note="classic bank-card style: keep both ends" />

<MaskPair input="1234567890" output="**********" note="keepStart: 0, keepEnd: 0" />

<MaskPair input="1234567890" output="1234567890" note="keepStart + keepEnd ≥ length → returned as-is" />

## Custom mask

<MaskExample fn="maskGeneric" input="123456" :options="{ keepStart: 1, keepEnd: 1, mask: 'x' }" />

<MaskPair input="123456" output="1xxxx6" note="mask: 'x'" />

<MaskPair input="123456" output="1••••6" note="mask: '•'" />

<MaskPair input="123456" output="1####6" note="mask: '#'" />

## maskLength

Give the masked region a **fixed length** (ignoring the natural middle length) — handy for "always 6 asterisks in logs":

<MaskExample fn="maskGeneric" input="1234567890" :options="{ keepStart: 2, keepEnd: 2, maskLength: 3 }" />

<MaskPair input="1234567890" output="12***90" note="maskLength: 3" />

<MaskPair input="abc" output="******" note="maskLength: 6 (full mask + fixed length)" />

## Unicode

### Chinese / Japanese / Korean

<MaskPair input="中文测试" output="中**试" note="keepStart: 1, keepEnd: 1" />

<MaskPair input="こんにちは" output="こ***は" note="keepStart: 1, keepEnd: 1" />

<MaskPair input="한국어" output="한*어" note="keepStart: 1, keepEnd: 1" />

### Emoji

Skin-tone modifiers and ZWJ family emoji count as **one** user-perceived character on runtimes that support `Intl.Segmenter` (Node 18+ / Bun):

```ts
maskGeneric('👍🏽👍🏽', { keepStart: 1, keepEnd: 0 });
// 👍🏽*

maskGeneric('👨‍👩‍👧‍👦ab', { keepStart: 1, keepEnd: 2 });
// 👍 family emoji + ab  — see the live result below
```

<MaskExample fn="maskGeneric" input="👍🏽👍🏽" :options="{ keepStart: 1, keepEnd: 0 }" />

> Without `Segmenter`, the runtime falls back to code-point splitting; large Unicode dependencies are **never** introduced.

### Very long strings

A 50k-character input is still a single O(n) pass (ASCII takes the fast path):

```ts
maskGeneric('a'.repeat(50_000), { keepStart: 3, keepEnd: 3 });
// aaa + 49994 * characters + aaa
```

## Performance notes

| Path                                              | Strategy                                    |
| ------------------------------------------------- | ------------------------------------------- |
| pure ASCII (including common card numbers / keys) | UTF-16 index + `slice`, no segmentation     |
| non-ASCII                                         | `Intl.Segmenter` graphemes (when available) |
| single-character `mask`                           | `String.repeat`                             |
| multi-character `mask`                            | `Array.fill + join`                         |

## Options

```ts
interface SliceMaskOptions {
  mask?: string; // default '*'
  keepStart?: number; // default 0
  keepEnd?: number; // default 0
  maskLength?: number; // optional fixed mask length
}
```

`AddressMaskOptions` extends this with `disableAutoPrefix`.

## Business scenario: keys and internal IDs

```ts
import { maskGeneric, maskObject } from 'masker';

const payload = {
  apiKey: 'sk-live-9f3a…',
  requestId: 'req_01H8X…',
  note: 'visible',
};

maskLog(payload, {
  fields: {
    apiKey: 'generic',
    requestId: (v: string) => maskGeneric(v, { keepStart: 3, keepEnd: 0 }),
  },
});
// { apiKey: '****************', requestId: 'sk_*…', note: 'visible' }
```

## Error behavior

`''` → `''`; never throws.

Related: [Playground](/en/playground) · [Custom Maskers](/en/advanced/custom)

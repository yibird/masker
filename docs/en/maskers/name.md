# Name

`maskName` processes each **whitespace-separated token** individually, covering both Chinese names and English (first / last) names. It never assumes "a name is always 2 characters."

```ts
function maskName(value: string, options?: NameMaskOptions): string;
```

## Default rules

For each token (counted by grapheme):

| Length | Behavior                             | Example            |
| ------ | ------------------------------------ | ------------------ |
| 1      | mask the whole character             | `李` → `*`         |
| 2      | keep first, mask last                | `张三` → `张*`     |
| ≥ 3    | keep first and last, mask the middle | `张三丰` → `张*丰` |

Whitespace is preserved as-is.

## Chinese names

<MaskExample fn="maskName" input="张三" />

<MaskPair input="张三" output="张*" />

<MaskPair input="张三丰" output="张*丰" />

### Compound surnames

<MaskExample fn="maskName" input="欧阳娜娜" />

<MaskPair input="欧阳娜娜" output="欧**娜" note="欧阳 · 娜娜 treated as one 4-character token: keep first and last" />

## English names

<MaskExample fn="maskName" input="John Smith" />

<MaskPair input="John" output="J**n" />

<MaskPair input="John Smith" output="J**n S***h" note="each token processed independently; space preserved" />

<MaskPair input="Alice Johnson" output="A***e J*****n" />

<MaskPair input="  John   Smith  " output="  J**n   S***h  " note="consecutive spaces preserved as-is" />

## Custom mask / keep lengths

<MaskExample fn="maskName" input="张三丰" :options="{ mask: '#' }" />

<MaskPair input="张三丰" output="张#丰" note="mask: '#'" />

<MaskPair input="Alice Johnson" output="Ali*e Joh*son" note="keepStart: 3, keepEnd: 3 (short tokens are clamped automatically)" />

## Other Unicode

<MaskPair input="山田太郎" output="山**郎" note="Japanese kanji are also graphemes" />

<MaskPair input="김철수" output="김*수" note="Korean syllables" />

## Business scenario: masked display name

```ts
import { maskName } from 'masker';

function displayName(raw: string, role: 'admin' | 'auditor'): string {
  if (role === 'admin') return raw;
  return maskName(raw);
}

displayName('张三丰', 'auditor'); // 张*丰
displayName('张三丰', 'admin'); // 张三丰 (admin still sees the full name)
```

## Options

```ts
interface NameMaskOptions {
  mask?: string; // default '*'
  keepStart?: number; // default 1
  keepEnd?: number; // default 1 (tightened automatically when length < 3, so at least 1 character is always masked)
}
```

## Error behavior

`''` → `''`; never throws.

Related: [Address](/en/maskers/address) · [Object](/en/object/overview)

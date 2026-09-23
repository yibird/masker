# Phone

`maskPhone` only replaces the **digit runs**, fully preserving spaces, `-`, `()`, and an optional `+` country code — it never forces `+1 415 555 1234` into a single 11-digit regex.

```ts
function maskPhone(value: string, options?: PhoneMaskOptions): string;
```

## Basic usage — Chinese mobile numbers

<MaskExample fn="maskPhone" input="13812345678" />

Defaults are `keepStart: 3` and `keepEnd: 4` (applied to the **national number after the country code**):

<MaskPair input="13812345678" output="138****5678" />

## International numbers

### Keeping +86

<MaskExample fn="maskPhone" input="+8613812345678" />

<MaskPair input="+8613812345678" output="+86138****5678" note="country code 86 comes from the built-in E.164 list (longest match)" />

### NANP: spaces and +1

<MaskPair input="+1 415 555 1234" output="+1 415 *** 1234" note="separators preserved as-is" />

### Parentheses and dashes

<MaskPair input="(415) 555-1234" output="(415) ***-1234" />

## Custom keepStart / keepEnd

<MaskExample fn="maskPhone" input="13812345678" :options="{ keepStart: 3, keepEnd: 4, mask: '*' }" />

Keep more digits:

<MaskPair input="13812345678" output="1381****678" note="keepStart: 4, keepEnd: 3" />

Mask everything:

<MaskPair input="13812345678" output="###########" note="keepStart: 0, keepEnd: 0, mask: '#'" />

With a multi-character `mask` token, each masked digit takes its **first character**:

<MaskPair input="13812345678" output="138••••5678" note="mask: '••' → uses '•' per digit" />

## Edge cases

| Input         | Behavior                                 |
| ------------- | ---------------------------------------- |
| `''`          | `''`                                     |
| `not-a-phone` | as-is (no digits)                        |
| `12`          | `1*` (at least 1 digit is always masked) |
| `1`           | `*`                                      |

Country-code detection: the digits after `+` are **longest-prefix matched** against the built-in list, and the remaining national number must be 7–15 digits, so `+86138…` is never misread as area code `861`.

## Options

```ts
interface PhoneMaskOptions {
  mask?: string; // default '*'
  keepStart?: number; // default 3 (national segment)
  keepEnd?: number; // default 4
}
```

## Business scenario: customer-support ticket

```ts
import { maskPhone, maskName } from 'masker';

const ticket = {
  id: 'T-9910',
  caller: '王小明',
  mobile: '+86 138 1234 5678',
};

const safeTicket = {
  ...ticket,
  caller: maskName(ticket.caller),
  mobile: maskPhone(ticket.mobile),
};
// { id: 'T-9910', caller: '王*', mobile: '+86 138****5678' }
```

> The spacing format in the sample is preserved as-is — only the digits change.

## Error behavior

No digits or empty string → **returned as-is**; never throws.

Related: [Name](/en/maskers/name) · [Playground](/en/playground)

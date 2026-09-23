# ID Card

`maskIdCard` masks Chinese resident ID numbers, recognising both the standard **18-digit** form (last character may be `X`) and the legacy **15-digit** form. By default the administrative region (first 6) and the last 4 digits are kept — birth date and sequence in the middle are always hidden.

```ts
function maskIdCard(value: string, options?: IdCardMaskOptions): string;
```

## Basic usage

<MaskExample fn="maskIdCard" input="110101199001011234" />

<MaskPair input="110101199001011234" output="110101********1234" note="keepStart: 6, keepEnd: 4" />

### Check digit `X`

<MaskPair input="11010119900101123X" output="110101********123X" note="Trailing X kept when it falls in keepEnd" />

### Legacy 15-digit

<MaskPair input="110101900101123" output="110101*****1123" note="15 digits: 6 + 5 masked + 4" />

## Full mask (stricter)

<MaskExample fn="maskIdCard" input="110101199001011234" :options="{ keepStart: 0, keepEnd: 0 }" />

<MaskPair input="110101199001011234" output="******************" note="keepStart: 0, keepEnd: 0" />

## Last 4 only

<MaskPair input="110101199001011234" output="**************1234" note="keepStart: 0, keepEnd: 4" />

## Edge cases

| Input                             | Behaviour                               |
| --------------------------------- | --------------------------------------- |
| `''`                              | `''`                                    |
| `123`                             | unchanged (wrong length)                |
| `1101011990010112345` (19 digits) | unchanged                               |
| Non-ID string                     | unchanged                               |
| `110101 19900101 1234`            | separators kept; digits masked in place |

::: tip Not the same as Credit Card

- ID card: fixed 15/18-digit structure, **no** Luhn
- Payment cards: see [Credit Card](/en/maskers/credit-card)
- Bank accounts: see [Bank Account](/en/maskers/bank-account)  
  :::

## Options

```ts
interface IdCardMaskOptions {
  mask?: string; // default '*'
  keepStart?: number; // default 6 (region)
  keepEnd?: number; // default 4
}
```

## Scenario: KYC export

```ts
import { maskIdCard, maskName, maskPhone } from 'masker';

const row = {
  name: '张三',
  phone: '13812345678',
  idNo: '110101199001011234',
};

const safe = {
  ...row,
  name: maskName(row.name),
  phone: maskPhone(row.phone),
  idNo: maskIdCard(row.idNo),
};
```

## Error behaviour

**Never throws.** Non 15/18-digit input is returned unchanged; birthday / checksum are not validated.

Related: [Bank Account](/en/maskers/bank-account) · [Generic](/en/maskers/generic) · [Security](/en/advanced/security)

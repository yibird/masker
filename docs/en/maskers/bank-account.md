# Bank Account

`maskBankAccount` masks **bank account numbers**. It is intentionally **separate from** [Credit Card](/en/maskers/credit-card): accounts cover a wider length range (often 8–19 digits), have no PAN brand / Amex rules, and application code usually does not run Luhn. Both pure-digit accounts and IBAN-style alphanumeric accounts are supported.

```ts
function maskBankAccount(value: string, options?: BankAccountMaskOptions): string;
```

## Basic usage

<MaskExample fn="maskBankAccount" input="6222021234567890123" />

Default keeps only the **last 4** characters:

<MaskPair input="6222021234567890123" output="***************0123" note="keepEnd: 4" />

## Preserving separators

### Spaces

<MaskExample fn="maskBankAccount" input="6222 0212 3456 7890" />

<MaskPair input="6222 0212 3456 7890" output="**** **** **** 7890" />

### Dashes

<MaskPair input="6222-0212-3456-7890" output="****-****-****-7890" />

## IBAN

Letters and digits are both masked; spaces are preserved:

<MaskExample fn="maskBankAccount" input="GB29NABC60161331926819" />

<MaskPair input="GB29NABC60161331926819" output="******************6819" note="Letters and digits masked" />

## Custom keep counts

<MaskExample fn="maskBankAccount" input="6222021234567890123" :options="{ keepStart: 4, keepEnd: 4 }" />

<MaskPair input="6222021234567890123" output="6222***********0123" note="keepStart: 4, keepEnd: 4" />

## Credit Card vs Bank Account

|                | Credit Card            | Bank Account             |
| -------------- | ---------------------- | ------------------------ |
| Typical length | 13–19 (PAN), often 16  | 8–19+, varies by country |
| Brand rules    | Amex 15-digit defaults | none                     |
| Validation     | optional `isLuhnValid` | no Luhn                  |
| Default keep   | last 4 (Amex 6+5)      | last 4                   |
| IBAN           | no                     | yes (alphanumeric)       |

## Edge cases

| Input                       | Behaviour                     |
| --------------------------- | ----------------------------- |
| `''`                        | `''`                          |
| Fewer than 8 digits         | unchanged                     |
| Letters only, &lt; 10 chars | unchanged                     |
| Valid / invalid account     | both maskable (no validation) |

## Options

```ts
interface BankAccountMaskOptions {
  mask?: string; // default '*'
  keepStart?: number; // default 0
  keepEnd?: number; // default 4
  minLength?: number; // default: 8 with digits, else 10
}
```

## Scenario: transfer logs

```ts
import { maskBankAccount } from 'masker';

function logTransfer(t: { from: string; to: string; amount: number }) {
  logger.info('transfer', {
    from: maskBankAccount(t.from),
    to: maskBankAccount(t.to),
    amount: t.amount,
  });
}
```

## Error behaviour

**Never throws;** short input is returned unchanged.

Related: [Credit Card](/en/maskers/credit-card) · [API Reference](/en/reference/api#maskbankaccount) · [Security](/en/advanced/security)

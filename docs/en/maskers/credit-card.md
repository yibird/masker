# Credit Card

`maskCreditCard` masks the card digits while **preserving** the space / `-` formatting. Whether a number is a "valid card" is unrelated to masking: `isLuhnValid` is a separate API, and the masking path does not depend on validation.

```ts
function maskCreditCard(value: string, options?: CreditCardMaskOptions): string;
function isLuhnValid(value: string): boolean;
```

## Basic usage

<MaskExample fn="maskCreditCard" input="4111111111111111" />

For 16-digit numbers, the default **keeps only the last 4 digits**:

<MaskPair input="4111111111111111" output="************1111" />

## Preserving the original format

### Spaces

<MaskExample fn="maskCreditCard" input="4111 1111 1111 1111" />

<MaskPair input="4111 1111 1111 1111" output="**** **** **** 1111" />

### Dashes

<MaskPair input="4111-1111-1111-1111" output="****-****-****-1111" />

## Amex (15 digits)

By default, 15-digit cards are treated as Amex-style: **keep the first 6 + last 5** (BIN + last 5):

<MaskExample fn="maskCreditCard" input="378282246310005" />

<MaskPair input="378282246310005" output="378282****10005" />

<MaskPair input="3782 822463 10005" output="3782 82**** 10005" note="separators preserved; the first 6 digits span the groups" />

## Custom keep lengths

<MaskExample fn="maskCreditCard" input="4111111111111111" :options="{ keepStart: 4, keepEnd: 4 }" />

<MaskPair input="4111111111111111" output="4111********1111" note="keepStart: 4, keepEnd: 4" />

<MaskPair input="4111111111111111" output="############1111" note="mask: '#'" />

## Decoupled from Luhn validation

```ts
import { maskCreditCard, isLuhnValid } from 'masker';

isLuhnValid('4111111111111111'); // true
isLuhnValid('4111111111111112'); // false

// masking does not require validation to pass
maskCreditCard('4111111111111112'); // ************1112
```

`isLuhnValid` ignores spaces and `-`; it returns `false` for non-digits.

## Edge cases

| Input                        | Behavior                                      |
| ---------------------------- | --------------------------------------------- |
| `''`                         | `''`                                          |
| `123` (&lt; 12 digits)       | **returned as-is** (doesn't look like a card) |
| `12345678` (8 digits)        | returned as-is                                |
| valid / invalid card numbers | always maskable (independent of Luhn)         |

## Options

```ts
interface CreditCardMaskOptions {
  mask?: string; // default '*'
  keepStart?: number; // default: 6 for Amex, 0 otherwise
  keepEnd?: number; // default: 5 for Amex, 4 otherwise
}
```

## Business scenario: payment logging

```ts
import { maskCreditCard } from 'masker';

function logPayment(p: { pan: string; amount: number }) {
  logger.info('payment', {
    pan: maskCreditCard(p.pan), // **** **** **** 1111
    amount: p.amount,
    // never log p.pan in plaintext
  });
}
```

## Error behavior

Never throws; input with fewer than 12 digits is returned as-is.

Related: [API Reference](/en/reference/api#maskcreditcard) · [Security](/en/advanced/security)

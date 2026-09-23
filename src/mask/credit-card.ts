import { DEFAULT_MASK } from '../internal/unicode.js';
import type { CreditCardMaskOptions } from '../types.js';

/**
 * Count decimal digits without allocating a match array.
 */
function countDigits(value: string): number {
  let n = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c >= 48 && c <= 57) n++;
  }
  return n;
}

/**
 * Validate a card number with the Luhn algorithm.
 *
 * Independent of masking — `maskCreditCard` never requires a valid number.
 * Non-string / empty input returns `false`.
 */
export function isLuhnValid(value: string): boolean {
  if (typeof value !== 'string' || value.length === 0) return false;
  let sum = 0;
  let alt = false;
  for (let i = value.length - 1; i >= 0; i--) {
    const c = value.charCodeAt(i);
    let d: number;
    if (c >= 48 && c <= 57) d = c - 48;
    else if (c === 32 || c === 45) continue; // space / hyphen
    else return false;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/**
 * Mask a payment card number, preserving separators (`space`, `-`).
 *
 * Defaults:
 * - 16-digit style → keep last 4 digits: `**** **** **** 1111`
 * - Amex (15 digits) → keep first 6 + last 5
 *
 * ```ts
 * maskCreditCard('4111111111111111')     // → '************1111'
 * maskCreditCard('4111 1111 1111 1111')  // → '**** **** **** 1111'
 * maskCreditCard('4111-1111-1111-1111')  // → '****-****-****-1111'
 * ```
 *
 * Input with fewer than 12 digits (not card-shaped) is returned unchanged.
 * Masking does **not** imply the number is (in)valid — see {@link isLuhnValid}.
 */
export function maskCreditCard(value: string, options?: CreditCardMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;

  const digits = countDigits(value);
  if (digits < 12) return value;

  const mask = options?.mask ?? DEFAULT_MASK;
  const maskToken = mask.length > 0 ? mask[0]! : '*';

  const isAmex = digits === 15;
  const defaultKeepStart = isAmex ? 6 : 0;
  const defaultKeepEnd = isAmex ? 5 : 4;

  const keepStart =
    options?.keepStart !== undefined && options.keepStart >= 0
      ? Math.min(Math.floor(options.keepStart), digits)
      : defaultKeepStart;
  const keepEnd =
    options?.keepEnd !== undefined && options.keepEnd >= 0
      ? Math.min(Math.floor(options.keepEnd), digits)
      : defaultKeepEnd;

  // Clamp so at least one digit is masked when possible.
  let ks = keepStart;
  let ke = keepEnd;
  if (ks + ke >= digits && digits > 0) {
    if (digits === 1) {
      ks = 0;
      ke = 0;
    } else if (ks >= digits) {
      ks = digits - 1;
      ke = 0;
    } else {
      ke = digits - ks - 1;
    }
  }

  const firstMasked = ks;
  const lastMasked = digits - ke;
  let di = 0;
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const c = value[i]!;
    const isDigit = c >= '0' && c <= '9';
    if (isDigit) {
      out += di >= firstMasked && di < lastMasked ? maskToken : c;
      di++;
    } else {
      out += c; // preserve space / hyphen / other separators
    }
  }
  return out;
}

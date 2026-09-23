import { DEFAULT_MASK } from '../internal/unicode.js';
import type { BankAccountMaskOptions } from '../types.js';

/** Single pass: digit count + alphanumeric count (no match-array allocations). */
function countDigitAlnum(value: string): { digits: number; alnum: number } {
  let digits = 0;
  let alnum = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    const isDigit = c >= 48 && c <= 57;
    const isAlpha = (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
    if (isDigit) {
      digits++;
      alnum++;
    } else if (isAlpha) {
      alnum++;
    }
  }
  return { digits, alnum };
}

/**
 * Mask a bank account number.
 *
 * Intentionally **separate from** {@link maskCreditCard}: bank accounts have
 * different lengths (often 8–19 digits), no PAN brand rules, and usually no
 * Luhn check in application code. IBAN-style alphanumeric accounts are also
 * supported — letters and digits are both masked, separators are preserved.
 *
 * Defaults keep the last 4 alphanumeric characters only:
 *
 * ```ts
 * maskBankAccount('6222 0212 3456 7890 123')  // → '**** **** **** **** *123'
 * maskBankAccount('GB29NABC60161331926819')    // → '******************6819'
 * ```
 *
 * Input shorter than 8 digits (or 10 alphanumerics when there are no digits)
 * is returned unchanged. Masking does **not** validate the account.
 */
export function maskBankAccount(value: string, options?: BankAccountMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;

  const { digits, alnum } = countDigitAlnum(value);
  if (alnum === 0) return value;

  const minLength =
    options?.minLength !== undefined && options.minLength > 0
      ? Math.floor(options.minLength)
      : digits > 0
        ? 8
        : 10;
  if (alnum < minLength) return value;

  const mask = options?.mask ?? DEFAULT_MASK;
  const token = mask.length > 0 ? mask[0]! : '*';
  const total = alnum;

  const keepStartOpt = options?.keepStart;
  const keepEndOpt = options?.keepEnd;
  let ks =
    keepStartOpt !== undefined && keepStartOpt >= 0 ? Math.min(Math.floor(keepStartOpt), total) : 0;
  let ke =
    keepEndOpt !== undefined && keepEndOpt >= 0 ? Math.min(Math.floor(keepEndOpt), total) : 4;

  if (ks + ke >= total && total > 0) {
    if (total === 1) {
      ks = 0;
      ke = 0;
    } else if (ks >= total) {
      ks = total - 1;
      ke = 0;
    } else {
      ke = total - ks - 1;
    }
  }

  const firstMasked = ks;
  const lastMasked = total - ke;

  let bi = 0;
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const c = value[i]!;
    const isDigit = c >= '0' && c <= '9';
    const isAlpha = (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
    if (isDigit || isAlpha) {
      out += bi >= firstMasked && bi < lastMasked ? token : c;
      bi++;
    } else {
      out += c;
    }
  }
  return out;
}

import { DEFAULT_MASK } from '../internal/unicode.js';
import type { IdCardMaskOptions } from '../types.js';

const ID18_RE = /^\d{17}[\dXx]$/;
const ID15_RE = /^\d{15}$/;

function clampKeep(v: number | undefined, fallback: number, digits: number): number {
  if (v === undefined || !Number.isFinite(v)) return fallback;
  const n = Math.floor(v);
  if (n < 0) return 0;
  return n > digits ? digits : n;
}

/**
 * Mask a Chinese resident ID card number (居民身份证).
 *
 * Recognises the standard **18-digit** form (last digit may be `X`) and the
 * legacy **15-digit** form. Non-matching input is returned unchanged.
 *
 * Defaults keep the administrative region prefix (first 6) and the last 4
 * digits — birthdate / sequence in the middle is always hidden:
 *
 * ```ts
 * maskIdCard('110101199001011234')  // → '110101**********1234'
 * maskIdCard('110101900101123')     // → '110101******123'
 * ```
 *
 * Separators (spaces / dashes) are preserved. Masking does **not** imply
 * checksum validation.
 */
export function maskIdCard(value: string, options?: IdCardMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;

  const normalized = value.replace(/[\s-]/g, '');
  const is18 = ID18_RE.test(normalized);
  const is15 = ID15_RE.test(normalized);
  if (!is18 && !is15) return value;

  const digits = normalized.length;
  const mask = options?.mask ?? DEFAULT_MASK;
  const token = mask.length > 0 ? mask[0]! : '*';

  const keepStart = clampKeep(options?.keepStart, 6, digits);
  const keepEnd = clampKeep(options?.keepEnd, 4, digits);

  let ks = keepStart;
  let ke = keepEnd;
  if (ks + ke >= digits) {
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

  // Walk original string so separators stay in place; ID body is contiguous digits.
  let di = 0;
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const c = value[i]!;
    const isDigit = c >= '0' && c <= '9';
    const isCheckX = (c === 'X' || c === 'x') && is18 && di === 17;
    if (isDigit || isCheckX) {
      out += di >= firstMasked && di < lastMasked ? token : c;
      di++;
    } else {
      out += c;
    }
  }
  return out;
}

import { DEFAULT_MASK, isAscii, optInt, repeatMask, toGraphemes } from '../internal/unicode.js';
import type { EmailMaskOptions } from '../types.js';

/**
 * Mask an email local part while preserving domain, subdomains and `+tag`.
 *
 * Defaults: keep first & last grapheme of the main local part.
 *
 * ```ts
 * maskEmail('zhangsan@example.com')  // → 'z******n@example.com'
 * maskEmail('user+tag@example.com')  // → 'u***r+tag@example.com'
 * maskEmail('a@example.com')         // → '*@example.com'
 * ```
 *
 * Invalid input (no `@`, empty parts) is returned unchanged.
 */
export function maskEmail(value: string, options?: EmailMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;

  const at = value.indexOf('@');
  if (at <= 0 || at === value.length - 1) return value;

  const local = value.slice(0, at);
  const domain = value.slice(at); // includes '@'

  const mask = options?.mask ?? DEFAULT_MASK;
  const keepStart = optInt(options?.keepStart, 1);
  const keepEnd = optInt(options?.keepEnd, 1);
  const maskTag = options?.maskTag === true;

  // Split local into main + '+tag' (tag preserved by default).
  const plus = local.indexOf('+');
  let main = local;
  let tag = '';
  if (!maskTag && plus >= 0) {
    main = local.slice(0, plus);
    tag = local.slice(plus); // includes '+'
  }

  if (main.length === 0) {
    // e.g. '+tag@x.com' — nothing to mask in main.
    return maskTag ? repeatMask(mask, Math.max(1, local.length)) + domain : value;
  }

  let maskedMain: string;
  if (isAscii(main)) {
    // Fast path: UTF-16 indices === graphemes for printable ASCII locals.
    const n = main.length;
    let keepS = Math.min(keepStart, n);
    let keepE = Math.min(keepEnd, n);
    if (keepS + keepE >= n) {
      if (n === 1) {
        keepS = 0;
        keepE = 0;
      } else if (keepS >= n) {
        keepS = n - 1;
        keepE = 0;
      } else {
        keepE = n - keepS - 1;
      }
    }
    const s = keepS;
    const e = n - keepE;
    maskedMain = main.slice(0, s) + repeatMask(mask, e - s) + main.slice(e);
  } else {
    const g = toGraphemes(main);
    const n = g.length;

    let keepS = Math.min(keepStart, n);
    let keepE = Math.min(keepEnd, n);
    if (keepS + keepE >= n) {
      if (n === 1) {
        keepS = 0;
        keepE = 0;
      } else if (keepS >= n) {
        keepS = n - 1;
        keepE = 0;
      } else {
        keepE = n - keepS - 1;
      }
    }

    const s = keepS;
    const e = n - keepE;
    let out = '';
    for (let i = 0; i < s; i++) out += g[i]!;
    out += repeatMask(mask, e - s);
    for (let i = e; i < n; i++) out += g[i]!;
    maskedMain = out;
  }

  // When maskTag is false, `tag` holds `+…` and is appended unchanged.
  // When maskTag is true, the full local (including `+tag`) is already in `main`.
  return maskedMain + tag + domain;
}

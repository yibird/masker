import { DEFAULT_MASK, maskGraphemeRange, optInt, toGraphemes } from '../internal/unicode.js';
import type { AddressMaskOptions } from '../types.js';

/**
 * Leading Chinese administrative units, e.g. `北京市朝阳区…`, `浙江省杭州市西湖区…`.
 * Captures 1–4 consecutive `…省|市|区|县|旗|州|盟|自治区|特别行政区` units.
 */
const ADMIN_PREFIX_RE = /^(?:[一-龥]{1,7}(?:特别行政区|自治区|省|市|区|县|旗|州|盟)){1,4}/;

/**
 * Mask a postal address.
 *
 * Default strategy: keep the leading administrative prefix
 * (省/市/区… units) and mask everything after it. Falls back to keeping
 * 4 leading graphemes when no administrative prefix is recognised.
 *
 * ```ts
 * maskAddress('北京市朝阳区xxx街道xxx号')  // → '北京市朝阳区*********'
 * maskAddress('123 Main St Apt 4', { keepStart: 4 })  // → '123 *****************'
 * ```
 */
export function maskAddress(value: string, options?: AddressMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;

  const mask = options?.mask ?? DEFAULT_MASK;
  const maskLength = options?.maskLength;
  const disableAuto = options?.disableAutoPrefix === true;

  let keepStart: number;
  const keepEnd = optInt(options?.keepEnd, 0);

  if (options?.keepStart !== undefined) {
    keepStart = optInt(options.keepStart, 0);
  } else if (!disableAuto) {
    const m = ADMIN_PREFIX_RE.exec(value);
    if (m && m[0].length > 0 && m[0].length < value.length) {
      // Admin prefix is BMP ideographs → 1 UTF-16 unit = 1 grapheme.
      keepStart = m[0].length;
    } else {
      keepStart = Math.min(4, graphemeCount(value));
    }
  } else {
    keepStart = Math.min(4, graphemeCount(value));
  }

  const g = toGraphemes(value);
  const n = g.length;
  const s = Math.min(keepStart, n);
  const e = Math.max(s, n - keepEnd);
  if (s >= e && maskLength === undefined) return value;
  return maskGraphemeRange(g, s, e, mask, maskLength);
}

function graphemeCount(value: string): number {
  return value.length === 0 ? 0 : isAsciiOnly(value) ? value.length : toGraphemes(value).length;
}

function isAsciiOnly(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 0x7f) return false;
  }
  return true;
}

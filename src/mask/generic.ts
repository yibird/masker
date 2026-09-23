import {
  DEFAULT_MASK,
  maskGraphemeRange,
  optInt,
  repeatMask,
  toGraphemes,
} from '../internal/unicode.js';
import type { SliceMaskOptions } from '../types.js';

/**
 * Generic slice masker.
 *
 * Keeps `keepStart` leading and `keepEnd` trailing grapheme clusters,
 * replaces the middle with `mask` (one token per hidden cluster, or exactly
 * `maskLength` tokens when provided).
 *
 * ```ts
 * maskGeneric('1234567890', { keepStart: 2, keepEnd: 2 })
 * // → '12******90'
 * ```
 *
 * Invalid / empty input: returned unchanged. Non-string runtime input is
 * returned as-is (defensive, for plain JS callers).
 */
export function maskGeneric(value: string, options?: SliceMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;
  if (value.length === 1) {
    // Single character: still hide it (unless user keeps everything).
    const keepStart = optInt(options?.keepStart, 0);
    const keepEnd = optInt(options?.keepEnd, 0);
    if (keepStart + keepEnd >= 1) return value;
    return repeatMask(options?.mask ?? DEFAULT_MASK, options?.maskLength ?? 1);
  }

  const mask = options?.mask ?? DEFAULT_MASK;
  const keepStart = optInt(options?.keepStart, 0);
  const keepEnd = optInt(options?.keepEnd, 0);
  const maskLength = options?.maskLength;

  // ASCII fast path (avoids grapheme segmentation).
  let isAscii = true;
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 0x7f) {
      isAscii = false;
      break;
    }
  }

  if (isAscii) {
    const n = value.length;
    const s = Math.min(keepStart, n);
    const e = Math.max(s, n - keepEnd);
    if (s >= e && maskLength === undefined) return value;
    const middle =
      maskLength !== undefined ? repeatMask(mask, maskLength) : repeatMask(mask, e - s);
    return value.slice(0, s) + middle + value.slice(e);
  }

  const g = toGraphemes(value);
  const n = g.length;
  const s = Math.min(keepStart, n);
  const e = Math.max(s, n - keepEnd);
  if (s >= e && maskLength === undefined) return value;
  return maskGraphemeRange(g, s, e, mask, maskLength);
}

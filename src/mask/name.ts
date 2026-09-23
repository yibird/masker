import { DEFAULT_MASK, isAscii, optInt, repeatMask, toGraphemes } from '../internal/unicode.js';
import type { NameMaskOptions } from '../types.js';

/** Precompiled: split on whitespace, keep separators as capture groups. */
const WS_SPLIT_RE = /(\s+)/;
const WS_ONLY_RE = /^\s+$/;

/**
 * Mask a personal name (Chinese or Latin), token by token.
 *
 * Defaults: keep the first grapheme of each token; keep the last grapheme
 * when the token has ≥ 3 graphemes.
 *
 * ```ts
 * maskName('张三')           // → '张*'
 * maskName('张三丰')         // → '张*丰'
 * maskName('欧阳娜娜')       // → '欧**娜'
 * maskName('John Smith')     // → 'J*** S****'
 * ```
 *
 * Whitespace between tokens is preserved. Empty input returned unchanged.
 */
export function maskName(value: string, options?: NameMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;

  const mask = options?.mask ?? DEFAULT_MASK;
  const keepStart = optInt(options?.keepStart, 1);
  const keepEndOpt = optInt(options?.keepEnd, 1);

  // Split on whitespace while keeping separators (space, tab, etc.).
  const parts = value.split(WS_SPLIT_RE);
  let out = '';
  let changed = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    if (part.length === 0) continue;
    if (WS_ONLY_RE.test(part)) {
      out += part;
      continue;
    }
    const masked = maskToken(part, mask, keepStart, keepEndOpt);
    if (masked !== part) changed = true;
    out += masked;
  }

  return changed ? out : value;
}

function maskToken(token: string, mask: string, keepStart: number, keepEndUser: number): string {
  // ASCII names (very common) skip grapheme segmentation.
  if (isAscii(token)) {
    const n = token.length;
    if (n === 0) return token;
    if (n === 1) return repeatMask(mask, 1);
    let ks = Math.min(keepStart, n);
    let ke = Math.min(keepEndUser, n);
    if (n < 3 && keepEndUser === 1) ke = 0;
    if (ks + ke >= n) {
      if (ks >= n) {
        ks = n - 1;
        ke = 0;
      } else {
        ke = n - ks - 1;
      }
    }
    const s = ks;
    const e = n - ke;
    if (s >= e) return token;
    return token.slice(0, s) + repeatMask(mask, e - s) + token.slice(e);
  }

  const g = toGraphemes(token);
  const n = g.length;
  if (n === 0) return token;
  if (n === 1) {
    // Single-character token (e.g. a middle initial or 姓): hide it.
    return repeatMask(mask, 1);
  }

  let ks = Math.min(keepStart, n);
  // Default keepEnd=1 only applies when token is long enough; ensure ≥1 masked.
  let ke = Math.min(keepEndUser, n);
  if (n < 3 && keepEndUser === 1) {
    // 2-letter tokens: keep only the first character.
    ke = 0;
  }
  if (ks + ke >= n) {
    if (ks >= n) {
      ks = n - 1;
      ke = 0;
    } else {
      ke = n - ks - 1;
    }
  }

  const s = ks;
  const e = n - ke;
  if (s >= e) return token;
  let out = '';
  for (let i = 0; i < s; i++) out += g[i]!;
  out += repeatMask(mask, e - s);
  for (let i = e; i < n; i++) out += g[i]!;
  return out;
}

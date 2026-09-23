/**
 * Unicode-aware helpers shared by maskers.
 *
 * Fast path: pure-ASCII strings use UTF-16 indices directly.
 * Non-ASCII: prefer `Intl.Segmenter` (grapheme clusters) when available,
 * otherwise fall back to code points (`Array.from`).
 */

const ASCII_RE = /^[ -~]+$/; // printable ASCII (no control-char lint issues)

/** True when every code unit is printable ASCII (fast path). */
export function isAscii(value: string): boolean {
  // Empty or pure printable ASCII → regex; else scan for any code unit > 0x7f
  // (tabs/newlines fall through to the grapheme path, which is correct).
  if (ASCII_RE.test(value)) return true;
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 0x7f) return false;
  }
  // Only ASCII but may contain control chars — still fine for UTF-16 indexing.
  return true;
}

let segmenter: Intl.Segmenter | null | undefined;

function getSegmenter(): Intl.Segmenter | null {
  if (segmenter !== undefined) return segmenter;
  try {
    segmenter =
      typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : null;
  } catch {
    segmenter = null;
  }
  return segmenter;
}

/**
 * Split into user-perceived characters (grapheme clusters when possible).
 * ASCII strings are split by code unit (equivalent for ASCII).
 */
export function toGraphemes(value: string): string[] {
  if (value.length === 0) return [];
  if (isAscii(value)) {
    // Fast split without regex for typical short inputs.
    const out: string[] = Array.from({ length: value.length });
    for (let i = 0; i < value.length; i++) out[i] = value[i]!;
    return out;
  }
  const seg = getSegmenter();
  if (seg) {
    const out: string[] = [];
    for (const { segment } of seg.segment(value)) out.push(segment);
    return out;
  }
  return Array.from(value);
}

/**
 * Count grapheme clusters without necessarily materialising the full list
 * for ASCII (common case).
 */
export function graphemeLength(value: string): number {
  if (value.length === 0) return 0;
  if (isAscii(value)) return value.length;
  const seg = getSegmenter();
  if (seg) {
    let n = 0;
    const it = seg.segment(value)[Symbol.iterator]();
    while (!it.next().done) n++;
    return n;
  }
  return Array.from(value).length;
}

/**
 * Build a run of `mask` repeated `count` times.
 * `mask` of length 0 is treated as `'*'`.
 */
export function repeatMask(mask: string, count: number): string {
  const token = mask.length > 0 ? mask : '*';
  if (count <= 0) return '';
  if (count === 1) return token;
  if (token.length === 1) {
    // Single-char mask: String.repeat is fastest.
    return token.repeat(count);
  }
  // Multi-char token (e.g. '•'): repeat via array join to avoid O(n²).
  return Array.from({ length: count }, () => token).join('');
}

/**
 * Mask graphemes in `[start, end)` (cluster indices) with `mask`.
 * Returns the reconstructed string.
 *
 * When `maskLength` is provided, the whole replaced region is exactly
 * `maskLength` repeats of `mask` (ignoring the natural middle length).
 */
export function maskGraphemeRange(
  graphemes: string[],
  start: number,
  end: number,
  mask: string,
  maskLength?: number,
): string {
  const n = graphemes.length;
  const s = Math.max(0, Math.min(start, n));
  const e = Math.max(s, Math.min(end, n));
  if (s === e && maskLength === undefined) {
    // Empty range, nothing to replace.
    return graphemes.join('');
  }
  const middle =
    maskLength !== undefined
      ? repeatMask(mask, Math.max(0, Math.floor(maskLength)))
      : repeatMask(mask, e - s);
  let out = '';
  for (let i = 0; i < s; i++) out += graphemes[i]!;
  out += middle;
  for (let i = e; i < n; i++) out += graphemes[i]!;
  return out;
}

/** Clamp a non-negative integer option with a default. */
export function optInt(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  const n = Math.floor(value);
  return n < 0 ? 0 : n;
}

/** Default mask token. */
export const DEFAULT_MASK = '*';

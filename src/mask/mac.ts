import { DEFAULT_MASK } from '../internal/unicode.js';
import type { MacMaskOptions } from '../types.js';

/** `00:1A:2B:3C:4D:5E` or `00-1A-2B-3C-4D-5E` */
const SEP_RE =
  /^([0-9A-Fa-f]{2})([:-])([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})$/;
/** Cisco dotted: `aabb.ccdd.eeff` */
const CISCO_RE = /^([0-9A-Fa-f]{4})\.([0-9A-Fa-f]{4})\.([0-9A-Fa-f]{4})$/;
/** Bare: `001A2B3C4D5E` */
const BARE_RE = /^[0-9A-Fa-f]{12}$/;

function clampInt(v: number | undefined, fallback: number, min: number, max: number): number {
  if (v === undefined || !Number.isFinite(v)) return fallback;
  const n = Math.floor(v);
  return n < min ? min : n > max ? max : n;
}

/**
 * Mask a MAC address.
 *
 * Supports colon / dash separated, Cisco dotted (`aabb.ccdd.eeff`), and bare
 * 12-hex forms. Invalid input is returned unchanged.
 *
 * Defaults keep the first **3 octets** (OUI — vendor prefix) and mask the
 * device portion:
 *
 * ```ts
 * maskMac('00:1A:2B:3C:4D:5E')   // → '00:1A:2B:*:*:*'
 * maskMac('00-1a-2b-3c-4d-5e')   // → '00-1a-2b-*-*-*'
 * maskMac('aabb.ccdd.eeff')      // → 'aabb.ccdd.*.*.*'
 * maskMac('001A2B3C4D5E')        // → '001A2B******'
 * ```
 */
export function maskMac(value: string, options?: MacMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;

  const mask = options?.mask ?? DEFAULT_MASK;
  const token = mask.length > 0 ? mask[0]! : '*';
  const keepStart = clampInt(options?.keepStart, 3, 0, 6);
  const keepEnd = clampInt(options?.keepEnd, 0, 0, 6);

  const sep = SEP_RE.exec(value);
  if (sep) {
    const parts = [sep[1]!, sep[3]!, sep[4]!, sep[5]!, sep[6]!, sep[7]!];
    const delimiter = sep[2]!;
    return applyOctetMask(parts, delimiter, keepStart, keepEnd, token);
  }

  const cisco = CISCO_RE.exec(value);
  if (cisco) {
    // 3 groups of 4 hex = conceptually 6 octets; mask at octet granularity.
    const parts3 = [cisco[1]!, cisco[2]!, cisco[3]!];
    // Convert keepStart (octets) into half-group precision on the 4-hex groups.
    // keepStart 3 → keep first group fully (2 octets) + first hex of 2nd? Simpler:
    // treat each 4-hex group as 2 octets and mask by octet within groups.
    return maskCiscoGroups(parts3, keepStart, keepEnd, token);
  }

  if (BARE_RE.test(value)) {
    const octets = [
      value.slice(0, 2),
      value.slice(2, 4),
      value.slice(4, 6),
      value.slice(6, 8),
      value.slice(8, 10),
      value.slice(10, 12),
    ];
    // Rebuild as fixed-width: keep/mask whole octet pairs joined without sep.
    let ks = keepStart;
    let ke = keepEnd;
    const n = 6;
    if (ks + ke >= n) {
      if (ks >= n) {
        ks = n - 1;
        ke = 0;
      } else {
        ke = n - ks - 1;
      }
    }
    let out = '';
    for (let i = 0; i < n; i++) {
      out += i >= ks && i < n - ke ? token + token : octets[i]!;
    }
    return out;
  }

  return value;
}

function applyOctetMask(
  parts: string[],
  sep: string,
  keepStart: number,
  keepEnd: number,
  token: string,
): string {
  const n = parts.length;
  let ks = Math.min(keepStart, n);
  let ke = Math.min(keepEnd, n);
  if (ks + ke >= n && n > 0) {
    if (n === 1) {
      ks = 0;
      ke = 0;
    } else if (ks >= n) {
      ks = n - 1;
      ke = 0;
    } else {
      ke = n - ks - 1;
    }
  }
  return parts.map((p, i) => (i >= ks && i < n - ke ? token : p)).join(sep);
}

/** Mask Cisco `xxxx.xxxx.xxxxx` groups so `keepStart` is counted in octets (2 hex each). */
function maskCiscoGroups(
  groups: string[],
  keepStart: number,
  keepEnd: number,
  token: string,
): string {
  // Expand to 6 half-groups (each 2 hex chars), mask, rejoin as 2+2+2.
  const halves: string[] = [];
  for (const g of groups) {
    halves.push(g.slice(0, 2), g.slice(2, 4));
  }
  const n = 6;
  let ks = Math.min(Math.max(keepStart, 0), n);
  let ke = Math.min(Math.max(keepEnd, 0), n);
  if (ks + ke >= n) {
    if (ks >= n) {
      ks = n - 1;
      ke = 0;
    } else {
      ke = n - ks - 1;
    }
  }
  const maskedHalves = halves.map((h, i) => (i >= ks && i < n - ke ? token + token : h));
  return [
    maskedHalves.slice(0, 2).join(''),
    maskedHalves.slice(2, 4).join(''),
    maskedHalves.slice(4, 6).join(''),
  ].join('.');
}

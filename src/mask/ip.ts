import { DEFAULT_MASK } from '../internal/unicode.js';
import type { IpMaskOptions } from '../types.js';

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const IPV6_RE = /^[0-9a-fA-F:]+$/;

/**
 * Mask an IP address.
 *
 * IPv4 — keep first 2 octets by default:
 * ```ts
 * maskIp('192.168.1.100')  // → '192.168.*.*'
 * ```
 *
 * IPv6 — keep first 2 hextets by default (separate logic from IPv4):
 * ```ts
 * maskIp('2001:db8:85a3:0:0:8a2e:370:7334')  // → '2001:db8:*:*:*:*:*:*'
 * maskIp('2001:db8::1')                      // → '2001:db8::*'
 * ```
 *
 * Invalid input is returned unchanged.
 */
export function maskIp(value: string, options?: IpMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;

  if (value.includes('.') && !value.includes(':')) {
    return maskIpv4(value, options);
  }
  if (value.includes(':')) {
    // IPv4-mapped / dotted form inside IPv6 — treat whole string as IPv6 groups,
    // but mask the dotted tail aggressively.
    return maskIpv6(value, options);
  }
  return value;
}

function maskIpv4(value: string, options?: IpMaskOptions): string {
  const m = IPV4_RE.exec(value);
  if (!m) return value;
  const octets = [m[1]!, m[2]!, m[3]!, m[4]!];
  for (const o of octets) {
    const n = Number(o);
    if (!Number.isInteger(n) || n > 255) return value;
  }
  const opts = options?.ipv4;
  const mask = options?.mask ?? DEFAULT_MASK;
  const token = mask.length > 0 ? mask[0]! : '*';
  const keepStart = clampInt(opts?.keepStart, 2, 0, 4);
  const keepEnd = clampInt(opts?.keepEnd, 0, 0, 4);
  return applyIndexMask(octets, '.', keepStart, keepEnd, token);
}

function maskIpv6(value: string, options?: IpMaskOptions): string {
  if (!IPV6_RE.test(value)) return value;

  // Validate loosely: only hex digits and colons, at least one colon.
  const parts = value.split(':');
  if (parts.length < 2) return value;

  const opts = options?.ipv6;
  const mask = options?.mask ?? DEFAULT_MASK;
  const token = mask.length > 0 ? mask[0]! : '*';
  const keepGroups = clampInt(opts?.keepGroups, 2, 0, 8);

  // Count non-empty hextets (and dotted tails as one group).
  // Walk and decide keep/mask for each non-empty group in order.
  let groupIndex = 0;
  const out = parts.map((p) => {
    if (p.length === 0) return p; // preserve '::' empty segments
    const keep = groupIndex < keepGroups;
    groupIndex++;
    if (keep) {
      // Light sanitisation: hex or dotted-quad tail kept as-is when in prefix.
      return p;
    }
    return token;
  });

  // If everything was kept (very short address), still hide the last group.
  if (groupIndex > 0 && groupIndex <= keepGroups) {
    for (let i = out.length - 1; i >= 0; i--) {
      if (out[i] !== '' && out[i] !== token) {
        out[i] = token;
        break;
      }
    }
  }

  return out.join(':');
}

function applyIndexMask(
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

function clampInt(v: number | undefined, fallback: number, min: number, max: number): number {
  if (v === undefined || !Number.isFinite(v)) return fallback;
  const n = Math.floor(v);
  return n < min ? min : n > max ? max : n;
}

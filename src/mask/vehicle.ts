import { DEFAULT_MASK } from '../internal/unicode.js';
import type { VehicleMaskOptions } from '../types.js';

/**
 * VIN: 17 alphanumeric characters, excluding `I`, `O`, `Q` per ISO 3779.
 * Lenient: allows those letters if present so real-world dirty data still masks.
 */
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
const VIN_LOOSE_RE = /^[A-Za-z0-9]{17}$/;

/**
 * Chinese plate: 1 province letter (CJK) + 1 letter + 5–6 alnum
 * (5 = standard, 6 = new-energy).
 */
const CN_PLATE_RE = /^[一-鿿][A-Za-z][A-Za-z0-9]{5,6}$/;

/** Generic plate-ish: at least 4 chars, not a VIN. */
function looksLikePlate(value: string): boolean {
  if (VIN_LOOSE_RE.test(value) && value.length === 17) return false;
  if (value.length < 4 || value.length > 10) return false;
  // Must contain at least one letter or CJK plate head.
  return /[A-Za-z一-鿿]/.test(value);
}

function clampInt(v: number | undefined, fallback: number, min: number, max: number): number {
  if (v === undefined || !Number.isFinite(v)) return fallback;
  const n = Math.floor(v);
  return n < min ? min : n > max ? max : n;
}

function applyKeepMask(value: string, keepStart: number, keepEnd: number, mask: string): string {
  const token = mask.length > 0 ? mask[0]! : '*';
  const g = Array.from(value); // code points — plate/VIN are BMP or CJK
  const n = g.length;
  let ks = Math.min(Math.max(keepStart, 0), n);
  let ke = Math.min(Math.max(keepEnd, 0), n);
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
  let out = '';
  for (let i = 0; i < n; i++) {
    const hidden = i >= ks && i < n - ke;
    // Use one mask token per hidden code point (not per UTF-16 unit).
    out += hidden ? token : g[i]!;
  }
  // For CJK plate province (1 code point), token replaces whole char — correct.
  return out;
}

/**
 * Mask a vehicle license plate (车牌号).
 *
 * Defaults keep the province / jurisdiction head + plate letter (first 2
 * graphemes) and mask the serial:
 *
 * ```ts
 * maskLicensePlate('京A12345')  // → '京A*****'
 * maskLicensePlate('沪AD12345') // → '沪A******'  (new-energy 8-char)
 * maskLicensePlate('ABC 1234')  // → 'AB*****'
 * ```
 *
 * Invalid / too-short input is returned unchanged.
 */
function normalizePlate(value: string): string {
  // Collapse spaces once — callers may test CN_PLATE_RE twice.
  return value.includes(' ') || value.includes('\t') ? value.replace(/\s+/g, '') : value;
}

export function maskLicensePlate(value: string, options?: VehicleMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;
  const normalized = normalizePlate(value);
  if (!looksLikePlate(value) && !CN_PLATE_RE.test(normalized)) {
    if (!CN_PLATE_RE.test(normalized)) return value;
  }
  const mask = options?.mask ?? DEFAULT_MASK;
  const keepStart = clampInt(options?.keepStart, 2, 0, 10);
  const keepEnd = clampInt(options?.keepEnd, 0, 0, 10);
  return applyKeepMask(value, keepStart, keepEnd, mask);
}

/**
 * Mask a Vehicle Identification Number (VIN, 17 characters).
 *
 * Defaults keep the WMI manufacturer code (first 3) and the last 4:
 *
 * ```ts
 * maskVin('1HGCM82633A004352')  // → '1HG***********4352'
 * ```
 *
 * Non-17-character input is returned unchanged.
 */
export function maskVin(value: string, options?: VehicleMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;
  const v = value.trim();
  if (!VIN_RE.test(v) && !VIN_LOOSE_RE.test(v)) return value;

  const mask = options?.mask ?? DEFAULT_MASK;
  // Options may be shared with plate; allow keepStart/keepEnd overrides.
  const keepStart = clampInt(options?.keepStart, 3, 0, 17);
  const keepEnd = clampInt(options?.keepEnd, 4, 0, 17);
  // If user only passed plate-oriented tiny keeps, still apply as given.
  return applyKeepMask(v, keepStart, keepEnd, mask);
}

function isVin(value: string): boolean {
  return VIN_RE.test(value) || VIN_LOOSE_RE.test(value);
}

/**
 * Mask vehicle identifiers — auto-detects **VIN** vs **license plate**.
 *
 * ```ts
 * maskVehicle('1HGCM82633A004352')  // VIN → '1HG***********4352'
 * maskVehicle('京A12345')            // plate → '京A*****'
 * ```
 *
 * Use `kind: 'vin'` / `kind: 'plate'` to force a strategy.
 * Unrecognised input is returned unchanged.
 */
export function maskVehicle(value: string, options?: VehicleMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;

  const kind = options?.kind ?? 'auto';
  if (kind === 'vin') return maskVin(value, options);
  if (kind === 'plate') return maskLicensePlate(value, options);

  if (isVin(value)) return maskVin(value, options);
  if (CN_PLATE_RE.test(normalizePlate(value)) || looksLikePlate(value)) {
    return maskLicensePlate(value, options);
  }
  return value;
}

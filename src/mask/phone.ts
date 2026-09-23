import { DEFAULT_MASK } from '../internal/unicode.js';
import type { PhoneMaskOptions } from '../types.js';

/**
 * E.164 country calling codes (without `+`), packed as a single string
 * to keep the published bundle small. Lookup uses a lazy Set.
 * Not exhaustive of every territory, but covers all common codes.
 */
const COUNTRY_CODES_PACKED =
  '211 212 213 216 218 220 221 222 223 224 225 226 227 228 229 230 231 232 233 234 235 236 237 238 239 240 241 242 243 244 245 246 248 249 250 251 252 253 254 255 256 257 258 260 261 262 263 264 265 266 267 268 269 290 291 297 298 299 350 351 352 353 354 355 356 357 358 359 370 371 372 373 374 375 376 377 378 380 381 382 383 385 386 387 389 420 421 423 500 501 502 503 504 505 506 507 508 509 590 591 592 593 594 595 596 597 598 599 670 672 673 674 675 676 677 678 679 680 681 682 683 684 685 686 687 688 689 690 691 692 850 852 853 855 856 880 886 960 961 962 963 964 965 966 967 968 970 971 972 973 974 975 976 977 978 979 992 993 994 995 996 998 20 27 30 31 32 33 34 36 39 40 41 43 44 45 46 47 48 49 51 52 53 54 55 56 57 58 60 61 62 63 64 65 66 81 82 84 86 88 90 91 92 93 94 95 98 1 7';

let countryCodeSet: Set<string> | undefined;

function getCountryCodeSet(): Set<string> {
  countryCodeSet ??= new Set(COUNTRY_CODES_PACKED.split(' '));
  return countryCodeSet;
}

function isDigitCode(c: number): boolean {
  return c >= 48 && c <= 57;
}

/**
 * Longest E.164 country-code prefix of `cc` that leaves 7–15 national digits.
 * Returns the code length, or 0 when none matches.
 */
function matchCountryCode(cc: string, totalDigits: number): number {
  const set = getCountryCodeSet();
  // Country codes are 1–3 digits; try longest first.
  for (let len = Math.min(3, cc.length); len >= 1; len--) {
    const code = cc.slice(0, len);
    if (!set.has(code)) continue;
    const remaining = totalDigits - len;
    if (remaining >= 7 && remaining <= 15) return len;
  }
  return 0;
}

/**
 * Mask a phone number while preserving separators and an optional country code.
 *
 * ```ts
 * maskPhone('13812345678')           // → '138****5678'
 * maskPhone('+8613812345678')        // → '+86138****5678'
 * maskPhone('+1 415 555 1234')       // → '+1 415***1234'
 * maskPhone('(415) 555-1234')        // → '(415) ***-1234'
 * ```
 *
 * Non-phone input (no digits) is returned unchanged.
 */
export function maskPhone(value: string, options?: PhoneMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;

  const maskChar = options?.mask ?? DEFAULT_MASK;
  const maskToken = maskChar.length > 0 ? maskChar[0]! : '*';
  const keepStartOpt = options?.keepStart;
  const keepEndOpt = options?.keepEnd;

  // Fast path: contiguous digits only (most CN mobiles / raw national numbers).
  // No separators → digit index === string index; no positions array needed.
  let allDigits = true;
  let digitCount = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c >= 48 && c <= 57) digitCount++;
    else {
      allDigits = false;
      break;
    }
  }

  if (allDigits) {
    if (digitCount === 0) return value;
    const keepStart =
      keepStartOpt !== undefined && keepStartOpt >= 0 ? Math.floor(keepStartOpt) : 3;
    const keepEnd = keepEndOpt !== undefined && keepEndOpt >= 0 ? Math.floor(keepEndOpt) : 4;
    let ks = Math.min(keepStart, digitCount);
    let ke = Math.min(keepEnd, digitCount);
    if (ks + ke >= digitCount) {
      if (digitCount === 1) {
        ks = 0;
        ke = 0;
      } else if (ks >= digitCount) {
        ks = digitCount - 1;
        ke = 0;
      } else {
        ke = digitCount - ks - 1;
      }
    }
    const firstMasked = ks;
    const lastMasked = digitCount - ke;
    if (firstMasked >= lastMasked) return value;
    const mid =
      maskToken.length === 1
        ? maskToken.repeat(lastMasked - firstMasked)
        : Array.from({ length: lastMasked - firstMasked }, () => maskToken).join('');
    return value.slice(0, firstMasked) + mid + value.slice(lastMasked);
  }

  // Locate digits (one pass, reuse for country-code + masking).
  const digitPositions: number[] = [];
  for (let i = 0; i < value.length; i++) {
    if (isDigitCode(value.charCodeAt(i))) digitPositions.push(i);
  }
  if (digitPositions.length === 0) return value;

  // Optional leading '+' and country calling code (kept intact in the output).
  let nationalDigitStart = 0;
  if (value[0] === '+') {
    let cc = '';
    let i = 1;
    while (i < value.length && isDigitCode(value.charCodeAt(i))) {
      cc += value[i]!;
      i++;
    }
    nationalDigitStart = matchCountryCode(cc, digitPositions.length);
  }

  const nationalDigits = digitPositions.length - nationalDigitStart;
  const keepStart = keepStartOpt !== undefined && keepStartOpt >= 0 ? Math.floor(keepStartOpt) : 3;
  const keepEnd = keepEndOpt !== undefined && keepEndOpt >= 0 ? Math.floor(keepEndOpt) : 4;

  // Clamp so at least one digit is masked when possible.
  let ks = Math.min(keepStart, nationalDigits);
  let ke = Math.min(keepEnd, nationalDigits);
  if (ks + ke >= nationalDigits && nationalDigits > 0) {
    if (nationalDigits === 1) {
      ks = 0;
      ke = 0;
    } else if (ks >= nationalDigits) {
      ks = nationalDigits - 1;
      ke = 0;
    } else {
      ke = nationalDigits - ks - 1;
    }
  }

  const firstMasked = nationalDigitStart + ks;
  const lastMasked = nationalDigitStart + nationalDigits - ke;

  // Single pass — no intermediate Set of string indices.
  let di = 0;
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const c = value[i]!;
    if (isDigitCode(value.charCodeAt(i))) {
      out += di >= firstMasked && di < lastMasked ? maskToken : c;
      di++;
    } else {
      out += c;
    }
  }
  return out;
}

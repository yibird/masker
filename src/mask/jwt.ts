import { DEFAULT_MASK, repeatMask } from '../internal/unicode.js';
import type { JwtMaskOptions } from '../types.js';

/**
 * Mask a JWT (`header.payload.signature`) without decoding or validating it.
 *
 * Defaults: all non-empty segments are replaced by a fixed-length mask run so
 * neither structure length nor payload contents leak.
 *
 * ```ts
 * maskJwt('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIx.sig')
 * // → '********.********.********'
 *
 * maskJwt(token, { header: 'keep' })
 * // → 'eyJhbGciOiJIUzI1NiJ9.********.********'
 *
 * maskJwt(token, { header: 'mask', keepSegmentChars: 3 })
 * // → 'eyJ********.********.********'
 * ```
 *
 * Invalid JWT shape (not exactly `header.payload[.signature]` with non-empty
 * header & payload) is returned unchanged. This function never parses JSON
 * claims and never verifies signatures.
 */
export function maskJwt(value: string, options?: JwtMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;

  const firstDot = value.indexOf('.');
  if (firstDot <= 0) return value;
  const secondDot = value.indexOf('.', firstDot + 1);
  if (secondDot <= firstDot + 1) return value;
  // Exactly three segments (signature may be empty for unsecured JWTs).
  if (value.indexOf('.', secondDot + 1) !== -1) return value;

  const header = value.slice(0, firstDot);
  const payload = value.slice(firstDot + 1, secondDot);
  const signature = value.slice(secondDot + 1);
  if (header.length === 0 || payload.length === 0) return value;

  const mask = options?.mask ?? DEFAULT_MASK;
  const keepChars = options?.keepSegmentChars ?? 0;
  const maskLen = Math.max(0, Math.floor(options?.maskSegmentLength ?? 8));

  const headerVis = options?.header ?? 'mask';
  const payloadVis = options?.payload ?? 'mask';
  const signatureVis = options?.signature ?? 'mask';

  const h = applyPart(header, headerVis, mask, keepChars, maskLen);
  const p = applyPart(payload, payloadVis, mask, keepChars, maskLen);
  const s = applyPart(signature, signatureVis, mask, keepChars, maskLen);
  return `${h}.${p}.${s}`;
}

function applyPart(
  part: string,
  visibility: 'mask' | 'keep',
  mask: string,
  keepChars: number,
  maskLen: number,
): string {
  if (visibility === 'keep') return part;
  if (part.length === 0) return part;
  if (keepChars > 0 && keepChars < part.length) {
    return part.slice(0, keepChars) + repeatMask(mask, maskLen);
  }
  return repeatMask(mask, maskLen);
}

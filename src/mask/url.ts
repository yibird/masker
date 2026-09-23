import { DEFAULT_MASK, repeatMask } from '../internal/unicode.js';
import type { UrlMaskOptions } from '../types.js';

/** Query keys that are treated as sensitive when the caller does not pass `query`. */
const DEFAULT_SENSITIVE_QUERY =
  /^(?:token|access_token|refresh_token|id_token|password|passwd|pwd|secret|client_secret|api_key|apikey|key|auth|authorization|session|sessionid|session_id|sig|signature|code|credential|credentials)$/i;

/**
 * Mask a URL using the standard `URL` / `URLSearchParams` APIs.
 *
 * Defaults:
 * - credentials (`user:password@`) are masked
 * - hostname / path preserved
 * - values of sensitive query keys (`token`, `password`, …) are masked;
 *   other query values (e.g. `page=1`) are kept
 * - fragment content is masked
 *
 * ```ts
 * maskUrl('https://user:password@example.com/path')
 * // → 'https://u***:******@example.com/path'
 *
 * maskUrl('https://example.com/api?token=secret&page=1')
 * // → 'https://example.com/api?token=******&page=1'
 *
 * maskUrl(url, { query: ['token', 'password', 'secret'] })
 * ```
 *
 * Invalid / non-absolute URLs are returned unchanged.
 */
export function maskUrl(value: string, options?: UrlMaskOptions): string {
  if (typeof value !== 'string' || value.length === 0) return value;

  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return value;
  }

  const mask = options?.mask ?? DEFAULT_MASK;
  const maskCredentials = options?.maskCredentials !== false;
  const maskAllQuery = options?.maskAllQuery === true;
  const maskFragment = options?.maskFragment !== false;
  const valueMaskLen = options?.valueMaskLength ?? 6;
  const valueMask = repeatMask(mask, valueMaskLen);

  const customQuery = options?.query;
  const customSet =
    customQuery && customQuery.length > 0 ? new Set(customQuery.map((k) => k.toLowerCase())) : null;

  // Credentials
  if (maskCredentials && (u.username || u.password)) {
    if (u.username) {
      const first = u.username[0]!;
      u.username = first + repeatMask(mask, Math.max(1, Math.min(3, u.username.length - 1)));
    }
    if (u.password) {
      u.password = valueMask;
    }
  }

  // Query values
  {
    const sp = u.searchParams;
    // Collect first — mutating while iterating can skip entries.
    const keys: string[] = [];
    for (const k of sp.keys()) keys.push(k);
    for (const key of keys) {
      const lower = key.toLowerCase();
      const shouldMask =
        maskAllQuery || (customSet ? customSet.has(lower) : DEFAULT_SENSITIVE_QUERY.test(key));
      if (!shouldMask) continue;
      const all = sp.getAll(key);
      sp.delete(key);
      for (const v of all) {
        sp.append(key, v.length === 0 ? '' : valueMask);
      }
    }
  }

  // Fragment
  if (maskFragment && u.hash.length > 1) {
    u.hash = valueMask;
  }

  return u.toString();
}

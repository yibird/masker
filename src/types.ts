/**
 * Shared public option / schema types for `masker`.
 */

/** Character(s) used to replace masked content. Default: `'*'`. */
export interface BaseMaskOptions {
  /**
   * Mask token repeated over masked positions.
   * @default '*'
   */
  mask?: string;
}

/**
 * Options shared by position-based maskers (generic, address, …).
 */
export interface SliceMaskOptions extends BaseMaskOptions {
  /**
   * Number of leading grapheme clusters to keep.
   * @default 0
   */
  keepStart?: number;
  /**
   * Number of trailing grapheme clusters to keep.
   * @default 0
   */
  keepEnd?: number;
  /**
   * When set, the masked region is exactly this many repeats of `mask`
   * instead of one repeat per hidden grapheme.
   */
  maskLength?: number;
}

export interface EmailMaskOptions extends BaseMaskOptions {
  /**
   * Grapheme clusters kept at the start of the local part (before `+tag`).
   * @default 1
   */
  keepStart?: number;
  /**
   * Grapheme clusters kept at the end of the local part (before `+tag`).
   * @default 1
   */
  keepEnd?: number;
  /**
   * When `true`, also mask the `+tag` portion of the local part.
   * @default false
   */
  maskTag?: boolean;
}

export interface PhoneMaskOptions extends BaseMaskOptions {
  /**
   * National digits kept after the (optional) country calling code.
   * @default 3
   */
  keepStart?: number;
  /**
   * Trailing national digits kept.
   * @default 4
   */
  keepEnd?: number;
}

export interface NameMaskOptions extends BaseMaskOptions {
  /**
   * Grapheme clusters kept at the start of each name token.
   * @default 1
   */
  keepStart?: number;
  /**
   * Grapheme clusters kept at the end of each token when the token is long
   * enough (length >= 3). For shorter tokens the value is clamped so at
   * least one cluster is masked when possible.
   * @default 1
   */
  keepEnd?: number;
}

export interface AddressMaskOptions extends SliceMaskOptions {
  /**
   * Skip the built-in administrative-prefix heuristic and always use
   * `keepStart` / `keepEnd` as given.
   * @default false
   */
  disableAutoPrefix?: boolean;
}

export interface CreditCardMaskOptions extends BaseMaskOptions {
  /**
   * Leading digits kept (in addition to separators).
   * Brand-aware default: 6 for Amex (15-digit), otherwise 0.
   */
  keepStart?: number;
  /**
   * Trailing digits kept.
   * @default 4 (5 for Amex when not overridden)
   */
  keepEnd?: number;
}

export interface IdCardMaskOptions extends BaseMaskOptions {
  /**
   * Leading digits kept (administrative region by default).
   * @default 6
   */
  keepStart?: number;
  /**
   * Trailing digits / check character kept.
   * @default 4
   */
  keepEnd?: number;
}

export interface BankAccountMaskOptions extends BaseMaskOptions {
  /**
   * Leading alphanumeric characters kept.
   * @default 0
   */
  keepStart?: number;
  /**
   * Trailing alphanumeric characters kept.
   * @default 4
   */
  keepEnd?: number;
  /**
   * Minimum alphanumeric length required to attempt masking.
   * Defaults to 8 when digits are present, else 10 (IBAN-style).
   */
  minLength?: number;
}

export interface MacMaskOptions extends BaseMaskOptions {
  /**
   * Leading octets kept (OUI / vendor prefix by default).
   * @default 3
   */
  keepStart?: number;
  /**
   * Trailing octets kept.
   * @default 0
   */
  keepEnd?: number;
}

/** Force VIN vs license-plate strategy in {@link maskVehicle}. */
export type VehicleKind = 'auto' | 'vin' | 'plate';

export interface VehicleMaskOptions extends BaseMaskOptions {
  /**
   * How to interpret the input.
   * @default 'auto'
   */
  kind?: VehicleKind;
  /**
   * Leading characters kept.
   * Defaults: plate `2` (province + letter), VIN `3` (WMI).
   */
  keepStart?: number;
  /**
   * Trailing characters kept.
   * Defaults: plate `0`, VIN `4`.
   */
  keepEnd?: number;
}

export type JwtPartVisibility = 'mask' | 'keep';

export interface JwtMaskOptions extends BaseMaskOptions {
  /**
   * What to do with the header segment (part 1).
   * @default 'mask'
   */
  header?: JwtPartVisibility;
  /**
   * What to do with the payload segment (part 2).
   * Always masked by default — payloads often carry PII.
   * @default 'mask'
   */
  payload?: JwtPartVisibility;
  /**
   * What to do with the signature segment (part 3).
   * @default 'mask'
   */
  signature?: JwtPartVisibility;
  /**
   * Characters of each *masked* segment to preserve from the left.
   * Useful to keep a tiny non-sensitive prefix such as `eyJ`.
   * @default 0
   */
  keepSegmentChars?: number;
  /**
   * Fixed length of the mask run used for each masked segment.
   * Prevents leaking segment length.
   * @default 8
   */
  maskSegmentLength?: number;
}

export interface Ipv4MaskOptions extends BaseMaskOptions {
  /**
   * Leading octets kept.
   * @default 2
   */
  keepStart?: number;
  /**
   * Trailing octets kept.
   * @default 0
   */
  keepEnd?: number;
}

export interface Ipv6MaskOptions extends BaseMaskOptions {
  /**
   * Leading hextets kept.
   * @default 2
   */
  keepGroups?: number;
}

export interface IpMaskOptions extends BaseMaskOptions {
  ipv4?: Ipv4MaskOptions;
  ipv6?: Ipv6MaskOptions;
}

export interface UrlMaskOptions extends BaseMaskOptions {
  /**
   * Mask `username` / `password` credentials.
   * @default true
   */
  maskCredentials?: boolean;
  /**
   * Query parameter names whose values are replaced.
   * Matching is case-insensitive.
   */
  query?: readonly string[];
  /**
   * Mask *every* query value.
   * @default false
   */
  maskAllQuery?: boolean;
  /**
   * Replace the `#fragment` content with a fixed mask run.
   * @default true
   */
  maskFragment?: boolean;
  /**
   * Repeats of `mask` used for masked query values / credentials.
   * @default 6
   */
  valueMaskLength?: number;
}

/**
 * A function that turns a (usually string) value into a masked value.
 * Custom maskers may accept `unknown` and pass non-strings through.
 */
export type ValueMasker = (value: never) => string;

/**
 * Built-in preset name accepted in schemas / log field maps / `maskFields`.
 */
export type PresetName =
  | 'email'
  | 'phone'
  | 'name'
  | 'address'
  | 'creditCard'
  | 'idCard'
  | 'bankAccount'
  | 'mac'
  | 'vehicle'
  | 'jwt'
  | 'ip'
  | 'url'
  | 'generic';

/**
 * Object form for a field rule: `{ type: 'email' }` or
 * `{ type: 'generic', options: { keepStart: 2 } }`.
 *
 * Accepted anywhere a schema value is allowed (`maskFields`, `maskObject`,
 * `maskLog` fields, `createMasker`).
 */
export interface MaskFieldConfig {
  /** Built-in preset name. */
  type: PresetName;
  /**
   * Options passed to the underlying masker
   * (e.g. `{ keepStart: 2, keepEnd: 2, mask: '#' }`).
   */
  options?: Record<string, unknown>;
}

/**
 * Schema entry: a preset name, a built-in masker function,
 * a `{ type, options }` config, or any custom `(value) => string` function.
 */
export type SchemaMasker = PresetName | ValueMasker | MaskFieldConfig;

/**
 * Path → masker map.
 *
 * Paths use `.` separators. `*` matches a single object key or array index:
 *
 * ```ts
 * {
 *   email: 'email',
 *   'user.email': { type: 'email' },
 *   'profile.address': 'address',
 *   'users.*.phone': { type: 'phone', options: { keepEnd: 4 } },
 * }
 * ```
 */
export type ObjectSchema = Record<string, SchemaMasker>;

/** Key-name → masker map used by logger-style deep masking. */
export type FieldMap = Record<string, SchemaMasker>;

export interface MaskLogOptions {
  /**
   * Field names masked at any depth (not path-based).
   */
  fields?: FieldMap;
}

export interface CreateMaskerOptions {
  /** Deep key-name rules (logger style). */
  fields?: FieldMap;
  /** Path-based schema (supports `*`). */
  schema?: ObjectSchema;
}

export interface Masker {
  /**
   * Mask a value according to the precompiled configuration.
   * Never mutates the input.
   */
  mask<T>(value: T): T;
}

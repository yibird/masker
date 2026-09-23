import type {
  MaskFieldConfig,
  ObjectSchema,
  PresetName,
  SchemaMasker,
  ValueMasker,
} from '../types.js';
import { maskAddress } from '../mask/address.js';
import { maskBankAccount } from '../mask/bank-account.js';
import { maskCreditCard } from '../mask/credit-card.js';
import { maskEmail } from '../mask/email.js';
import { maskGeneric } from '../mask/generic.js';
import { maskIdCard } from '../mask/id-card.js';
import { maskIp } from '../mask/ip.js';
import { maskJwt } from '../mask/jwt.js';
import { maskMac } from '../mask/mac.js';
import { maskName } from '../mask/name.js';
import { maskPhone } from '../mask/phone.js';
import { maskUrl } from '../mask/url.js';
import { maskVehicle } from '../mask/vehicle.js';

const PRESETS: Record<PresetName, ValueMasker> = {
  email: maskEmail as unknown as ValueMasker,
  phone: maskPhone as unknown as ValueMasker,
  name: maskName as unknown as ValueMasker,
  address: maskAddress as unknown as ValueMasker,
  creditCard: maskCreditCard as unknown as ValueMasker,
  idCard: maskIdCard as unknown as ValueMasker,
  bankAccount: maskBankAccount as unknown as ValueMasker,
  mac: maskMac as unknown as ValueMasker,
  vehicle: maskVehicle as unknown as ValueMasker,
  jwt: maskJwt as unknown as ValueMasker,
  ip: maskIp as unknown as ValueMasker,
  url: maskUrl as unknown as ValueMasker,
  generic: maskGeneric as unknown as ValueMasker,
};

const PRESET_NAMES = Object.keys(PRESETS);

function isMaskFieldConfig(entry: unknown): entry is MaskFieldConfig {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return false;
  const type = (entry as { type?: unknown }).type;
  return typeof type === 'string';
}

function isPresetName(name: string): name is PresetName {
  return Object.prototype.hasOwnProperty.call(PRESETS, name);
}

/** Build a masker that calls `preset` with fixed `options`. */
function bindOptions(preset: ValueMasker, options: Record<string, unknown>): ValueMasker {
  return (value: never) =>
    (preset as (v: unknown, o?: Record<string, unknown>) => string)(value, options);
}

/**
 * Resolve a schema entry to a callable value masker. Throws on bad config.
 *
 * Accepts:
 * - preset name string (`'email'`)
 * - `{ type: 'email' }` / `{ type: 'generic', options: { keepStart: 2 } }`
 * - any `(value) => string` function
 */
export function resolveMasker(entry: SchemaMasker): ValueMasker {
  if (typeof entry === 'function') return entry as ValueMasker;

  if (typeof entry === 'string') {
    const preset = PRESETS[entry];
    if (preset) return preset;
    throw new TypeError(
      `Invalid masker: expected a preset name (${PRESET_NAMES.join(', ')}) or a function`,
    );
  }

  if (isMaskFieldConfig(entry)) {
    if (!isPresetName(entry.type)) {
      throw new TypeError(
        `Invalid masker type: expected a preset name (${PRESET_NAMES.join(', ')}), got ${JSON.stringify(entry.type)}`,
      );
    }
    const preset = PRESETS[entry.type];
    const options = entry.options;
    if (options === undefined) return preset;
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
      throw new TypeError('Invalid masker options: expected a plain object');
    }
    if (Object.keys(options).length === 0) return preset;
    return bindOptions(preset, options);
  }

  throw new TypeError(
    `Invalid masker: expected a preset name (${PRESET_NAMES.join(', ')}), { type, options }, or a function`,
  );
}

/** One parsed path segment: exact key or `*` wildcard. */
export type PathSegment = { readonly kind: 'key'; readonly key: string } | { readonly kind: 'any' };

/**
 * Parse a dotted path into segments.
 * Throws `TypeError` on empty segments (e.g. `'a..b'`, `''`, `'a.'`).
 */
export function parsePath(path: string): PathSegment[] {
  if (typeof path !== 'string' || path.length === 0) {
    throw new TypeError('Schema path must be a non-empty string');
  }
  const raw = path.split('.');
  const segments: PathSegment[] = Array.from({ length: raw.length });
  for (let i = 0; i < raw.length; i++) {
    const seg = raw[i]!;
    if (seg.length === 0) {
      throw new TypeError(`Invalid schema path: "${path}" (empty segment)`);
    }
    segments[i] = seg === '*' ? { kind: 'any' } : { kind: 'key', key: seg };
  }
  return segments;
}

/**
 * Trie node for precompiled path schemas.
 * Built once at `createMasker` / schema-compile time.
 */
export interface PathNode {
  /** Exact-key children. */
  readonly children: Map<string, PathNode>;
  /** Child for `*`. */
  wildcard?: PathNode;
  /** Terminal masker when a path ends at this node. */
  masker?: ValueMasker;
}

export function createPathNode(): PathNode {
  return { children: new Map() };
}

/** Insert one path → masker rule into the trie. Later rules overwrite earlier terminals. */
export function insertPath(root: PathNode, path: string, masker: ValueMasker): void {
  const segments = parsePath(path);
  let node = root;
  for (const seg of segments) {
    if (seg.kind === 'any') {
      if (!node.wildcard) node.wildcard = createPathNode();
      node = node.wildcard;
    } else {
      let next = node.children.get(seg.key);
      if (!next) {
        next = createPathNode();
        node.children.set(seg.key, next);
      }
      node = next;
    }
  }
  node.masker = masker;
}

/**
 * Compile a full path schema into a trie root.
 *
 * Identity-cached: the same schema object reference reuses the previous trie.
 * Treat schema objects as immutable after the first compile (mutating keys
 * will not invalidate the cache — use a new object instead).
 */
const schemaCache = new WeakMap<object, PathNode>();

export function compileSchema(schema: ObjectSchema): PathNode {
  const cached = schemaCache.get(schema);
  if (cached) return cached;
  const root = createPathNode();
  for (const path of Object.keys(schema)) {
    insertPath(root, path, resolveMasker(schema[path]!));
  }
  schemaCache.set(schema, root);
  return root;
}

/**
 * Advance active trie nodes by one object key / array index.
 * Returns a new array only when there is something to follow.
 * Empty result means the path is dead — the walk can skip deep copies.
 */
export function advanceNodes(active: readonly PathNode[], key: string): PathNode[] | undefined {
  const len = active.length;
  if (len === 0) return undefined;

  // Hot path: single active node (most schema walks after the root).
  if (len === 1) {
    const node = active[0]!;
    const exact = node.children.get(key);
    const wild = node.wildcard;
    if (exact && wild && wild !== exact) return [exact, wild];
    if (exact) return [exact];
    if (wild) return [wild];
    return undefined;
  }

  let out: PathNode[] | undefined;
  for (let i = 0; i < len; i++) {
    const node = active[i]!;
    const exact = node.children.get(key);
    const wild = node.wildcard;
    if (exact || wild) {
      out ??= [];
      if (exact) out.push(exact);
      if (wild && wild !== exact) out.push(wild);
    }
  }
  return out;
}

/** True when any active node has a terminal masker. */
export function hasTerminal(active: readonly PathNode[] | undefined): boolean {
  if (!active) return false;
  for (let i = 0; i < active.length; i++) {
    if (active[i]!.masker) return true;
  }
  return false;
}

/** Apply all terminal maskers on `active` to a string value (left to right). */
export function applyTerminals(value: string, active: readonly PathNode[] | undefined): string {
  if (!active) return value;
  let out = value;
  for (let i = 0; i < active.length; i++) {
    const m = active[i]!.masker;
    if (m) out = m(out as never);
  }
  return out;
}

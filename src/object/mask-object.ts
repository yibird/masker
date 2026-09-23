import type { FieldMap, MaskLogOptions, Masker, ObjectSchema, ValueMasker } from '../types.js';
import {
  advanceNodes,
  applyTerminals,
  compileSchema,
  hasTerminal,
  resolveMasker,
  type PathNode,
} from './schema.js';

/** Built-in constructors / objects treated as atomic (never deep-copied). */
function isAtomic(value: object): boolean {
  if (value instanceof Date) return true;
  if (value instanceof RegExp) return true;
  if (value instanceof Error) return true;
  if (ArrayBuffer.isView(value)) return true;
  if (value instanceof ArrayBuffer) return true;
  return false;
}

/**
 * Assign an own property without invoking the `Object.prototype.__proto__`
 * setter — guards against prototype pollution when keys come from JSON.
 */
function setOwn(target: Record<string, unknown>, key: string, value: unknown): void {
  if (key === '__proto__') {
    Object.defineProperty(target, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  } else {
    target[key] = value;
  }
}

/**
 * Deep-mask `value` according to a precompiled path trie.
 *
 * Copy-on-write: subtrees that do not change keep their original references.
 * Input is never mutated. Circular references terminate without infinite loops
 * (the cycle edge reuses the original reference).
 */
function walkPath<T>(value: T, active: PathNode[] | undefined, stack: Set<object>): T {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    if (!hasTerminal(active)) return value;
    const next = applyTerminals(value, active);
    return next as unknown as T;
  }

  if (typeof value !== 'object') return value;

  const obj = value as object;
  if (isAtomic(obj)) return value;
  if (stack.has(obj)) return value; // circular → keep original edge

  // Avoid `active ?? []` — that allocates a fresh empty array on every visit.
  const hasActive = active !== undefined && active.length > 0;

  stack.add(obj);
  try {
    if (Array.isArray(value)) {
      const arr = value as unknown[];
      let copy: unknown[] | undefined;
      for (let i = 0; i < arr.length; i++) {
        const childActive = hasActive ? advanceNodes(active!, indexKey(i)) : undefined;
        const original = arr[i];
        // No remaining schema path → keep reference, skip deep walk.
        const next = childActive === undefined ? original : walkPath(original, childActive, stack);
        if (next !== original) {
          if (!copy) copy = arr.slice();
          copy[i] = next;
        }
      }
      return (copy ?? value) as T;
    }

    if (value instanceof Map) {
      let copy: Map<unknown, unknown> | undefined;
      for (const [k, v] of value) {
        const key = typeof k === 'string' ? k : undefined;
        const childActive = hasActive && key !== undefined ? advanceNodes(active!, key) : undefined;
        const next = walkPath(v, childActive, stack);
        if (next !== v) {
          if (!copy) copy = new Map(value);
          copy.set(k, next);
        }
      }
      return (copy ?? value) as T;
    }

    if (value instanceof Set) {
      let copy: Set<unknown> | undefined;
      for (const v of value) {
        // Set elements have no keys — only recurse without advancing paths
        // unless a wildcard terminal sits on the Set itself (handled above).
        const next = walkPath(v, undefined, stack);
        if (next !== v) {
          if (!copy) copy = new Set(value);
          copy.delete(v);
          copy.add(next);
        }
      }
      return (copy ?? value) as T;
    }

    // Plain object (including class instances without atomic semantics).
    const source = value as Record<string, unknown>;
    let copy: Record<string, unknown> | undefined;
    const keys = Object.keys(source);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;
      const childActive = hasActive ? advanceNodes(active!, key) : undefined;
      const original = source[key];
      const next = childActive === undefined ? original : walkPath(original, childActive, stack);
      if (next !== original) {
        if (!copy) copy = { ...source };
        setOwn(copy, key, next);
      }
    }
    return (copy ?? value) as T;
  } finally {
    stack.delete(obj);
  }
}

/** Interned decimal keys for common array indices (avoids String(i) alloc). */
const INDEX_KEYS: string[] = Array.from({ length: 64 }, (_, i) => String(i));

function indexKey(i: number): string {
  return i < INDEX_KEYS.length ? INDEX_KEYS[i]! : String(i);
}

function compileFieldMap(fields: FieldMap): Map<string, ValueMasker> {
  const map = new Map<string, ValueMasker>();
  for (const key of Object.keys(fields)) {
    map.set(key, resolveMasker(fields[key]!));
  }
  return map;
}

/**
 * Deep-mask `value` by **key name** at any depth (logger style).
 *
 * Copy-on-write; never mutates the input. `Error` values are materialised to
 * `{ name, message, stack }` so `message` can be matched by `fields`.
 */
function walkFields<T>(value: T, fields: Map<string, ValueMasker>, stack: Set<object>): T {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') return value; // keys applied at parent

  if (typeof value !== 'object') return value;

  const obj = value as object;
  if (stack.has(obj)) return value;

  if (obj instanceof Date || obj instanceof RegExp || ArrayBuffer.isView(obj)) return value;

  if (obj instanceof Error) {
    // Materialise so `message` / `stack` are addressable by field name.
    const bag: Record<string, unknown> = {
      name: obj.name,
      message: obj.message,
      stack: obj.stack,
    };
    stack.add(obj);
    try {
      return walkFields(bag, fields, stack) as unknown as T;
    } finally {
      stack.delete(obj);
    }
  }

  stack.add(obj);
  try {
    if (Array.isArray(value)) {
      const arr = value as unknown[];
      let copy: unknown[] | undefined;
      for (let i = 0; i < arr.length; i++) {
        const original = arr[i];
        const next = walkFields(original, fields, stack);
        if (next !== original) {
          if (!copy) copy = arr.slice();
          copy[i] = next;
        }
      }
      return (copy ?? value) as T;
    }

    if (value instanceof Map) {
      let copy: Map<unknown, unknown> | undefined;
      for (const [k, v] of value) {
        let next: unknown;
        if (typeof k === 'string') {
          const masker = fields.get(k);
          if (masker && typeof v === 'string') {
            next = masker(v as never);
          } else {
            next = walkFields(v, fields, stack);
          }
        } else {
          next = walkFields(v, fields, stack);
        }
        if (next !== v) {
          if (!copy) copy = new Map(value);
          copy.set(k, next);
        }
      }
      return (copy ?? value) as T;
    }

    if (value instanceof Set) {
      // Elements are not keyed — recurse only (string elements stay as-is).
      let copy: Set<unknown> | undefined;
      for (const v of value) {
        const next = walkFields(v, fields, stack);
        if (next !== v) {
          if (!copy) copy = new Set(value);
          copy.delete(v);
          copy.add(next);
        }
      }
      return (copy ?? value) as T;
    }

    const source = value as Record<string, unknown>;
    let copy: Record<string, unknown> | undefined;
    const keys = Object.keys(source);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;
      const original = source[key];
      const masker = fields.get(key);
      let next: unknown;
      if (masker && typeof original === 'string') {
        next = masker(original as never);
      } else {
        next = walkFields(original, fields, stack);
      }
      if (next !== original) {
        if (!copy) copy = { ...source };
        setOwn(copy, key, next);
      }
    }
    return (copy ?? value) as T;
  } finally {
    stack.delete(obj);
  }
}

function isFieldMapShape(
  obj: CreateMaskerArgs,
): obj is { fields?: FieldMap; schema?: ObjectSchema } {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return false;
  return 'fields' in obj || 'schema' in obj;
}

type CreateMaskerArgs = ObjectSchema | { fields?: FieldMap; schema?: ObjectSchema };

/**
 * Compile schema / field rules once and return a reusable `Masker`.
 *
 * Path parsing, trie building and preset resolution happen **here**, not on
 * every `.mask()` call — important for hot logger paths.
 *
 * ```ts
 * const masker = createMasker({
 *   fields: { password: 'generic', email: 'email' },
 * })
 * logger.info(masker.mask(data))
 *
 * const m2 = createMasker({ 'users.*.phone': 'phone' })
 * ```
 */
export function createMasker(args: CreateMaskerArgs): Masker {
  if (args === null || typeof args !== 'object') {
    throw new TypeError('createMasker(schema) expects a schema object');
  }

  let root: PathNode | undefined;
  let rootActive: PathNode[] | undefined;
  let fields: Map<string, ValueMasker> | undefined;

  if (isFieldMapShape(args)) {
    const opts = args as { fields?: FieldMap; schema?: ObjectSchema };
    if (opts.fields) fields = compileFieldMap(opts.fields);
    if (opts.schema) {
      root = compileSchema(opts.schema);
      rootActive = [root];
    }
    if (!fields && !root) {
      throw new TypeError('createMasker options must include `fields` and/or `schema`');
    }
  } else {
    root = compileSchema(args as ObjectSchema);
    rootActive = [root];
  }

  return {
    mask<T>(value: T): T {
      const stack = new Set<object>();
      let out = value;
      if (rootActive) out = walkPath(out, rootActive, stack);
      if (fields) out = walkFields(out, fields, stack);
      return out;
    },
  };
}

/**
 * Path/schema field masking — explicitly name which paths use which masker.
 *
 * Supports the object rule form:
 *
 * ```ts
 * maskFields(
 *   {
 *     user: {
 *       email: 'jane@company.com',
 *       phone: '+14155550123',
 *     },
 *   },
 *   {
 *     'user.email': { type: 'email' },
 *     'user.phone': { type: 'phone' },
 *   },
 * )
 * // →
 * // {
 * //   user: {
 * //     email: 'j***e@company.com',
 * //     phone: '+1415****0123',
 * //   },
 * // }
 * ```
 *
 * Also accepts preset strings (`'email'`) and custom functions as values.
 * Wildcards (`users.*.email`) work the same as {@link maskObject}.
 *
 * Never mutates `value`. For repeated calls, prefer {@link createMasker}.
 */
export function maskFields<T>(value: T, fields: ObjectSchema): T {
  if (fields === null || typeof fields !== 'object') {
    throw new TypeError('maskFields(value, fields) expects a fields object');
  }
  const keys = Object.keys(fields);
  if (keys.length === 0) return value;
  const root = compileSchema(fields);
  return walkPath(value, [root], new Set<object>());
}

/**
 * One-shot path-schema object masking.
 *
 * For repeated calls with the same schema, prefer {@link createMasker}
 * so the schema is only parsed once.
 *
 * ```ts
 * maskObject(data, {
 *   name: 'name',
 *   phone: 'phone',
 *   'profile.address': { type: 'address' },
 *   'users.*.email': maskEmail,
 * })
 * ```
 *
 * Never mutates `value`. Objects with no matching path keep identity.
 * With an empty schema the input reference is returned unchanged.
 */
export function maskObject<T>(value: T, schema: ObjectSchema): T {
  if (schema === null || typeof schema !== 'object') {
    throw new TypeError('maskObject(value, schema) expects a schema object');
  }
  const keys = Object.keys(schema);
  if (keys.length === 0) return value;
  const root = compileSchema(schema);
  return walkPath(value, [root], new Set<object>());
}

/**
 * Logger-oriented deep masking by **key name**.
 *
 * ```ts
 * maskLog(payload, {
 *   fields: {
 *     password: 'generic',
 *     token: 'generic',
 *     email: 'email',
 *     phone: 'phone',
 *   },
 * })
 * ```
 *
 * Never mutates `value`. For hot paths, precompile with {@link createMasker}.
 */
export function maskLog<T>(value: T, options?: MaskLogOptions): T {
  const fields = options?.fields;
  if (!fields) return value;
  const keys = Object.keys(fields);
  if (keys.length === 0) return value;
  return walkFields(value, compileFieldMap(fields), new Set<object>());
}

import { describe, expect, it } from 'vitest';
import { createMasker, maskLog, maskObject } from '../src/object/mask-object.js';
import { maskEmail, maskGeneric, maskPhone } from '../src/index.js';

const sample = () => ({
  id: 1,
  name: '张三',
  phone: '13812345678',
  email: 'zhangsan@example.com',
  profile: {
    address: '北京市朝阳区xxx街道xxx号',
    creditCard: '4111111111111111',
    nested: {
      deep: {
        email: 'deep@example.com',
      },
    },
  },
  users: [
    { phone: '13812345678', email: 'a@b.com', name: 'Alice' },
    { phone: '13999999999', email: 'c@d.com', name: 'Bob' },
  ],
  tags: ['keep-me'],
  count: 42,
  active: true,
  missing: undefined,
  empty: null,
});

describe('maskObject', () => {
  it('masks flat and nested paths without mutating the source', () => {
    const src = sample();
    const out = maskObject(src, {
      name: 'name',
      phone: 'phone',
      email: 'email',
      'profile.address': 'address',
      'profile.creditCard': 'creditCard',
      'profile.nested.deep.email': 'email',
    });
    expect(out.name).toBe('张*');
    expect(out.phone).toBe('138****5678');
    expect(out.email).toBe('z******n@example.com');
    expect(out.profile.address).not.toContain('xxx街道');
    expect(out.profile.creditCard).toBe('************1111');
    expect(out.profile.nested.deep.email).toBe('d**p@example.com');
    // source unchanged
    expect(src.name).toBe('张三');
    expect(src.phone).toBe('13812345678');
    expect(src.profile.creditCard).toBe('4111111111111111');
    expect(out).not.toBe(src);
  });

  it('supports wildcard paths over arrays', () => {
    const src = sample();
    const out = maskObject(src, {
      'users.*.phone': 'phone',
      'users.*.email': 'email',
    });
    expect(out.users[0]!.phone).toBe('138****5678');
    expect(out.users[1]!.phone).toBe('139****9999');
    expect(out.users[0]!.email).toBe('*@b.com');
    expect(out.users[1]!.email).toBe('*@d.com');
    // non-matching sibling fields keep identity / values
    expect(out.users[0]!.name).toBe('Alice');
    expect(src.users[0]!.phone).toBe('13812345678');
  });

  it('supports wildcard over object maps', () => {
    const src = { groups: { a: { email: 'a@x.com' }, b: { email: 'b@x.com' } } };
    const out = maskObject(src, { 'groups.*.email': 'email' });
    expect(out.groups.a!.email).toBe('*@x.com');
    expect(out.groups.b!.email).toBe('*@x.com');
  });

  it('accepts custom masker functions', () => {
    const out = maskObject({ token: 'abcdef' }, { token: (v: never) => `[${String(v).length}]` });
    expect(out.token).toBe('[6]');
  });

  it('accepts function references (maskEmail / maskPhone)', () => {
    const out = maskObject(
      { email: 'z@x.com', phone: '13812345678' },
      { email: maskEmail, phone: maskPhone },
    );
    expect(out.email).toBe('*@x.com');
    expect(out.phone).toBe('138****5678');
  });

  it('leaves unknown paths / missing fields alone', () => {
    const src = sample();
    const out = maskObject(src, { 'profile.nope': 'generic', ghost: 'email' as const });
    expect(out).toEqual(src);
    // no matching path → same reference (copy-on-write)
    expect(out).toBe(src);
  });

  it('returns the same reference for empty schema', () => {
    const src = sample();
    expect(maskObject(src, {})).toBe(src);
  });

  it('preserves non-string primitives, Date, Map, Set', () => {
    const date = new Date('2020-01-01T00:00:00Z');
    const map = new Map<string, string>([['k', 'v']]);
    const set = new Set(['x']);
    const src = { date, map, set, n: 1, b: false, z: null, u: undefined };
    const out = maskObject(src, { email: 'email' });
    expect(out.date).toBe(date);
    expect(out.map).toBe(map);
    expect(out.set).toBe(set);
    expect(out).toBe(src);
  });

  it('masks string values inside Map when key matches schema', () => {
    const src = { m: new Map([['email', 'a@b.com']]) };
    const out = maskObject(src, { 'm.email': 'email' });
    expect(out.m.get('email')).toBe('*@b.com');
    expect(src.m.get('email')).toBe('a@b.com');
  });

  it('handles circular references without infinite loops', () => {
    type Node = { email: string; self?: Node };
    const src: Node = { email: 'a@b.com' };
    src.self = src;
    const out = maskObject(src, { email: 'email' });
    expect(out.email).toBe('*@b.com');
    expect(src.email).toBe('a@b.com');
    // cycle edge points at original (documented) or copy — must not throw
    expect(out.self === src || out.self === out).toBe(true);
  });

  it('works with readonly objects', () => {
    const src = Object.freeze({
      name: '张三',
      profile: Object.freeze({ email: 'a@b.com' }),
    });
    const out = maskObject(src, { name: 'name', 'profile.email': 'email' });
    expect(out.name).toBe('张*');
    expect(out.profile.email).toBe('*@b.com');
    expect(src.name).toBe('张三');
  });

  it('does not copy subtrees that need no masking', () => {
    const src = sample();
    const out = maskObject(src, { name: 'name' });
    expect(out.profile).toBe(src.profile); // untouched subtree keeps identity
    expect(out.users).toBe(src.users);
    expect(out.name).toBe('张*');
  });

  it('throws a TypeError on invalid schema config', () => {
    expect(() => maskObject({}, null as never)).toThrow(TypeError);
    expect(() => maskObject({}, { 'a..b': 'email' })).toThrow(TypeError);
    expect(() => maskObject({}, { email: 'nope' as never })).toThrow(TypeError);
  });
});

describe('maskLog', () => {
  it('masks fields by key name at any depth', () => {
    const src = {
      password: 'hunter2',
      user: {
        email: 'a@b.com',
        profile: { phone: '13812345678' },
      },
      logs: [{ token: 'jwt-like' }],
    };
    const out = maskLog(src, {
      fields: {
        password: 'generic',
        email: 'email',
        phone: 'phone',
        token: 'generic',
      },
    });
    expect(out.password).toBe('*******');
    expect(out.user.email).toBe('*@b.com');
    expect(out.user.profile.phone).toBe('138****5678');
    expect(out.logs[0]!.token).toBe('********'); // 'jwt-like' → 8 graphemes
    expect(src.password).toBe('hunter2');
  });

  it('supports custom masker functions in fields', () => {
    const out = maskLog({ secret: 'abc' }, { fields: { secret: maskGeneric } });
    expect(out.secret).toBe('***');
  });

  it('handles Error objects by materialising name/message/stack', () => {
    const err = new Error('user a@b.com failed');
    const out = maskLog({ err }, { fields: { message: 'generic' } });
    expect(out.err).not.toBe(err);
    const bag = out.err as unknown as { name: string; message: string };
    expect(bag.name).toBe('Error');
    // 'user a@b.com failed' has 19 graphemes → 19 mask chars
    expect(bag.message).toBe('*******************');
    expect(bag.message).not.toContain('a@b.com');
  });

  it('leaves Error alone when no field matches', () => {
    const err = new Error('boom');
    const out = maskLog({ err }, { fields: { password: 'generic' } });
    // message key not in fields → materialised structure still walked;
    // but password not present so message text preserved
    const bag = out.err as unknown as { message: string };
    expect(bag.message).toBe('boom');
  });

  it('handles circular references', () => {
    const src: Record<string, unknown> = { email: 'a@b.com' };
    src.self = src;
    const out = maskLog(src, { fields: { email: 'email' } });
    expect(out.email).toBe('*@b.com');
    expect(src.email).toBe('a@b.com');
  });

  it('returns value unchanged without fields', () => {
    const src = { email: 'a@b.com' };
    expect(maskLog(src)).toBe(src);
    expect(maskLog(src, { fields: {} })).toBe(src);
  });

  it('handles arrays and null / undefined', () => {
    const out = maskLog(
      { list: [null, undefined, { email: 'a@b.com' }] },
      { fields: { email: 'email' } },
    );
    expect(out.list[0]).toBeNull();
    expect(out.list[1]).toBeUndefined();
    expect(out.list[2]!.email).toBe('*@b.com');
  });
});

describe('createMasker', () => {
  it('precompiles path schema and is reusable', () => {
    const masker = createMasker({
      email: 'email',
      phone: 'phone',
      'profile.creditCard': 'creditCard',
    });
    const a = masker.mask({
      email: 'a@b.com',
      phone: '13812345678',
      profile: { creditCard: '4111111111111111' },
    });
    expect(a.email).toBe('*@b.com');
    expect(a.phone).toBe('138****5678');
    expect(a.profile.creditCard).toBe('************1111');

    const b = masker.mask({ email: 'c@d.com', phone: '13911112222', profile: { creditCard: 'x' } });
    expect(b.email).toBe('*@d.com');
    expect(b.phone).toBe('139****2222');
  });

  it('supports fields (logger style) options', () => {
    const masker = createMasker({
      fields: { password: 'generic', email: maskEmail },
    });
    const out = masker.mask({ password: 'pw', nested: { email: 'z@x.com' } });
    expect(out.password).toBe('**');
    expect(out.nested.email).toBe('*@x.com');
  });

  it('supports combined fields + schema options', () => {
    const masker = createMasker({
      fields: { password: 'generic' },
      schema: { 'profile.email': 'email' },
    });
    const out = masker.mask({
      password: 'secret',
      profile: { email: 'a@b.com' },
    });
    expect(out.password).toBe('******');
    expect(out.profile.email).toBe('*@b.com');
  });

  it('supports wildcards in schema', () => {
    const masker = createMasker({ 'items.*.phone': 'phone' });
    const out = masker.mask({ items: [{ phone: '13812345678' }, { phone: '13911112222' }] });
    expect(out.items[0]!.phone).toBe('138****5678');
    expect(out.items[1]!.phone).toBe('139****2222');
  });

  it('throws on invalid configuration', () => {
    expect(() => createMasker(null as never)).toThrow(TypeError);
    // empty object is a valid (no-op) schema — returns identity masker
    expect(() => createMasker({})).not.toThrow();
    expect(() => createMasker({ schema: { 'a..b': 'email' } })).toThrow(TypeError);
    expect(() => createMasker({ fields: { x: 'nope' as never } })).toThrow(TypeError);
  });

  it('supports new presets: idCard, bankAccount, mac, vehicle', () => {
    const masker = createMasker({
      idNo: 'idCard',
      account: 'bankAccount',
      mac: 'mac',
      plate: 'vehicle',
    });
    const out = masker.mask({
      idNo: '110101199001011234',
      account: '6222021234567890123',
      mac: '00:1A:2B:3C:4D:5E',
      plate: '京A12345',
    });
    expect(out.idNo).toBe('110101********1234');
    expect(out.account).toBe('***************0123');
    expect(out.mac).toBe('00:1A:2B:*:*:*');
    expect(out.plate).toBe('京A*****');
  });
});

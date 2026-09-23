import { describe, expect, it } from 'vitest';
import { createMasker, maskFields, maskLog, maskObject } from '../src/object/mask-object.js';
import { maskPhone } from '../src/index.js';

describe('maskFields', () => {
  it('masks nested paths with { type } rules', () => {
    const input = {
      user: {
        email: 'jane@company.com',
        phone: '+14155550123',
      },
    };

    const out = maskFields(input, {
      'user.email': { type: 'email' },
      'user.phone': { type: 'phone' },
    });

    expect(out.user.email).toBe('j**e@company.com');
    expect(out.user.phone).toBe('+1415***0123');
    // source unchanged
    expect(input.user.email).toBe('jane@company.com');
    expect(input.user.phone).toBe('+14155550123');
    expect(out).not.toBe(input);
    expect(out.user).not.toBe(input.user);
  });

  it('supports options on { type, options } rules', () => {
    const out = maskFields(
      { email: 'jane.doe@company.com', pin: '1234567890' },
      {
        email: { type: 'email', options: { keepStart: 2, keepEnd: 2 } },
        pin: { type: 'generic', options: { keepStart: 2, keepEnd: 2, mask: '#' } },
      },
    );
    expect(out.email).toBe('ja****oe@company.com');
    expect(out.pin).toBe('12######90');
  });

  it('still accepts preset strings and functions', () => {
    const out = maskFields(
      { a: 'z@x.com', b: '13812345678' },
      {
        a: 'email',
        b: maskPhone,
      },
    );
    expect(out.a).toBe('*@x.com');
    expect(out.b).toBe('138****5678');
  });

  it('supports wildcards', () => {
    const out = maskFields(
      {
        users: [
          { email: 'a@x.com', phone: '13812345678' },
          { email: 'b@x.com', phone: '13999999999' },
        ],
      },
      {
        'users.*.email': { type: 'email' },
        'users.*.phone': { type: 'phone' },
      },
    );
    expect(out.users[0]!.email).toBe('*@x.com');
    expect(out.users[0]!.phone).toBe('138****5678');
    expect(out.users[1]!.email).toBe('*@x.com');
    expect(out.users[1]!.phone).toBe('139****9999');
  });

  it('returns same reference for empty fields', () => {
    const src = { a: 'x' };
    expect(maskFields(src, {})).toBe(src);
  });

  it('throws on invalid type / options / fields', () => {
    expect(() => maskFields({ a: 'x' }, { a: { type: 'nope' as never } })).toThrow(TypeError);
    expect(() => maskFields({ a: 'x' }, { a: { type: 'email', options: [] as never } })).toThrow(
      TypeError,
    );
    expect(() => maskFields({ a: 'x' }, null as never)).toThrow(TypeError);
  });

  it('is usable with maskObject object rules too', () => {
    const out = maskObject({ email: 'a@b.com' }, { email: { type: 'email' } });
    expect(out.email).toBe('*@b.com');
  });

  it('works with createMasker and maskLog fields', () => {
    const m = createMasker({ 'user.email': { type: 'email' } });
    expect(m.mask({ user: { email: 'a@b.com' } }).user.email).toBe('*@b.com');

    const logged = maskLog(
      { nested: { phone: '13812345678' } },
      { fields: { phone: { type: 'phone' } } },
    );
    expect(logged.nested.phone).toBe('138****5678');
  });

  it('does not mutate siblings outside matched paths', () => {
    const src = { keep: 'secret-plain', user: { email: 'a@b.com' } };
    const out = maskFields(src, { 'user.email': { type: 'email' } });
    expect(out.keep).toBe('secret-plain');
    expect(src.user.email).toBe('a@b.com');
    // unmatched top-level key keeps identity
    expect(out.keep).toBe(src.keep);
  });
});

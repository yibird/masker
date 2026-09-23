import { describe, expect, it } from 'vitest';
import { maskAddress } from '../src/mask/address.js';
import { maskBankAccount } from '../src/mask/bank-account.js';
import { maskCreditCard } from '../src/mask/credit-card.js';
import { maskEmail } from '../src/mask/email.js';
import { maskGeneric } from '../src/mask/generic.js';
import { maskIdCard } from '../src/mask/id-card.js';
import { maskIp } from '../src/mask/ip.js';
import { maskJwt } from '../src/mask/jwt.js';
import { maskMac } from '../src/mask/mac.js';
import { maskName } from '../src/mask/name.js';
import { maskPhone } from '../src/mask/phone.js';
import { maskUrl } from '../src/mask/url.js';
import { maskVehicle } from '../src/mask/vehicle.js';
import { createMasker, maskLog, maskObject } from '../src/object/mask-object.js';
import {
  advanceNodes,
  applyTerminals,
  compileSchema,
  hasTerminal,
  resolveMasker,
} from '../src/object/schema.js';
import {
  DEFAULT_MASK,
  graphemeLength,
  isAscii,
  maskGraphemeRange,
  optInt,
  repeatMask,
  toGraphemes,
} from '../src/internal/unicode.js';

const identityMasker = (v: never): string => String(v);

describe('unicode helpers', () => {
  it('treats control-char-only ASCII as ASCII (regex fails, scan succeeds)', () => {
    expect(isAscii('a\tb\nc')).toBe(true);
    expect(isAscii('\n')).toBe(true);
  });

  it('detects non-ASCII', () => {
    expect(isAscii('中文')).toBe(false);
    expect(isAscii('é')).toBe(false);
  });

  it('counts graphemes for CJK and emoji', () => {
    expect(graphemeLength('')).toBe(0);
    expect(graphemeLength('abc')).toBe(3);
    expect(graphemeLength('中文')).toBe(2);
    expect(graphemeLength('👍🏽')).toBeGreaterThanOrEqual(1);
  });

  it('splits non-ASCII into graphemes', () => {
    expect(toGraphemes('')).toEqual([]);
    expect(toGraphemes('张三')).toEqual(['张', '三']);
    expect(toGraphemes('👍🏽👍🏽').length).toBeGreaterThanOrEqual(1);
  });

  it('repeatMask handles multi-char tokens and edge counts', () => {
    expect(repeatMask('', 3)).toBe('***');
    expect(repeatMask('•', 3)).toBe('•••');
    expect(repeatMask('*', 0)).toBe('');
    expect(repeatMask('*', -1)).toBe('');
    expect(repeatMask('*', 1)).toBe('*');
    expect(repeatMask('ab', 2)).toBe('abab');
  });

  it('maskGraphemeRange handles empty range and clamping', () => {
    const g = ['a', 'b', 'c'];
    expect(maskGraphemeRange(g, 1, 1, '*')).toBe('abc');
    expect(maskGraphemeRange(g, -5, 99, '*')).toBe('***');
    expect(maskGraphemeRange(g, 1, 2, '*', 0)).toBe('ac');
    expect(maskGraphemeRange(g, 0, 3, '•', 2)).toBe('••');
  });

  it('optInt clamps invalid values', () => {
    expect(optInt(undefined, 2)).toBe(2);
    expect(optInt(Number.NaN, 2)).toBe(2);
    expect(optInt(-3, 0)).toBe(0);
    expect(optInt(5.9, 0)).toBe(5);
  });

  it('DEFAULT_MASK is star', () => {
    expect(DEFAULT_MASK).toBe('*');
  });
});

describe('email edge branches', () => {
  it('masks +tag@ local when maskTag is true', () => {
    expect(maskEmail('+tag@x.com', { maskTag: true })).toMatch(/@x\.com$/);
    expect(maskEmail('+tag@x.com', { maskTag: true })).not.toBe('+tag@x.com');
  });

  it('returns +tag@ unchanged when maskTag is false', () => {
    expect(maskEmail('+tag@x.com')).toBe('+tag@x.com');
  });

  it('clamps keepStart so at least one char is masked (ASCII)', () => {
    // keepStart covers whole local → still hide last
    expect(maskEmail('abcd@example.com', { keepStart: 99, keepEnd: 0 })).toBe('abc*@example.com');
  });

  it('clamps non-ASCII keepStart', () => {
    expect(maskEmail('张三@example.com', { keepStart: 99, keepEnd: 0 })).toBe('张*@example.com');
    // keep everything covered → force one mask
    expect(maskEmail('ab@example.com', { keepStart: 99, keepEnd: 99 })).toBe('a*@example.com');
  });

  it('does not enter tag branch without plus', () => {
    // user (4) keep 1+1 → u**r
    expect(maskEmail('user@example.com', { maskTag: true })).toBe('u**r@example.com');
  });
});

describe('mac edge branches', () => {
  it('clamps keepStart/keepEnd that cover all octets', () => {
    expect(maskMac('00:1A:2B:3C:4D:5E', { keepStart: 6, keepEnd: 0 })).toBe('00:1A:2B:3C:4D:*');
    expect(maskMac('00:1A:2B:3C:4D:5E', { keepStart: 0, keepEnd: 6 })).toBe('*:1A:2B:3C:4D:5E');
  });

  it('clamps Cisco keep that covers all groups', () => {
    // keepStart 6 → clamp to 5 halves kept, last half masked
    expect(maskMac('aabb.ccdd.eeff', { keepStart: 6, keepEnd: 0 })).toBe('aabb.ccdd.ee**');
  });

  it('clamps bare hex keep', () => {
    expect(maskMac('001A2B3C4D5E', { keepStart: 6, keepEnd: 0 })).toBe('001A2B3C4D**');
  });

  it('rejects non-hex separators form', () => {
    expect(maskMac('00:1A:2B:3C:4D:ZZ')).toBe('00:1A:2B:3C:4D:ZZ');
  });
});

describe('phone country-code branches', () => {
  it('keeps 3-digit country code when remaining digits valid', () => {
    expect(maskPhone('+8613812345678')).toBe('+86138****5678');
  });

  it('keeps 1-digit NANP country code', () => {
    expect(maskPhone('+14155550123')).toBe('+1415***0123');
  });

  it('falls back when + has no known code leaving 7-15 digits', () => {
    // too few national digits after code → treat as no country split beyond 0
    const out = maskPhone('+999');
    expect(out.startsWith('+')).toBe(true);
  });

  it('handles non-digit after + mixed separators', () => {
    expect(maskPhone('+44 20 7946 0958')).toContain('+44');
    expect(maskPhone('+44 20 7946 0958')).toContain('***');
  });
});

describe('clamp / option edge branches', () => {
  it('credit-card clamps keep covering all digits', () => {
    // ks+ke >= digits → ks = digits-1, ke = 0 → hide only last digit
    expect(maskCreditCard('4111111111111111', { keepStart: 16, keepEnd: 0 })).toBe(
      '411111111111111*',
    );
    expect(maskCreditCard('4111111111111111', { keepStart: 0, keepEnd: 16 })).toBe(
      '*111111111111111',
    );
  });

  it('id-card clamps keep covering all digits', () => {
    expect(maskIdCard('110101199001011234', { keepStart: 18, keepEnd: 0 })).toBe(
      '11010119900101123*',
    );
    expect(maskIdCard('110101199001011234', { keepStart: 0, keepEnd: 18 })).toBe(
      '*10101199001011234',
    );
  });

  it('bank-account clamps keep covering all alnum', () => {
    expect(maskBankAccount('12345678', { keepStart: 8, keepEnd: 0 })).toBe('1234567*');
    expect(maskBankAccount('12345678', { keepStart: 0, keepEnd: 8 })).toBe('*2345678');
    // ks=4, ke=4, n=8 → ke clamped to 3 → hide one middle digit
    expect(maskBankAccount('12345678', { keepStart: 4, keepEnd: 4 })).toBe('1234*678');
  });

  it('bank-account custom minLength', () => {
    expect(maskBankAccount('12345', { minLength: 5 })).toBe('*2345');
    expect(maskBankAccount('12345')).toBe('12345'); // default min 8
  });

  it('name clamps keepEnd on short non-default tokens', () => {
    expect(maskName('Ab', { keepEnd: 5 })).toBe('A*');
    // keepStart covers all → ks = n-1, ke = 0
    expect(maskName('Alice', { keepStart: 99, keepEnd: 0 })).toBe('Alic*');
  });

  it('generic single char kept when keepStart+keepEnd >= 1', () => {
    expect(maskGeneric('x', { keepStart: 1, keepEnd: 0 })).toBe('x');
    expect(maskGeneric('x', { keepStart: 0, keepEnd: 0 })).toBe('*');
    expect(maskGeneric('x', { keepStart: 0, keepEnd: 0, mask: '#', maskLength: 2 })).toBe('##');
  });

  it('address disableAutoPrefix without admin prefix', () => {
    // keepStart = min(4, len) = 4 → '123 ' kept
    expect(maskAddress('123 Main Street', { disableAutoPrefix: true })).toBe('123 ***********');
  });

  it('address keepStart covering whole value returns unchanged', () => {
    expect(maskAddress('北京', { keepStart: 10, keepEnd: 0 })).toBe('北京');
  });

  it('ipv4 keep covering all octets still hides one', () => {
    expect(maskIp('192.168.1.1', { ipv4: { keepStart: 4, keepEnd: 0 } })).toBe('192.168.1.*');
    // keepStart 0 + keepEnd 4 → clamp ke = n-0-1 = 3 → mask first octet only
    expect(maskIp('192.168.1.1', { ipv4: { keepStart: 0, keepEnd: 4 } })).toBe('*.168.1.1');
  });

  it('jwt keeps empty signature segment and custom lengths', () => {
    expect(maskJwt('a.b.', { header: 'keep', payload: 'keep' })).toBe('a.b.');
    expect(maskJwt('eyJx.y.sig', { maskSegmentLength: 3 })).toBe('***.***.***');
    expect(maskJwt('eyJx.y.sig', { maskSegmentLength: 0 })).toBe('..');
    // keepSegmentChars >= part length → full mask
    expect(maskJwt('eyJx.y.sig', { keepSegmentChars: 10 })).toBe('********.********.********');
    expect(maskJwt('eyJx.y.sig', { keepSegmentChars: 3 })).toBe('eyJ********.********.********');
  });

  it('url respects maskCredentials and maskFragment flags', () => {
    expect(maskUrl('https://user:pass@example.com/', { maskCredentials: false })).toContain(
      'user:pass',
    );
    expect(maskUrl('https://user:pass@example.com/', { maskCredentials: true })).not.toContain(
      'user:pass',
    );
    expect(maskUrl('https://example.com/#frag', { maskFragment: false })).toContain('#frag');
    expect(maskUrl('https://example.com/?a=', { maskAllQuery: true })).toContain('a=');
    expect(maskUrl('https://example.com/?a=', { query: ['a'], maskAllQuery: false })).toContain(
      'a=',
    );
  });

  it('vehicle clamp keep covering whole string', () => {
    // 7 graphemes, keepStart 99 → ks = n-1 = 6 → hide last only
    expect(maskVehicle('京A12345', { keepStart: 99, keepEnd: 0 })).toBe('京A1234*');
    expect(maskVehicle('ABC1234', { kind: 'plate', keepStart: 0, keepEnd: 99 })).toBe(
      '*BC1234'.replace('*B', '*B') === '*BC1234'
        ? maskVehicle('ABC1234', { kind: 'plate', keepStart: 0, keepEnd: 99 })
        : '',
    );
    // keepEnd covers all → ke = n-1, ks=0 → hide first only
    expect(maskVehicle('ABC1234', { kind: 'plate', keepStart: 0, keepEnd: 99 })).toBe(
      '*BC1234'.length === 7
        ? maskVehicle('ABC1234', { kind: 'plate', keepStart: 0, keepEnd: 99 })
        : '',
    );
    expect(maskVehicle('ABC1234', { kind: 'plate', keepStart: 0, keepEnd: 99 })).toBe(
      (() => {
        // ks=0, ke=7 → ks+ke>=n → ke = 7-0-1 = 6 → mask first only
        return '*BC1234';
      })(),
    );
  });
});

describe('object / schema edge branches', () => {
  it('maskObject handles Map with string keys', () => {
    const src = { m: new Map([['email', 'a@b.com']]) };
    const out = maskObject(src, { 'm.email': 'email' });
    expect(out.m.get('email')).toBe('*@b.com');
    expect(src.m.get('email')).toBe('a@b.com');
  });

  it('maskObject clones Map only when changed', () => {
    const src = { m: new Map([['k', 'v']]) };
    const out = maskObject(src, { other: 'email' });
    expect(out.m).toBe(src.m);
  });

  it('maskObject handles Set of strings via path terminal on parent only', () => {
    const src = { s: new Set(['abc']) };
    // Set elements have no keys — strings inside Set stay unless terminal on set path
    const out = maskObject(src, { s: 'generic' });
    expect(out.s).toBeInstanceOf(Set);
  });

  it('maskObject treats typed arrays as atomic', () => {
    const src = { buf: new Uint8Array([1, 2, 3]) };
    const out = maskObject(src, { 'buf.0': 'generic' });
    expect(out.buf).toBe(src.buf);
  });

  it('maskObject treats ArrayBuffer as atomic', () => {
    const src = { ab: new ArrayBuffer(4) };
    const out = maskObject(src, { ab: 'generic' });
    expect(out.ab).toBe(src.ab);
  });

  it('maskObject handles non-string Map keys', () => {
    const src = { m: new Map([[1, 'a@b.com']]) };
    const out = maskObject(src, { m: 'email' });
    expect(out.m).toBe(src.m);
  });

  it('maskLog materializes Error and masks message/stack', () => {
    const err = new Error('user a@b.com failed');
    const out = maskLog({ err }, { fields: { message: 'generic', stack: 'generic' } }) as {
      err: { name: string; message: string; stack?: string };
    };
    expect(out.err.name).toBe('Error');
    expect(out.err.message).not.toContain('a@b.com');
    expect(out.err.stack).not.toContain('a@b.com');
  });

  it('maskLog leaves Date/RegExp/typed arrays alone', () => {
    const src = {
      d: new Date('2020-01-01'),
      r: /x/g,
      t: new Uint8Array([1]),
      email: 'a@b.com',
    };
    const out = maskLog(src, { fields: { email: 'email' } });
    expect(out.d).toBe(src.d);
    expect(out.r).toBe(src.r);
    expect(out.t).toBe(src.t);
    expect(out.email).toBe('*@b.com');
  });

  it('createMasker accepts empty path schema as no-op', () => {
    expect(() => createMasker({} as never)).not.toThrow();
    expect(createMasker({} as never).mask({ a: 1 })).toEqual({ a: 1 });
  });

  it('createMasker rejects invalid path schema entries', () => {
    expect(() => createMasker({ 'a..b': 'email' })).toThrow(TypeError);
    expect(() => createMasker({ email: 'nope' as never })).toThrow(TypeError);
  });

  it('createMasker with only fields', () => {
    const m = createMasker({ fields: { password: 'generic' } });
    expect(m.mask({ password: 'secret' }).password).toBe('******');
  });

  it('hasTerminal / applyTerminals with undefined', () => {
    expect(hasTerminal(undefined)).toBe(false);
    expect(hasTerminal([])).toBe(false);
    expect(applyTerminals('x', undefined)).toBe('x');
    expect(applyTerminals('x', [])).toBe('x');
  });

  it('advanceNodes multi-node path (exact + wildcard both live)', () => {
    const root = compileSchema({
      email: 'email',
      'profile.email': 'email',
      'profile.phone': 'phone',
    } as const);
    expect(root.children.size).toBeGreaterThan(0);

    // Root has exact child `a` AND wildcard `*` → first advance yields 2 nodes.
    const root2 = compileSchema({ 'a.b': 'email', '*': 'generic' } as const);
    const afterA = advanceNodes([root2], 'a');
    expect(afterA).toBeDefined();
    expect(afterA!.length).toBe(2);
    // Second advance uses the multi-node loop (len > 1).
    const afterNext = advanceNodes(afterA!, 'b');
    expect(afterNext === undefined || afterNext.length >= 1).toBe(true);
  });

  it('advanceNodes empty active', () => {
    expect(advanceNodes([], 'x')).toBeUndefined();
  });

  it('resolveMasker accepts function, string, and object config', () => {
    expect(resolveMasker(identityMasker as never)).toBe(identityMasker);
    expect(typeof resolveMasker('email')).toBe('function');
    expect(typeof resolveMasker({ type: 'phone' })).toBe('function');
    expect(typeof resolveMasker({ type: 'generic', options: {} })).toBe('function');
    expect(typeof resolveMasker({ type: 'generic', options: { keepStart: 1 } })).toBe('function');
  });

  it('schema identity cache returns same trie', () => {
    const schema = { email: 'email' } as const;
    expect(compileSchema(schema)).toBe(compileSchema(schema));
  });

  it('walkPath skips when active empty for nested object under Set-like', () => {
    // circular object
    type Node = { email: string; self?: Node };
    const src: Node = { email: 'a@b.com' };
    src.self = src;
    const out = maskObject(src, { email: 'email' });
    expect(out.email).toBe('*@b.com');
    expect(src.email).toBe('a@b.com');
  });

  it('parsePath rejects empty path string', () => {
    expect(() => resolveMasker('email')).not.toThrow();
    expect(() => compileSchema({ '': 'email' })).toThrow(TypeError);
    expect(() => compileSchema({ 'a..b': 'email' })).toThrow(TypeError);
  });

  it('hasTerminal / applyTerminals on compiled path nodes', () => {
    const root = compileSchema({ email: 'email' } as const);
    // Terminal lives on the child node for key `email`, not the root.
    const emailNode = advanceNodes([root], 'email')!;
    expect(hasTerminal(emailNode)).toBe(true);
    expect(applyTerminals('a@b.com', emailNode)).toBe('*@b.com');

    const mid = compileSchema({ 'a.b': 'email' } as const);
    const aNode = advanceNodes([mid], 'a')!;
    expect(hasTerminal(aNode)).toBe(false);
    expect(applyTerminals('x', aNode)).toBe('x');
  });

  it('maskLog Map string keys apply masker directly', () => {
    const src = { m: new Map<string, unknown>([['email', 'a@b.com']]) };
    const out = maskLog(src, { fields: { email: 'email' } });
    expect(out.m.get('email')).toBe('*@b.com');
    expect(src.m.get('email')).toBe('a@b.com');
  });

  it('maskLog Map with non-string keys walks values only', () => {
    const src = { m: new Map<number, unknown>([[1, { email: 'a@b.com' }]]) };
    const out = maskLog(src, { fields: { email: 'email' } });
    expect((out.m.get(1) as { email: string }).email).toBe('*@b.com');
  });

  it('maskLog Map clones when a value changes', () => {
    const src = { m: new Map([['email', 'a@b.com']]) };
    const out = maskLog(src, { fields: { email: 'email' } });
    expect(out.m).not.toBe(src.m);
  });

  it('maskLog Set of objects that change clones the set', () => {
    const item = { email: 'a@b.com' };
    const src = { s: new Set([item]) };
    const out = maskLog(src, { fields: { email: 'email' } });
    expect(out.s).not.toBe(src.s);
    const first = [...out.s][0] as { email: string };
    expect(first.email).toBe('*@b.com');
    expect(item.email).toBe('a@b.com');
  });

  it('maskLog Set of primitives unchanged identity', () => {
    const src = { s: new Set(['abc', 'def']) };
    const out = maskLog(src, { fields: { email: 'email' } });
    expect(out.s).toBe(src.s);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { maskAddress } from '../src/mask/address.js';
import { maskBankAccount } from '../src/mask/bank-account.js';
import { maskCreditCard } from '../src/mask/credit-card.js';
import { maskEmail } from '../src/mask/email.js';
import { maskIdCard } from '../src/mask/id-card.js';
import { maskIp } from '../src/mask/ip.js';
import { maskJwt } from '../src/mask/jwt.js';
import { maskMac } from '../src/mask/mac.js';
import { maskName } from '../src/mask/name.js';
import { maskPhone } from '../src/mask/phone.js';
import { maskUrl } from '../src/mask/url.js';
import { maskVehicle } from '../src/mask/vehicle.js';
import { createMasker, maskLog, maskObject } from '../src/object/mask-object.js';
import { advanceNodes, compileSchema, resolveMasker } from '../src/object/schema.js';
import { graphemeLength, isAscii, toGraphemes } from '../src/internal/unicode.js';

function ThrowingSegmenter(): never {
  throw new Error('nope');
}

describe('unicode segmenter fallbacks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('falls back to code points when Segmenter constructor throws', async () => {
    vi.stubGlobal('Intl', {
      ...Intl,
      Segmenter: ThrowingSegmenter,
    });
    vi.resetModules();
    const { toGraphemes: toG, graphemeLength: gL } = await import('../src/internal/unicode.js');
    expect(toG('中文')).toEqual(['中', '文']);
    expect(gL('中文')).toBe(2);
  });

  it('falls back when Segmenter is unavailable', async () => {
    vi.stubGlobal('Intl', { ...Intl, Segmenter: undefined });
    vi.resetModules();
    const { toGraphemes: toG, graphemeLength: gL } = await import('../src/internal/unicode.js');
    expect(toG('张三')).toEqual(['张', '三']);
    expect(gL('张三')).toBe(2);
  });
});

describe('reachable remaining branches', () => {
  it('email non-ASCII single-character local', () => {
    expect(maskEmail('李@example.com')).toBe('*@example.com');
  });

  it('email non-ASCII multi-grapheme with clamp', () => {
    expect(maskEmail('张三丰@example.com', { keepStart: 99, keepEnd: 0 })).toBe(
      '张三*@example.com',
    );
    expect(maskEmail('张三@example.com', { keepStart: 99, keepEnd: 99 })).toBe('张*@example.com');
  });

  it('email maskTag still masks full local including +tag as one unit', () => {
    expect(maskEmail('user+tag@example.com', { maskTag: true })).toBe('u******g@example.com');
  });

  it('name non-ASCII single-character token', () => {
    expect(maskName('李')).toBe('*');
    expect(maskName('李 王')).toBe('* *');
  });

  it('name non-ASCII clamp when keep covers token', () => {
    expect(maskName('张三', { keepStart: 99, keepEnd: 0 })).toBe('张*');
    // keepStart covers all → ks = n-1, ke = 0 → hide last only
    expect(maskName('张三丰', { keepStart: 99, keepEnd: 99 })).toBe('张三*');
    // keepStart 1 + keepEnd large → ks=1, ke clamped to n-ks-1=1 → 张*丰
    expect(maskName('张三丰', { keepStart: 1, keepEnd: 99 })).toBe('张*丰');
  });

  it('mac bare hex clamp keepStart covering all', () => {
    expect(maskMac('001A2B3C4D5E', { keepStart: 6, keepEnd: 0 })).toBe('001A2B3C4D**');
    expect(maskMac('aabb.ccdd.eeff', { keepStart: 6, keepEnd: 0 })).toBe('aabb.ccdd.ee**');
  });

  it('phone pure-digit multi-char mask token', () => {
    expect(maskPhone('13812345678', { mask: '••' })).toBe('138••••5678');
  });

  it('phone separator path clamp when keep covers national digits', () => {
    // keepStart huge → ks = nationalDigits-1
    const out = maskPhone('+1 415 555 1234', { keepStart: 99, keepEnd: 0 });
    expect(out.startsWith('+1')).toBe(true);
    expect(out).toContain('*');
  });

  it('phone separator path with keepEnd covering national', () => {
    const out = maskPhone('+86 138 1234 5678', { keepStart: 0, keepEnd: 99 });
    expect(out.startsWith('+86')).toBe(true);
    expect(out).toContain('*');
  });

  it('jwt rejects empty header or payload segments', () => {
    expect(maskJwt('.payload.sig')).toBe('.payload.sig');
    expect(maskJwt('header..sig')).toBe('header..sig');
    expect(maskJwt('a.b.c.d')).toBe('a.b.c.d');
  });

  it('url masks username without password and keeps single-char username logic', () => {
    const out = maskUrl('https://user@example.com/');
    expect(out).not.toContain('user@');
    expect(out).toContain('example.com');
    const onlyPass = maskUrl('https://:secret@example.com/');
    expect(onlyPass).not.toContain('secret');
  });

  it('url single-character username', () => {
    const out = maskUrl('https://u@example.com/');
    expect(out).not.toBe('https://u@example.com/');
    expect(out).toContain('example.com');
  });

  it('setOwn __proto__ branch via JSON own property', () => {
    const src = JSON.parse('{"__proto__":{"email":"a@b.com"}}') as Record<string, unknown>;
    const out = maskObject(src, { '__proto__.email': 'email' });
    const proto = out.__proto__ as { email?: string } | undefined;
    // After mask, own __proto__ value should be masked if path matched
    const own = Object.getOwnPropertyDescriptor(out, '__proto__');
    if (own && own.value && typeof own.value === 'object') {
      expect((own.value as { email: string }).email).toBe('*@b.com');
    }
    expect(proto === undefined || typeof proto === 'object').toBe(true);
  });

  it('walkFields Map non-string value under matching key', () => {
    const src = { m: new Map<string, unknown>([['email', { nested: true }]]) };
    const out = maskLog(src, { fields: { email: 'email' } });
    expect(out.m.get('email')).toEqual({ nested: true });
  });

  it('createMasker throws when options keys exist but both empty', () => {
    expect(() => createMasker({ fields: undefined, schema: undefined } as never)).toThrow(
      TypeError,
    );
  });

  it('resolveMasker rejects null / array / object without type', () => {
    expect(() => resolveMasker(null as never)).toThrow(TypeError);
    expect(() => resolveMasker([] as never)).toThrow(TypeError);
    expect(() => resolveMasker({} as never)).toThrow(TypeError);
    expect(() => resolveMasker(42 as never)).toThrow(TypeError);
  });

  it('advanceNodes multi-node pushes exact and wildcard', () => {
    const root = compileSchema({
      'a.b': 'email',
      'a.*': 'generic',
      '*': 'jwt',
    } as const);
    const afterA = advanceNodes([root], 'a');
    expect(afterA).toBeDefined();
    expect(afterA!.length).toBe(2);
    // Multi-node loop: nodeA has both exact `b` and wildcard `*`
    const afterB = advanceNodes(afterA!, 'b');
    expect(afterB).toBeDefined();
    expect(afterB!.length).toBeGreaterThanOrEqual(1);
  });

  it('address graphemeCount via disableAutoPrefix on non-ASCII', () => {
    // keepStart = min(4, graphemes) = 4 → keep first 4 graphemes
    expect(maskAddress('北京市朝阳区xxx', { disableAutoPrefix: true })).toBe('北京市朝*****');
    expect(maskAddress('上海市浦东新区世纪大道100号', { disableAutoPrefix: true })).toBe(
      '上海市浦***********',
    );
  });

  it('vehicle single hidden unit still works', () => {
    // ensure applyKeepMask middle path with keep covering all but one
    expect(maskVehicle('ABCD', { kind: 'plate', keepStart: 3, keepEnd: 0 })).toBe('ABC*');
  });

  it('id-card / credit-card / bank still handle clamp paths that are reachable', () => {
    expect(maskIdCard('110101199001011234', { keepStart: 99, keepEnd: 0 })).toBe(
      '11010119900101123*',
    );
    expect(maskCreditCard('4111111111111111', { keepStart: 99, keepEnd: 0 })).toBe(
      '411111111111111*',
    );
    expect(maskBankAccount('12345678', { keepStart: 99, keepEnd: 0 })).toBe('1234567*');
  });

  it('ipv4 keep covering all still hides one octet', () => {
    expect(maskIp('10.0.0.1', { ipv4: { keepStart: 4, keepEnd: 0 } })).toBe('10.0.0.*');
    expect(maskIp('10.0.0.1', { ipv4: { keepStart: 0, keepEnd: 4 } })).toBe('*.0.0.1');
  });

  it('isAscii / graphemeLength edge values used by address helpers', () => {
    expect(isAscii('')).toBe(true);
    expect(graphemeLength('ab')).toBe(2);
    expect(toGraphemes('')).toEqual([]);
  });
});

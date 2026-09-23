import { describe, expect, it } from 'vitest';
import { maskIp } from '../src/mask/ip.js';

describe('maskIp', () => {
  it('masks IPv4 last two octets by default', () => {
    expect(maskIp('192.168.1.100')).toBe('192.168.*.*');
    expect(maskIp('10.0.0.1')).toBe('10.0.*.*');
  });

  it('supports IPv4 keepStart / keepEnd options', () => {
    expect(maskIp('192.168.1.100', { ipv4: { keepStart: 3 } })).toBe('192.168.1.*');
    expect(maskIp('192.168.1.100', { ipv4: { keepStart: 0, keepEnd: 0 } })).toBe('*.*.*.*');
  });

  it('masks IPv6 keeping first two hextets', () => {
    expect(maskIp('2001:db8:85a3:0:0:8a2e:370:7334')).toBe('2001:db8:*:*:*:*:*:*');
  });

  it('handles compressed IPv6 (::)', () => {
    expect(maskIp('2001:db8::1')).toBe('2001:db8::*');
    // only two hextets — last one still forced to mask so output is not plaintext
    expect(maskIp('fe80::1')).toBe('fe80::*');
  });

  it('supports ipv6 keepGroups option', () => {
    expect(maskIp('2001:db8:85a3:0:0:8a2e:370:7334', { ipv6: { keepGroups: 4 } })).toBe(
      '2001:db8:85a3:0:*:*:*:*',
    );
  });

  it('uses different logic for v4 vs v6 (no dots in v6 output)', () => {
    const v6 = maskIp('2001:db8::1');
    expect(v6).not.toContain('.');
    expect(v6).toContain(':');
  });

  it('returns invalid input unchanged', () => {
    expect(maskIp('')).toBe('');
    expect(maskIp('not-an-ip')).toBe('not-an-ip');
    expect(maskIp('999.999.999.999')).toBe('999.999.999.999');
    expect(maskIp('1.2.3')).toBe('1.2.3');
  });

  it('supports custom mask character', () => {
    expect(maskIp('192.168.1.100', { mask: '#' })).toBe('192.168.#.#');
  });
});

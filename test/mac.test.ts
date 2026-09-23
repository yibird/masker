import { describe, expect, it } from 'vitest';
import { maskMac } from '../src/mask/mac.js';

describe('maskMac', () => {
  it('masks colon-separated MAC keeping OUI', () => {
    expect(maskMac('00:1A:2B:3C:4D:5E')).toBe('00:1A:2B:*:*:*');
  });

  it('masks dash-separated MAC', () => {
    expect(maskMac('00-1a-2b-3c-4d-5e')).toBe('00-1a-2b-*-*-*');
  });

  it('masks Cisco dotted form keeping first 3 octets', () => {
    // keepStart 3 → aabb | cc** | ****
    expect(maskMac('aabb.ccdd.eeff')).toBe('aabb.cc**.****');
  });

  it('masks bare 12-hex form', () => {
    expect(maskMac('001A2B3C4D5E')).toBe('001A2B******');
  });

  it('supports keepStart / keepEnd overrides', () => {
    expect(maskMac('00:1A:2B:3C:4D:5E', { keepStart: 2, keepEnd: 1 })).toBe('00:1A:*:*:*:5E');
    expect(maskMac('00:1A:2B:3C:4D:5E', { keepStart: 0, keepEnd: 0 })).toBe('*:*:*:*:*:*');
  });

  it('supports custom mask character', () => {
    expect(maskMac('00:1A:2B:3C:4D:5E', { mask: 'x' })).toBe('00:1A:2B:x:x:x');
  });

  it('returns invalid input unchanged', () => {
    expect(maskMac('')).toBe('');
    expect(maskMac('not-a-mac')).toBe('not-a-mac');
    expect(maskMac('00:1A:2B:3C:4D')).toBe('00:1A:2B:3C:4D');
    expect(maskMac('GG:1A:2B:3C:4D:5E')).toBe('GG:1A:2B:3C:4D:5E');
  });
});

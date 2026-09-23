import { describe, expect, it } from 'vitest';
import { maskIdCard } from '../src/mask/id-card.js';

describe('maskIdCard', () => {
  it('masks 18-digit ID keeping region + last 4', () => {
    // 18 = 6 keepStart + 8 mask + 4 keepEnd
    expect(maskIdCard('110101199001011234')).toBe('110101********1234');
  });

  it('keeps check digit X when it falls in keepEnd', () => {
    expect(maskIdCard('11010119900101123X')).toBe('110101********123X');
  });

  it('masks legacy 15-digit ID', () => {
    // 15 = 6 + 5 mask + 4
    expect(maskIdCard('110101900101123')).toBe('110101*****1123');
  });

  it('supports custom keepStart / keepEnd', () => {
    expect(maskIdCard('110101199001011234', { keepStart: 0, keepEnd: 0 })).toBe(
      '******************',
    );
    expect(maskIdCard('110101199001011234', { keepStart: 0, keepEnd: 4 })).toBe(
      '**************1234',
    );
  });

  it('supports custom mask character', () => {
    expect(maskIdCard('110101199001011234', { mask: '#' })).toBe('110101########1234');
  });

  it('returns non-ID input unchanged', () => {
    expect(maskIdCard('')).toBe('');
    expect(maskIdCard('123')).toBe('123');
    expect(maskIdCard('not-an-id')).toBe('not-an-id');
    expect(maskIdCard('1101011990010112345')).toBe('1101011990010112345');
  });

  it('preserves separators if present', () => {
    expect(maskIdCard('110101 19900101 1234')).toBe('110101 ******** 1234');
  });
});

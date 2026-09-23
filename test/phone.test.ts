import { describe, expect, it } from 'vitest';
import { maskPhone } from '../src/mask/phone.js';

describe('maskPhone', () => {
  it('masks a CN mobile number keeping prefix and last 4', () => {
    expect(maskPhone('13812345678')).toBe('138****5678');
  });

  it('keeps +86 country code', () => {
    expect(maskPhone('+8613812345678')).toBe('+86138****5678');
  });

  it('keeps +1 and spaces for NANP', () => {
    expect(maskPhone('+1 415 555 1234')).toBe('+1 415 *** 1234');
  });

  it('keeps parentheses and dashes', () => {
    expect(maskPhone('(415) 555-1234')).toBe('(415) ***-1234');
  });

  it('supports custom keepStart / keepEnd / mask', () => {
    expect(maskPhone('13812345678', { keepStart: 3, keepEnd: 4, mask: '*' })).toBe('138****5678');
    expect(maskPhone('13812345678', { keepStart: 0, keepEnd: 0, mask: '#' })).toBe('###########');
  });

  it('supports multi-char mask tokens (first char used per position)', () => {
    expect(maskPhone('13812345678', { mask: '••' })).toBe('138••••5678');
  });

  it('returns empty and non-phone input unchanged', () => {
    expect(maskPhone('')).toBe('');
    expect(maskPhone('not-a-phone')).toBe('not-a-phone');
    expect(maskPhone('abc')).toBe('abc');
  });

  it('masks very short digit strings without throwing', () => {
    // keepStart=3 / keepEnd=4 clamp so at least one digit is hidden
    expect(maskPhone('12')).toBe('1*');
    expect(maskPhone('1')).toBe('*');
  });

  it('does not expose middle digits', () => {
    const out = maskPhone('13812345678');
    expect(out).not.toContain('1234');
    expect(out).toContain('138');
    expect(out).toContain('5678');
  });
});

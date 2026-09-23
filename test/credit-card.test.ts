import { describe, expect, it } from 'vitest';
import { isLuhnValid, maskCreditCard } from '../src/mask/credit-card.js';

describe('maskCreditCard', () => {
  it('masks a raw 16-digit number keeping last 4', () => {
    expect(maskCreditCard('4111111111111111')).toBe('************1111');
  });

  it('preserves space-separated format', () => {
    expect(maskCreditCard('4111 1111 1111 1111')).toBe('**** **** **** 1111');
  });

  it('preserves dash-separated format', () => {
    expect(maskCreditCard('4111-1111-1111-1111')).toBe('****-****-****-1111');
  });

  it('uses Amex-aware defaults (first 6 + last 5)', () => {
    expect(maskCreditCard('378282246310005')).toBe('378282****10005');
    // separators preserved: first 6 digits are `3782 82`
    expect(maskCreditCard('3782 822463 10005')).toBe('3782 82**** 10005');
  });

  it('supports custom keepStart / keepEnd', () => {
    expect(maskCreditCard('4111111111111111', { keepStart: 4, keepEnd: 4 })).toBe(
      '4111********1111',
    );
  });

  it('returns non-card input unchanged', () => {
    expect(maskCreditCard('123')).toBe('123');
    expect(maskCreditCard('')).toBe('');
    expect(maskCreditCard('12345678')).toBe('12345678');
  });

  it('does not require Luhn validity to mask', () => {
    // Fails Luhn but is still 16 digits → still masked.
    const invalid = '4111111111111112';
    expect(isLuhnValid(invalid)).toBe(false);
    expect(maskCreditCard(invalid)).toBe('************1112');
  });

  it('supports custom mask character', () => {
    expect(maskCreditCard('4111111111111111', { mask: '#' })).toBe('############1111');
  });
});

describe('isLuhnValid', () => {
  it('accepts well-known test PANs', () => {
    expect(isLuhnValid('4111111111111111')).toBe(true);
    expect(isLuhnValid('5500000000000004')).toBe(true);
    expect(isLuhnValid('378282246310005')).toBe(true);
  });

  it('accepts separators', () => {
    expect(isLuhnValid('4111 1111 1111 1111')).toBe(true);
    expect(isLuhnValid('4111-1111-1111-1111')).toBe(true);
  });

  it('rejects invalid numbers and non-digits', () => {
    expect(isLuhnValid('4111111111111112')).toBe(false);
    expect(isLuhnValid('')).toBe(false);
    expect(isLuhnValid('abcdef')).toBe(false);
  });
});

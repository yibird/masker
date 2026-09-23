import { describe, expect, it } from 'vitest';
import { maskBankAccount } from '../src/mask/bank-account.js';

describe('maskBankAccount', () => {
  it('masks CN-style account keeping last 4', () => {
    // 19 digits, keep last 4 → 15 masks + 0123
    expect(maskBankAccount('6222021234567890123')).toBe('***************0123');
  });

  it('preserves spaces', () => {
    expect(maskBankAccount('6222 0212 3456 7890')).toBe('**** **** **** 7890');
  });

  it('preserves dashes', () => {
    expect(maskBankAccount('6222-0212-3456-7890')).toBe('****-****-****-7890');
  });

  it('masks IBAN alphanumeric body', () => {
    const iban = 'GB29NABC60161331926819';
    expect(maskBankAccount(iban)).toBe('******************6819');
  });

  it('supports custom keepStart / keepEnd', () => {
    // 19 alnum, keep 4 + 4 → 11 masks in the middle
    expect(maskBankAccount('6222021234567890123', { keepStart: 4, keepEnd: 4 })).toBe(
      '6222***********0123',
    );
  });

  it('returns short / non-account input unchanged', () => {
    expect(maskBankAccount('')).toBe('');
    expect(maskBankAccount('123')).toBe('123');
    expect(maskBankAccount('1234567')).toBe('1234567');
    expect(maskBankAccount('abc')).toBe('abc');
  });

  it('does not confuse with credit-card min length when long enough', () => {
    // 12 digits still bank-maskable even without Luhn
    expect(maskBankAccount('123456789012')).toBe('********9012');
  });
});

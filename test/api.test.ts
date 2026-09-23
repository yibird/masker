import { describe, expect, it } from 'vitest';
import * as masker from '../src/index.js';
import {
  maskAddress,
  maskBankAccount,
  maskCreditCard,
  maskEmail,
  maskGeneric,
  maskIdCard,
  maskIp,
  maskJwt,
  maskLicensePlate,
  maskMac,
  maskName,
  maskPhone,
  maskUrl,
  maskVehicle,
  maskVin,
} from '../src/index.js';

describe('public API surface', () => {
  it('exports all documented functions', () => {
    expect(typeof masker.maskEmail).toBe('function');
    expect(typeof masker.maskPhone).toBe('function');
    expect(typeof masker.maskName).toBe('function');
    expect(typeof masker.maskAddress).toBe('function');
    expect(typeof masker.maskCreditCard).toBe('function');
    expect(typeof masker.maskIdCard).toBe('function');
    expect(typeof masker.maskBankAccount).toBe('function');
    expect(typeof masker.maskMac).toBe('function');
    expect(typeof masker.maskVehicle).toBe('function');
    expect(typeof masker.maskVin).toBe('function');
    expect(typeof masker.maskLicensePlate).toBe('function');
    expect(typeof masker.maskJwt).toBe('function');
    expect(typeof masker.maskIp).toBe('function');
    expect(typeof masker.maskUrl).toBe('function');
    expect(typeof masker.maskGeneric).toBe('function');
    expect(typeof masker.maskObject).toBe('function');
    expect(typeof masker.maskFields).toBe('function');
    expect(typeof masker.maskLog).toBe('function');
    expect(typeof masker.createMasker).toBe('function');
    expect(typeof masker.isLuhnValid).toBe('function');
  });

  it('each masker is pure for its documented invalid inputs', () => {
    expect(maskEmail('')).toBe('');
    expect(maskPhone('')).toBe('');
    expect(maskName('')).toBe('');
    expect(maskAddress('')).toBe('');
    expect(maskCreditCard('123')).toBe('123');
    expect(maskIdCard('123')).toBe('123');
    expect(maskBankAccount('123')).toBe('123');
    expect(maskMac('nope')).toBe('nope');
    expect(maskVehicle('???')).toBe('???');
    expect(maskVin('short')).toBe('short');
    expect(maskLicensePlate('')).toBe('');
    expect(maskJwt('invalid')).toBe('invalid');
    expect(maskIp('invalid')).toBe('invalid');
    expect(maskUrl('invalid')).toBe('invalid');
    expect(maskGeneric('')).toBe('');
  });

  it('same input + same options → same output (determinism)', () => {
    const opts = { keepStart: 1, keepEnd: 1 } as const;
    for (let i = 0; i < 5; i++) {
      expect(maskGeneric('abcdef', opts)).toBe(maskGeneric('abcdef', opts));
      expect(maskEmail('user@example.com')).toBe(maskEmail('user@example.com'));
      expect(maskIdCard('110101199001011234')).toBe(maskIdCard('110101199001011234'));
      expect(maskMac('00:1A:2B:3C:4D:5E')).toBe(maskMac('00:1A:2B:3C:4D:5E'));
      expect(maskVehicle('京A12345')).toBe(maskVehicle('京A12345'));
    }
  });
});

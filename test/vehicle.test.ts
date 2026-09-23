import { describe, expect, it } from 'vitest';
import { maskLicensePlate, maskVehicle, maskVin } from '../src/mask/vehicle.js';

describe('maskLicensePlate', () => {
  it('masks Chinese plate keeping province + letter', () => {
    expect(maskLicensePlate('京A12345')).toBe('京A*****');
  });

  it('masks new-energy 8-char plate', () => {
    expect(maskLicensePlate('沪AD12345')).toBe('沪A******');
  });

  it('masks generic ASCII plate', () => {
    expect(maskLicensePlate('ABC1234')).toBe('AB*****');
  });

  it('returns invalid plate unchanged', () => {
    expect(maskLicensePlate('')).toBe('');
    expect(maskLicensePlate('AB')).toBe('AB');
  });
});

describe('maskVin', () => {
  it('masks 17-char VIN keeping WMI + last 4', () => {
    // 17 = 3 + 10 mask + 4
    expect(maskVin('1HGCM82633A004352')).toBe('1HG**********4352');
  });

  it('supports keep overrides', () => {
    expect(maskVin('1HGCM82633A004352', { keepStart: 0, keepEnd: 0 })).toBe('*****************');
  });

  it('returns non-VIN unchanged', () => {
    expect(maskVin('too-short')).toBe('too-short');
    expect(maskVin('')).toBe('');
  });
});

describe('maskVehicle', () => {
  it('auto-detects VIN', () => {
    expect(maskVehicle('1HGCM82633A004352')).toBe('1HG**********4352');
  });

  it('auto-detects license plate', () => {
    expect(maskVehicle('京A12345')).toBe('京A*****');
  });

  it('respects kind override', () => {
    expect(maskVehicle('ABC1234', { kind: 'plate' })).toBe('AB*****');
    expect(maskVehicle('1HGCM82633A004352', { kind: 'vin' })).toBe('1HG**********4352');
  });

  it('returns unknown input unchanged', () => {
    expect(maskVehicle('???')).toBe('???');
    expect(maskVehicle('')).toBe('');
  });
});

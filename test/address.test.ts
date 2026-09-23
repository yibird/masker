import { describe, expect, it } from 'vitest';
import { maskAddress } from '../src/mask/address.js';

describe('maskAddress', () => {
  it('keeps administrative prefix and masks the rest by default', () => {
    const out = maskAddress('北京市朝阳区xxx街道xxx号');
    expect(out.startsWith('北京市朝阳区')).toBe(true);
    expect(out).not.toContain('xxx街道');
    expect(out).toContain('***');
  });

  it('keeps multi-level Chinese admin prefixes', () => {
    const out = maskAddress('浙江省杭州市西湖区文三路100号');
    expect(out.startsWith('浙江省杭州市西湖区')).toBe(true);
    expect(out).not.toContain('文三路');
  });

  it('supports explicit keepStart / keepEnd', () => {
    expect(maskAddress('123 Main Street Apt 4', { keepStart: 4, keepEnd: 0 })).toBe(
      '123 *****************',
    );
  });

  it('supports custom mask character and maskLength', () => {
    const out = maskAddress('北京市朝阳区xxx街道xxx号', { mask: '•', maskLength: 4 });
    expect(out.startsWith('北京市朝阳区')).toBe(true);
    expect(out.endsWith('••••')).toBe(true);
  });

  it('supports disableAutoPrefix fallback', () => {
    const out = maskAddress('北京市朝阳区xxx街道', { disableAutoPrefix: true, keepStart: 0 });
    expect(out).toMatch(/^\*+$/);
  });

  it('returns empty input unchanged', () => {
    expect(maskAddress('')).toBe('');
  });

  it('handles non-Chinese addresses without throwing', () => {
    const out = maskAddress('123 Main St, Springfield, IL 62704');
    expect(out.length).toBeGreaterThan(0);
    expect(out).not.toBe('123 Main St, Springfield, IL 62704');
  });
});

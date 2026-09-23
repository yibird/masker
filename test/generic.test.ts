import { describe, expect, it } from 'vitest';
import { maskGeneric } from '../src/mask/generic.js';

describe('maskGeneric', () => {
  it('masks the middle while keeping edges', () => {
    expect(maskGeneric('1234567890', { keepStart: 2, keepEnd: 2 })).toBe('12******90');
  });

  it('fully masks by default', () => {
    expect(maskGeneric('sensitive-value')).toBe('***************'); // 15 graphemes
    expect(maskGeneric('abc')).toBe('***');
  });

  it('supports custom mask characters', () => {
    expect(maskGeneric('123456', { keepStart: 1, keepEnd: 1, mask: '•' })).toBe('1••••6');
    expect(maskGeneric('123456', { keepStart: 1, keepEnd: 1, mask: 'x' })).toBe('1xxxx6');
    expect(maskGeneric('123456', { keepStart: 1, keepEnd: 1, mask: '#' })).toBe('1####6');
  });

  it('supports fixed maskLength independent of hidden length', () => {
    expect(maskGeneric('1234567890', { keepStart: 2, keepEnd: 2, maskLength: 3 })).toBe('12***90');
  });

  it('returns empty string unchanged', () => {
    expect(maskGeneric('')).toBe('');
  });

  it('returns value when keepStart + keepEnd cover everything', () => {
    expect(maskGeneric('abc', { keepStart: 2, keepEnd: 2 })).toBe('abc');
  });

  it('handles Chinese as grapheme clusters', () => {
    expect(maskGeneric('中文测试', { keepStart: 1, keepEnd: 1 })).toBe('中**试');
    expect(maskGeneric('中文')).toBe('**');
  });

  it('handles Japanese and Korean', () => {
    expect(maskGeneric('こんにちは', { keepStart: 1, keepEnd: 1 })).toBe('こ***は');
    expect(maskGeneric('한국어', { keepStart: 1, keepEnd: 1 })).toBe('한*어');
  });

  it('handles emoji grapheme clusters (including modifiers)', () => {
    // skin-tone modifier should stay with base emoji as one cluster
    const out = maskGeneric('👍🏽👍🏽', { keepStart: 1, keepEnd: 0 });
    expect(out.startsWith('👍🏽')).toBe(true);
    expect(out).not.toBe('👍🏽👍🏽');
  });

  it('handles ZWJ family emoji as clusters when Segmenter is available', () => {
    const family = '👨‍👩‍👧‍👦';
    const out = maskGeneric(family + 'ab', { keepStart: 1, keepEnd: 2 });
    expect(out.endsWith('ab')).toBe(true);
    expect(out.startsWith(family)).toBe(true);
  });

  it('handles extremely long strings', () => {
    const long = 'a'.repeat(50_000);
    const out = maskGeneric(long, { keepStart: 3, keepEnd: 3 });
    expect(out.length).toBe(50_000);
    expect(out.startsWith('aaa')).toBe(true);
    expect(out.endsWith('aaa')).toBe(true);
    expect(out.slice(3, 10)).toBe('*******');
  });

  it('is deterministic for the same input', () => {
    const opts = { keepStart: 1, keepEnd: 1 } as const;
    expect(maskGeneric('abcdef', opts)).toBe(maskGeneric('abcdef', opts));
  });
});

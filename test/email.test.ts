import { describe, expect, it } from 'vitest';
import { maskEmail } from '../src/mask/email.js';

describe('maskEmail', () => {
  it('masks local part while preserving domain', () => {
    expect(maskEmail('zhangsan@example.com')).toBe('z******n@example.com');
  });

  it('supports short local parts (single character)', () => {
    expect(maskEmail('a@example.com')).toBe('*@example.com');
  });

  it('supports two-character local parts', () => {
    expect(maskEmail('ab@example.com')).toBe('a*@example.com');
  });

  it('preserves dots inside the local part structure length', () => {
    // middle graphemes (including the dot) are replaced 1:1
    expect(maskEmail('zhang.san@example.com')).toBe('z*******n@example.com');
  });

  it('preserves +tag by default', () => {
    expect(maskEmail('user+tag@example.com')).toBe('u**r+tag@example.com');
  });

  it('can mask the +tag when maskTag is true (whole local part treated as one)', () => {
    expect(maskEmail('user+tag@example.com', { maskTag: true })).toBe('u******g@example.com');
  });

  it('preserves subdomains', () => {
    expect(maskEmail('user@mail.example.com')).toBe('u**r@mail.example.com');
  });

  it('supports custom mask character', () => {
    expect(maskEmail('zhangsan@example.com', { mask: '•' })).toBe('z••••••n@example.com');
  });

  it('supports custom keepStart / keepEnd', () => {
    expect(maskEmail('zhangsan@example.com', { keepStart: 2, keepEnd: 3 })).toBe(
      'zh***san@example.com',
    );
  });

  it('returns invalid input unchanged', () => {
    expect(maskEmail('invalid')).toBe('invalid');
    expect(maskEmail('')).toBe('');
    expect(maskEmail('@example.com')).toBe('@example.com');
    expect(maskEmail('user@')).toBe('user@');
  });

  it('does not expose the original local part', () => {
    const out = maskEmail('secretperson@example.com');
    expect(out).not.toContain('secretperson');
    expect(out).toContain('@example.com');
  });

  it('handles Chinese local parts via graphemes', () => {
    expect(maskEmail('张三丰@example.com')).toBe('张*丰@example.com');
  });
});

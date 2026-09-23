import { describe, expect, it } from 'vitest';
import { maskName } from '../src/mask/name.js';

describe('maskName', () => {
  it('masks two-character Chinese names', () => {
    expect(maskName('张三')).toBe('张*');
  });

  it('masks three-character Chinese names keeping first and last', () => {
    expect(maskName('张三丰')).toBe('张*丰');
  });

  it('handles compound surnames', () => {
    expect(maskName('欧阳娜娜')).toBe('欧**娜');
  });

  it('masks single-token Latin names', () => {
    expect(maskName('John')).toBe('J**n');
  });

  it('masks multi-token Latin names token by token', () => {
    expect(maskName('John Smith')).toBe('J**n S***h');
    expect(maskName('Alice Johnson')).toBe('A***e J*****n');
  });

  it('preserves whitespace between tokens', () => {
    expect(maskName('  John   Smith  ')).toBe('  J**n   S***h  ');
  });

  it('supports custom mask character', () => {
    expect(maskName('张三', { mask: '#' })).toBe('张#');
  });

  it('returns empty input unchanged', () => {
    expect(maskName('')).toBe('');
  });

  it('handles Japanese and Korean names', () => {
    expect(maskName('山田太郎')).toBe('山**郎');
    expect(maskName('김철수')).toBe('김*수');
  });

  it('does not reveal middle characters', () => {
    expect(maskName('Confidential')).not.toContain('onfidenti');
  });
});

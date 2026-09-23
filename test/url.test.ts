import { describe, expect, it } from 'vitest';
import { maskUrl } from '../src/mask/url.js';

describe('maskUrl', () => {
  it('masks credentials by default', () => {
    const out = maskUrl('https://user:password@example.com/path');
    expect(out).not.toContain('password');
    expect(out).toContain('example.com/path');
    expect(out.startsWith('https://u***:')).toBe(true);
    expect(out).toContain(':******@example.com');
  });

  it('masks password and shortens username', () => {
    const out = maskUrl('https://user:password@example.com/path');
    expect(out).toContain(':');
    expect(out).not.toContain('password');
    expect(out.startsWith('https://u***:')).toBe(true);
  });

  it('can keep credentials', () => {
    const out = maskUrl('https://user:password@example.com/p', { maskCredentials: false });
    expect(out).toContain('password');
  });

  it('masks sensitive query values by default and keeps others', () => {
    const out = maskUrl('https://example.com/api?token=secret&page=1');
    expect(out).not.toContain('secret');
    expect(out).toContain('token=******');
    expect(out).toContain('page=1');
  });

  it('supports explicit query key list', () => {
    const out = maskUrl('https://example.com/x?a=1&b=2', { query: ['a'] });
    expect(out).toContain('a=******');
    expect(out).toContain('b=2');
  });

  it('masks all query values when maskAllQuery is true', () => {
    const out = maskUrl('https://example.com/x?page=2', { maskAllQuery: true });
    expect(out).not.toContain('page=2');
  });

  it('masks fragment by default', () => {
    const out = maskUrl('https://example.com/path#access_token=abc');
    expect(out).not.toContain('access_token');
    expect(out).toContain('#');
  });

  it('can keep fragment', () => {
    const out = maskUrl('https://example.com/path#section-2', { maskFragment: false });
    expect(out).toContain('section-2');
  });

  it('preserves hostname and path', () => {
    const out = maskUrl('https://api.example.com/v1/users?x=1');
    expect(out).toContain('api.example.com');
    expect(out).toContain('/v1/users');
  });

  it('returns invalid / relative URLs unchanged', () => {
    expect(maskUrl('')).toBe('');
    expect(maskUrl('not a url')).toBe('not a url');
    expect(maskUrl('/relative/path')).toBe('/relative/path');
  });

  it('supports custom mask character (URL-encoded in query)', () => {
    const out = maskUrl('https://example.com/api?token=secret', { mask: '#' });
    // URLSearchParams percent-encodes `#`
    expect(out).toContain('token=%23%23%23%23%23%23');
  });
});

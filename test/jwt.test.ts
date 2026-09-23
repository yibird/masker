import { describe, expect, it } from 'vitest';
import { maskJwt } from '../src/mask/jwt.js';

const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';

describe('maskJwt', () => {
  it('masks all three segments by default', () => {
    const out = maskJwt(SAMPLE);
    expect(out).toBe('********.********.********');
    expect(out).not.toContain('eyJhbGci');
    expect(out).not.toContain('MTIzNDU2');
    expect(out).not.toContain('dozjgNry');
  });

  it('keeps structure (three dot-separated segments)', () => {
    expect(maskJwt(SAMPLE).split('.')).toHaveLength(3);
  });

  it('can keep the header segment', () => {
    const out = maskJwt(SAMPLE, { header: 'keep' });
    expect(out.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.')).toBe(true);
    expect(out).toContain('.********.********');
    // payload must still be hidden
    expect(out).not.toContain('MTIzNDU2');
  });

  it('can keep a short header prefix only', () => {
    const out = maskJwt(SAMPLE, { keepSegmentChars: 3 });
    expect(out.startsWith('eyJ********.')).toBe(true);
  });

  it('never keeps the payload by default (opt-in only)', () => {
    const out = maskJwt(SAMPLE, { payload: 'keep' });
    expect(out).toContain('eyJzdWIiOiIxMjM0NTY3ODkwIn0');
    expect(out.split('.')[1]).toBe('eyJzdWIiOiIxMjM0NTY3ODkwIn0');
  });

  it('returns invalid tokens unchanged', () => {
    expect(maskJwt('invalid')).toBe('invalid');
    expect(maskJwt('')).toBe('');
    expect(maskJwt('a.b')).toBe('a.b');
    expect(maskJwt('a..c')).toBe('a..c');
    expect(maskJwt('.payload.sig')).toBe('.payload.sig');
    expect(maskJwt('header..sig')).toBe('header..sig');
    expect(maskJwt('a.b.c.d')).toBe('a.b.c.d');
  });

  it('supports custom mask and segment length', () => {
    const out = maskJwt(SAMPLE, { mask: '#', maskSegmentLength: 3 });
    expect(out).toBe('###.###.###');
  });

  it('does not parse or depend on valid base64 claims', () => {
    // Structurally JWT-like but not decodable — still masked safely.
    const junk = 'xxx.yyy.zzz';
    expect(maskJwt(junk)).toBe('********.********.********');
  });
});

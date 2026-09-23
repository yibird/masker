# JWT

`maskJwt` only does **structural splitting** (on two `.` characters) — it never base64-decodes, never reads claims, and never verifies signatures. By default all three segments are replaced with **fixed-length** mask strings, so segment lengths and payload contents are not exposed.

```ts
function maskJwt(value: string, options?: JwtMaskOptions): string;
```

## Basic usage

<MaskExample fn="maskJwt" input="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U" />

Default output (a fixed 8 `*` per segment):

<MaskPair input="eyJhbGciOi….eyJzdWIiOi….signature" output="********.********.********" note="header / payload / signature all masked by default" />

## Keeping the header

When debugging a gateway you sometimes need to see `alg` — turn it on explicitly:

<MaskExample
  fn="maskJwt"
  input="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
  :options="{ header: 'keep' }"
/>

<MaskPair
  input="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sig"
  output="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.********.********"
  note="header: 'keep' — payload still masked"
/>

## Keeping only a very short prefix

`keepSegmentChars` keeps N characters on the left of each masked segment (e.g. `eyJ` as a hint that this is a JWT):

<MaskExample fn="maskJwt" input="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.sig" :options="{ keepSegmentChars: 3 }" />

<MaskPair input="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.sig" output="eyJ********.eyJ********.eyJ********" note="keepSegmentChars: 3" />

## Fixed segment length

`maskSegmentLength` controls the mask-string length of each masked segment. The default is `8` and it **does not follow the source length** (guards against length side channels):

```ts
maskJwt(shortJwt, { maskSegmentLength: 4 });
// ****.****.****
```

## Logging / Authorization scenario

```ts
import { maskJwt } from 'masker';

function logRequest(headers: Record<string, string>) {
  const auth = headers.Authorization ?? headers.authorization;
  logger.info('request', {
    auth: auth ? maskJwt(auth.replace(/^Bearer\s+/i, '')) : undefined,
  });
}
```

```text
// before writing to disk
{ auth: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.Kc…' }

// after writing to disk
{ auth: '********.********.********' }
```

## About "invalid JWTs"

masker **does not validate**. As long as the shape is `header.payload[.signature]` and the header and payload are non-empty, it will be masked (the payload content can be garbage bytes).

| Input                     | Output |
| ------------------------- | ------ |
| `not-a-jwt`               | as-is  |
| `a.b` (two segments)      | as-is  |
| `.payload.sig`            | as-is  |
| `a.b.c.d` (four segments) | as-is  |
| `''`                      | `''`   |

> This is intentional: a masking tool should not take on validation responsibilities, nor should it throw error messages that might carry fragments of the token.

## Options

```ts
type JwtPartVisibility = 'mask' | 'keep';

interface JwtMaskOptions {
  mask?: string; // default '*'
  header?: JwtPartVisibility; // default 'mask'
  payload?: JwtPartVisibility; // default 'mask' — keep the default!
  signature?: JwtPartVisibility; // default 'mask'
  keepSegmentChars?: number; // default 0
  maskSegmentLength?: number; // default 8
}
```

::: warning Security note
`payload: 'keep'` exposes claims (sub, role, email…). Use it only in trusted debugging environments, and never write it to long-term logs.
:::

Related: [Security](/en/advanced/security) · [Logger](/en/advanced/logger)

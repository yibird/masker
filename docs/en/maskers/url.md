# URL

`maskUrl` is built on the standard **`URL` / `URLSearchParams`** and prioritizes masking credentials, sensitive query values, and the fragment; the hostname and path are kept by default so you can still debug.

```ts
function maskUrl(value: string, options?: UrlMaskOptions): string;
```

## Basic usage

<MaskExample fn="maskUrl" input="https://user:password@example.com/path" />

<MaskPair input="https://user:password@example.com/path" output="https://u***:******@example.com/path" note="username keeps the first character + a short mask; password gets a fixed 6-character mask" />

## Query parameters

### Default sensitive keys

When `query` is not specified, the **values** of the following keys (case-insensitive) are replaced; other keys are kept:

`token` · `access_token` · `password` · `passwd` · `secret` · `client_secret` · `api_key` · `key` · `auth` · `authorization` · `session` · `sig` · `signature` · `code` · `credential` …

<MaskExample fn="maskUrl" input="https://example.com/api?token=secret&page=1" />

<MaskPair input="https://example.com/api?token=secret&page=1" output="https://example.com/api?page=1&token=******" note="token masked, page=1 kept" />

### Custom query key list

```ts
maskUrl(url, { query: ['token', 'password', 'secret'] });
```

<MaskExample fn="maskUrl" input="https://example.com/x?a=1&b=2" :options="{ query: ['a'] }" />

<MaskPair input="https://example.com/x?a=1&b=2" output="https://example.com/x?b=2&a=******" note="only a is masked (URLSearchParams may reorder keys)" />

### Masking all query parameters

```ts
maskUrl(url, { maskAllQuery: true });
```

<MaskExample fn="maskUrl" input="https://example.com/x?page=2&q=hello" :options="{ maskAllQuery: true }" />

## Fragment

By default, everything after `#` is masked (a common pattern is `#access_token=…`):

<MaskExample fn="maskUrl" input="https://example.com/path#access_token=abc" />

<MaskPair input="https://example.com/path#access_token=abc" output="https://example.com/path#******" note="maskFragment defaults to true" />

```ts
maskUrl(url, { maskFragment: false }); // keep the fragment
```

## Disabling credential masking

```ts
maskUrl(url, { maskCredentials: false });
```

## password / token / secret / apiKey overview

| Input fragment           | Default result                              |
| ------------------------ | ------------------------------------------- |
| `user:password@host`     | `u***:******@host`                          |
| `?token=secret`          | `token=******`                              |
| `?secret=xxx`            | `secret=******`                             |
| `?apiKey=xxx`            | `apiKey=******` (matches the `apikey` rule) |
| `?authorization=Bearer…` | `authorization=******`                      |
| `#section`               | `#******`                                   |

::: tip About `URL` normalization
Output goes through `URL.toString()`, which may add a trailing `/` or adjust encoding. Invalid or relative URLs (`/path`) are **returned as-is**.
:::

## Full example

```ts
import { maskUrl } from 'masker';

const raw =
  'https://user:password@example.com/api/v1/users?token=secret&page=1&sort=-createdAt#frag';

console.log(maskUrl(raw));
// https://u***:******@example.com/api/v1/users?page=1&sort=-createdAt&token=******#******
```

<MaskExample
  fn="maskUrl"
  input="https://user:password@example.com/api/v1/users?token=secret&page=1&sort=-createdAt#frag"
/>

## Options

```ts
interface UrlMaskOptions {
  mask?: string; // default '*'
  maskCredentials?: boolean; // default true
  query?: readonly string[];
  maskAllQuery?: boolean; // default false
  maskFragment?: boolean; // default true
  valueMaskLength?: number; // default 6
}
```

## Error behavior

When `new URL` fails → **returned as-is**; never throws, never logs the input.

Related: [Security](/en/advanced/security) · [Recipes](/en/advanced/recipes)

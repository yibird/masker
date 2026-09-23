# URL

`maskUrl` 基于标准 **`URL` / `URLSearchParams`**，优先处理：凭据、敏感 query、fragment；hostname 与 path 默认保留以便排障。

```ts
function maskUrl(value: string, options?: UrlMaskOptions): string;
```

## 基础用法

<MaskExample fn="maskUrl" input="https://user:password@example.com/path" />

<MaskPair input="https://user:password@example.com/path" output="https://u***:******@example.com/path" note="username 保首字符+短遮盖；password 固定 6 位 mask" />

## Query 参数

### 默认敏感键

未指定 `query` 时，下列键（大小写不敏感）的**值**会被替换，其它键保留：

`token` · `access_token` · `password` · `passwd` · `secret` · `client_secret` · `api_key` · `key` · `auth` · `authorization` · `session` · `sig` · `signature` · `code` · `credential` …

<MaskExample fn="maskUrl" input="https://example.com/api?token=secret&page=1" />

<MaskPair input="https://example.com/api?token=secret&page=1" output="https://example.com/api?page=1&token=******" note="token 遮盖，page=1 保留" />

### 自定义 query 键列表

```ts
maskUrl(url, { query: ['token', 'password', 'secret'] });
```

<MaskExample fn="maskUrl" input="https://example.com/x?a=1&b=2" :options="{ query: ['a'] }" />

<MaskPair input="https://example.com/x?a=1&b=2" output="https://example.com/x?b=2&a=******" note="仅遮 a（URLSearchParams 可能重排键序）" />

### 遮盖全部 query

```ts
maskUrl(url, { maskAllQuery: true });
```

<MaskExample fn="maskUrl" input="https://example.com/x?page=2&q=hello" :options="{ maskAllQuery: true }" />

## Fragment

默认遮盖 `#` 后内容（常见 `#access_token=…`）：

<MaskExample fn="maskUrl" input="https://example.com/path#access_token=abc" />

<MaskPair input="https://example.com/path#access_token=abc" output="https://example.com/path#******" note="maskFragment 默认 true" />

```ts
maskUrl(url, { maskFragment: false }); // 保留 fragment
```

## 关闭凭据遮盖

```ts
maskUrl(url, { maskCredentials: false });
```

## password / token / secret / apiKey 一览

| 输入片段                 | 默认结果                              |
| ------------------------ | ------------------------------------- |
| `user:password@host`     | `u***:******@host`                    |
| `?token=secret`          | `token=******`                        |
| `?secret=xxx`            | `secret=******`                       |
| `?apiKey=xxx`            | `apiKey=******`（匹配 `apikey` 规则） |
| `?authorization=Bearer…` | `authorization=******`                |
| `#section`               | `#******`                             |

::: tip 关于 `URL` 规范化
输出经过 `URL.toString()`，可能补全 `/`、调整编码。非法或相对 URL（`/path`）**原样返回**。
:::

## 完整示例

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
  mask?: string; // 默认 '*'
  maskCredentials?: boolean; // 默认 true
  query?: readonly string[];
  maskAllQuery?: boolean; // 默认 false
  maskFragment?: boolean; // 默认 true
  valueMaskLength?: number; // 默认 6
}
```

## 错误行为

`new URL` 失败 → **原样返回**；从不抛异常、不打印输入。

相关：[Security](/advanced/security) · [Recipes](/advanced/recipes)

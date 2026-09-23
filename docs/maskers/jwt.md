# JWT

`maskJwt` 只做**结构切分**（两个 `.`），从不解码 base64、不读 claims、不验签。默认三段全部换成**固定长度**遮盖串，避免暴露段长度与 payload 内容。

```ts
function maskJwt(value: string, options?: JwtMaskOptions): string;
```

## 基础用法

<MaskExample fn="maskJwt" input="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U" />

默认输出（每段固定 8 个 `*`）：

<MaskPair input="eyJhbGciOi….eyJzdWIiOi….signature" output="********.********.********" note="header / payload / signature 默认全遮" />

## 保留 Header

调试网关时偶尔需要看见 `alg` —— 显式打开：

<MaskExample
  fn="maskJwt"
  input="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
  :options="{ header: 'keep' }"
/>

<MaskPair
  input="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sig"
  output="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.********.********"
  note="header: 'keep' — payload 仍遮盖"
/>

## 只保留极短前缀

`keepSegmentChars` 在遮盖段左侧保留 N 个字符（例如 `eyJ` 提示这是 JWT）：

<MaskExample fn="maskJwt" input="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.sig" :options="{ keepSegmentChars: 3 }" />

<MaskPair input="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.sig" output="eyJ********.eyJ********.eyJ********" note="keepSegmentChars: 3" />

## 固定段长度

`maskSegmentLength` 控制每个被遮段的遮盖串长度，默认 `8`，**不跟随原文长度**（防长度侧信道）：

```ts
maskJwt(shortJwt, { maskSegmentLength: 4 });
// ****.****.****
```

## 日志 / Authorization 场景

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
// 落盘前
{ auth: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.Kc…' }

// 落盘后
{ auth: '********.********.********' }
```

## 关于「无效 JWT」

masker **不做验证**。只要形状是 `header.payload[.signature]` 且 header、payload 非空，就会遮盖（payload 内容可以是垃圾字节）。

| 输入              | 输出 |
| ----------------- | ---- |
| `not-a-jwt`       | 原样 |
| `a.b`（两段）     | 原样 |
| `.payload.sig`    | 原样 |
| `a.b.c.d`（四段） | 原样 |
| `''`              | `''` |

> 故意如此：脱敏工具不应承担验证职责，也不应在失败时抛出可能夹带 token 片段的错误信息。

## Options

```ts
type JwtPartVisibility = 'mask' | 'keep';

interface JwtMaskOptions {
  mask?: string; // 默认 '*'
  header?: JwtPartVisibility; // 默认 'mask'
  payload?: JwtPartVisibility; // 默认 'mask' — 保持默认！
  signature?: JwtPartVisibility; // 默认 'mask'
  keepSegmentChars?: number; // 默认 0
  maskSegmentLength?: number; // 默认 8
}
```

::: warning 安全提示
`payload: 'keep'` 会暴露 claims（sub、role、email…）。仅限可信调试环境，且不要写入长期日志。
:::

相关：[Security](/advanced/security) · [Logger](/advanced/logger)

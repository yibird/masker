# FAQ

## 为什么只有 ESM？

现代 Node（18+）与 Bun 原生支持 ESM；双格式会放大条件导出与 interop 成本。`sideEffects: false` + 纯 ESM 利于 tree-shaking。CJS 请用 `await import('masker')`。

## 脱敏和加密有什么区别？

脱敏是**不可逆截断/遮盖**，用于日志与展示；加密可还原，用于存储与传输。详见 [Security](/advanced/security)。

## `maskCreditCard` 会检查卡号有效性吗？

不会。有效性请显式调用 `isLuhnValid`。两者解耦：无效但形状像卡的号仍可被遮盖。

## 为什么 JWT 不解码？

解码会引入校验职责与 payload 处理风险。masker 只切 `.`，专注意图是「日志里不要出现 token 明文」。

## 空字符串 / 非法输入会不会 throw？

数据类 masker **不 throw**，非法输入原样返回。  
Schema / `createMasker` **配置错误**会在编译期 `TypeError`（在启动时暴露，而不是第一条日志）。

## 对象会被修改吗？

不会。`maskObject` / `maskLog` / `masker.mask` 均为 copy-on-write；无变更子树保持原引用。`source !== result`（当确有变更时）。

## 通配符性能如何？

路径在 `createMasker` / 首次编译时建成 trie；每次 `.mask()` 不重复解析 `split('.')`。

## 支持 CommonJS `require('masker')` 吗？

不支持。理由见上。

## 如何处理 `Authorization: Bearer …`？

```ts
maskJwt(auth.replace(/^Bearer\s+/i, ''));
// 或对整串 maskGeneric({ keepStart: 7, keepEnd: 0 })
```

## `maskLog` 和 `maskObject` 怎么选？

|                | 路径精确   | 字段名深度 | 典型场景            |
| -------------- | ---------- | ---------- | ------------------- |
| `maskObject`   | ✓          | ✗          | API 响应、固定 DTO  |
| `maskLog`      | ✗          | ✓          | 日志 body、结构不定 |
| `createMasker` | ✓ / fields | ✓          | 热路径复用          |

可组合：`createMasker({ schema, fields })` 两者都跑。

## Error 的 message 怎么进 fields？

`maskLog` 会物化 Error 为 `{ name, message, stack }`。`maskObject` 不会展开 Error。

## 为什么不提供 `new Masker()` 类实例 API？

无跨调用可变状态；状态只是预编译规则，故用 `createMasker()` 返回轻量对象，避免 OOP 层级。

## 中文 / emoji 长度对吗？

按 **grapheme cluster**（`Intl.Segmenter`，Node 18+ / Bun 可用时）。无 Segmenter 时回退 code point，不引入大型 Unicode 依赖。

## 如何保证示例与代码一致？

文档站内 `MaskExample` / `HomeDemo` / `Playground` **直接 import 源码**运行；输出由真实实现生成，而非手写假结果。

## 有 Benchmark 吗？

有：`npm run bench`（`benchmark/bench.mjs`）。文档**不写死**未经本机验证的绝对数字，见 [Performance](/advanced/performance)。

## 浏览器里能用吗？

库无 Node 专属 API，打包进前端可行；请确认你是否希望把脱敏规则暴露在客户端（通常服务端边界更合适）。

## 最小 Node 版本？

`engines.node: >= 18`（`URL`、`Intl.Segmenter`、ESM）。

相关：[API](/reference/api) · [Security](/advanced/security)

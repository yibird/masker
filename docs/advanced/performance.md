# Performance

masker 面向 **Logger / 中间件 / 高 QPS 响应脱敏**，设计上优先减少分配与重复解析。

## 做了什么

| 技术            | 说明                                                                    |
| --------------- | ----------------------------------------------------------------------- |
| 常量正则        | 模块级 regex，无每调用 `new RegExp`                                     |
| ASCII 快路径    | 纯 ASCII 字符串用 UTF-16 索引，跳过 Segmenter（Email / Name / Generic） |
| Schema 身份缓存 | 同一 schema 对象引用复用已编译 trie（`WeakMap`）                        |
| Schema 预编译   | `createMasker` 阶段解析路径 → trie，`.mask()` 不再 `split('.')`         |
| Copy-on-write   | 未命中子树保持引用，避免整树深拷贝                                      |
| 单趟扫描        | Phone / Card / Bank 按字符一次 walk；纯数字手机号走 slice 快路径        |
| 数组下标驻留    | 常见 `0..63` 下标用预驻留字符串，避免 `String(i)` 分配                  |
| 原生 URL        | `URL` / `URLSearchParams`，无巨型 URL 正则                              |
| Lazy allocation | 空 schema / 无 fields 直接返回原引用                                    |
| 无 JSON 热路径  | 不使用 `JSON.stringify` / `parse` 做脱敏                                |

## 没有什么

- 无 runtime 依赖
- 无每次调用的闭包工厂（preset 在编译期解析）
- 无装饰器 / 反射 / 插件总线

## 复杂度（直觉模型）

| 操作              | 复杂度                                                                         |
| ----------------- | ------------------------------------------------------------------------------ |
| 单字符串 masker   | O(n) n = 字符串长度（ASCII 近似 O(n) 无分词）                                  |
| `maskObject`      | O(访问到的节点数) × 路径活跃集（通常很小）；同一 schema 对象命中缓存时跳过编译 |
| `createMasker`    | O(路径总段数)，仅一次                                                          |
| `maskLog(fields)` | O(对象树大小) —— 每个 key 查一次 Map                                           |

通配符不会在遍历时重新解析路径；活跃 trie 节点随下探前进/裁剪。

::: tip Schema 对象请视为不可变
`maskObject` / `maskFields` / `createMasker` 对 **同一 schema 对象引用** 做 `WeakMap` 缓存。首次编译后请不要就地增删键；需要变更时新建对象。
:::

## 何时用哪个 API

```text
启动时
  createMasker(schema | fields)     ← 编译一次

每请求 / 每条日志
  masker.mask(value)                ← 热路径

脚本 / 测试 / 一次性
  maskObject(value, schema)
  maskLog(value, { fields })        ← 含编译，可接受
```

## 本地跑 Benchmark

仓库自带脚本（**真实运行，不在文档里编造数字**）：

```bash
npm run build
npm run bench
# 等价于
# node benchmark/bench.mjs
```

覆盖场景：

- `maskEmail` / `maskPhone` / `maskGeneric` / `maskUrl`
- `maskObject` one-shot（含 schema 编译）
- `createMasker().mask`（预编译）
- `maskLog` fields
- 大数组（10k 元素）

### 在 Bun 上对比

```bash
npm run build
bun benchmark/bench.mjs
```

> **说明：** 本项目开发环境若未安装 Bun，文档不会给出 Bun 数字。请在目标机器上自行运行后填写/记录。

### 读数时注意

- 先看 `ops/s` 与 `ms`，多跑几次观察方差
- 大对象场景受 GC 影响明显
- 不要用微基准的绝对值跨机器比较

## 实践建议

1. **预编译** schema/fields，避免在 `maskLog` 里每条编译
2. 字段名规则保持**精简**（热 Map 查询）
3. 对超大 payload，优先在**边界裁剪**再脱敏（先删不该有的字段）
4. 超长密钥用 `maskLength` 避免生成过长遮盖串
5. 不要在热路径里做「脱敏 → JSON → 再解析」

## 内存

- Copy-on-write：无变更 → 零新树
- 遮盖字符串仅在真正替换时分配
- JWT 默认固定长度遮盖，不按段长线性放大

相关：[Path & Schema](/object/path-schema) · [benchmark/bench.mjs](https://github.com/masker-js/masker/blob/main/benchmark/bench.mjs)

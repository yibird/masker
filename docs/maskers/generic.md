# Generic

`maskGeneric` 是「不知道类型时」的默认武器：按 **keepStart / keepEnd** 保留边沿，中间替换为 `mask`。Unicode 按 grapheme cluster 计数，而不是裸 `string.length`。

```ts
function maskGeneric(value: string, options?: SliceMaskOptions): string;
```

## 基础用法

默认**全部遮盖**（`keepStart` / `keepEnd` 均为 0）：

<MaskExample fn="maskGeneric" input="sensitive-api-key" />

<MaskPair input="abc" output="***" />

<MaskPair input="sensitive-value" output="***************" note="15 个 grapheme → 15 个 '*'" />

## keepStart / keepEnd

<MaskExample fn="maskGeneric" input="1234567890" :options="{ keepStart: 2, keepEnd: 2 }" />

<MaskPair input="1234567890" output="12******90" note="经典银行卡式两端保留" />

<MaskPair input="1234567890" output="**********" note="keepStart: 0, keepEnd: 0" />

<MaskPair input="1234567890" output="1234567890" note="keepStart + keepEnd ≥ 长度 → 原样返回" />

## 自定义 mask

<MaskExample fn="maskGeneric" input="123456" :options="{ keepStart: 1, keepEnd: 1, mask: 'x' }" />

<MaskPair input="123456" output="1xxxx6" note="mask: 'x'" />

<MaskPair input="123456" output="1••••6" note="mask: '•'" />

<MaskPair input="123456" output="1####6" note="mask: '#'" />

## maskLength

指定遮盖区**固定长度**（忽略中间自然长度）——适合「日志里统一 6 位星号」：

<MaskExample fn="maskGeneric" input="1234567890" :options="{ keepStart: 2, keepEnd: 2, maskLength: 3 }" />

<MaskPair input="1234567890" output="12***90" note="maskLength: 3" />

<MaskPair input="abc" output="******" note="maskLength: 6（全遮 + 固定长度）" />

## Unicode

### 中文 / 日文 / 韩文

<MaskPair input="中文测试" output="中**试" note="keepStart: 1, keepEnd: 1" />

<MaskPair input="こんにちは" output="こ***は" note="keepStart: 1, keepEnd: 1" />

<MaskPair input="한국어" output="한*어" note="keepStart: 1, keepEnd: 1" />

### Emoji

肤色修饰符、ZWJ 家庭 emoji 在支持 `Intl.Segmenter` 的运行时（Node 18+ / Bun）按**一个**用户感知字符计：

```ts
maskGeneric('👍🏽👍🏽', { keepStart: 1, keepEnd: 0 });
// 👍🏽*

maskGeneric('👨‍👩‍👧‍👦ab', { keepStart: 1, keepEnd: 2 });
// 👍 家庭 emoji + ab  —— 见下方 live 结果
```

<MaskExample fn="maskGeneric" input="👍🏽👍🏽" :options="{ keepStart: 1, keepEnd: 0 }" />

> 若运行时没有 `Segmenter`，回退到 code point 切分；**不会**引入大型 Unicode 依赖。

### 超长字符串

50k 字符输入仍为 O(n) 单次遍历（ASCII 走快路径）：

```ts
maskGeneric('a'.repeat(50_000), { keepStart: 3, keepEnd: 3 });
// aaa + 49994 个 * + aaa
```

## 性能说明

| 路径                        | 策略                                |
| --------------------------- | ----------------------------------- |
| 纯 ASCII（含常见卡号/密钥） | UTF-16 索引 + `slice`，不分词       |
| 非 ASCII                    | `Intl.Segmenter` grapheme（可用时） |
| `mask` 单字符               | `String.repeat`                     |
| `mask` 多字符               | `Array.fill + join`                 |

## Options

```ts
interface SliceMaskOptions {
  mask?: string; // 默认 '*'
  keepStart?: number; // 默认 0
  keepEnd?: number; // 默认 0
  maskLength?: number; // 可选固定遮盖长度
}
```

`AddressMaskOptions` 在此基础上扩展了 `disableAutoPrefix`。

## 业务场景：密钥与内部 ID

```ts
import { maskGeneric, maskObject } from 'masker';

const payload = {
  apiKey: 'sk-live-9f3a…',
  requestId: 'req_01H8X…',
  note: 'visible',
};

maskLog(payload, {
  fields: {
    apiKey: 'generic',
    requestId: (v: string) => maskGeneric(v, { keepStart: 3, keepEnd: 0 }),
  },
});
// { apiKey: '****************', requestId: 'sk_*…', note: 'visible' }
```

## 错误行为

`''` → `''`；从不抛异常。

相关：[Playground](/playground) · [Custom Maskers](/advanced/custom)

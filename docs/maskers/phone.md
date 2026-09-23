# Phone

`maskPhone` 只替换**数字段**，完整保留空格、`-`、`()` 与可选的 `+` 国家区号 —— 不会把 `+1 415 555 1234` 硬塞进某一条 11 位正则。

```ts
function maskPhone(value: string, options?: PhoneMaskOptions): string;
```

## 基础用法 — 中国手机号

<MaskExample fn="maskPhone" input="13812345678" />

默认 `keepStart: 3`、`keepEnd: 4`（在**国家码之后的国内号码**上生效）：

<MaskPair input="13812345678" output="138****5678" />

## 国际号码

### 保留 +86

<MaskExample fn="maskPhone" input="+8613812345678" />

<MaskPair input="+8613812345678" output="+86138****5678" note="国家码 86 来自内置 E.164 列表（最长匹配）" />

### NANP：空格与 +1

<MaskPair input="+1 415 555 1234" output="+1 415 *** 1234" note="分隔符原样保留" />

### 括号与横线

<MaskPair input="(415) 555-1234" output="(415) ***-1234" />

## 自定义 keepStart / keepEnd

<MaskExample fn="maskPhone" input="13812345678" :options="{ keepStart: 3, keepEnd: 4, mask: '*' }" />

更多保留位：

<MaskPair input="13812345678" output="1381****678" note="keepStart: 4, keepEnd: 3" />

全部遮住：

<MaskPair input="13812345678" output="###########" note="keepStart: 0, keepEnd: 0, mask: '#'" />

多字符 `mask` token 时，每个被遮数字位取 **第一个字符**：

<MaskPair input="13812345678" output="138••••5678" note="mask: '••' → 逐位使用 '•'" />

## 边界情况

| 输入          | 行为                    |
| ------------- | ----------------------- |
| `''`          | `''`                    |
| `not-a-phone` | 原样（无数字）          |
| `12`          | `1*`（强制至少遮 1 位） |
| `1`           | `*`                     |

国家码识别：`+` 后连续数字与内置列表做**最长前缀匹配**，且要求剩余国内号码位数为 7–15，避免把 `+86138…` 误判成区号 `861`。

## Options

```ts
interface PhoneMaskOptions {
  mask?: string; // 默认 '*'
  keepStart?: number; // 默认 3（国内段）
  keepEnd?: number; // 默认 4
}
```

## 业务场景：客服工单

```ts
import { maskPhone, maskName } from 'masker';

const ticket = {
  id: 'T-9910',
  caller: '王小明',
  mobile: '+86 138 1234 5678',
};

const safeTicket = {
  ...ticket,
  caller: maskName(ticket.caller),
  mobile: maskPhone(ticket.mobile),
};
// { id: 'T-9910', caller: '王*', mobile: '+86 138****5678' }
```

> 样例中的空格格式会被原样保留：只动数字位。

## 错误行为

无数字或空串 → **原样返回**；从不抛异常。

相关：[Name](/maskers/name) · [Playground](/playground)

# Credit Card

`maskCreditCard` 遮盖卡号数字，**保留**空格 / `-` 分隔格式。是否「有效卡号」与脱敏无关：`isLuhnValid` 是独立 API，脱敏路径不依赖校验。

```ts
function maskCreditCard(value: string, options?: CreditCardMaskOptions): string;
function isLuhnValid(value: string): boolean;
```

## 基础用法

<MaskExample fn="maskCreditCard" input="4111111111111111" />

16 位默认**只保留最后 4 位**：

<MaskPair input="4111111111111111" output="************1111" />

## 保留原始格式

### 空格

<MaskExample fn="maskCreditCard" input="4111 1111 1111 1111" />

<MaskPair input="4111 1111 1111 1111" output="**** **** **** 1111" />

### 横线

<MaskPair input="4111-1111-1111-1111" output="****-****-****-1111" />

## Amex（15 位）

默认识别 15 位卡为 Amex 风格：**保留前 6 + 后 5**（BIN + 末 5）：

<MaskExample fn="maskCreditCard" input="378282246310005" />

<MaskPair input="378282246310005" output="378282****10005" />

<MaskPair input="3782 822463 10005" output="3782 82**** 10005" note="分隔符保留；前 6 位跨分组" />

## 自定义保留位数

<MaskExample fn="maskCreditCard" input="4111111111111111" :options="{ keepStart: 4, keepEnd: 4 }" />

<MaskPair input="4111111111111111" output="4111********1111" note="keepStart: 4, keepEnd: 4" />

<MaskPair input="4111111111111111" output="############1111" note="mask: '#'" />

## 与 Luhn 校验解耦

```ts
import { maskCreditCard, isLuhnValid } from 'masker';

isLuhnValid('4111111111111111'); // true
isLuhnValid('4111111111111112'); // false

// 脱敏不要求通过校验
maskCreditCard('4111111111111112'); // ************1112
```

`isLuhnValid` 会忽略空格与 `-`；遇非数字返回 `false`。

## 边界情况

| 输入                    | 行为                     |
| ----------------------- | ------------------------ |
| `''`                    | `''`                     |
| `123`（&lt; 12 位数字） | **原样返回**（不像卡）   |
| `12345678`（8 位）      | 原样返回                 |
| 有效 / 无效卡号         | 一律可遮（与 Luhn 无关） |

## Options

```ts
interface CreditCardMaskOptions {
  mask?: string; // 默认 '*'
  keepStart?: number; // 默认：Amex 6，其它 0
  keepEnd?: number; // 默认：Amex 5，其它 4
}
```

## 业务场景：支付日志

```ts
import { maskCreditCard } from 'masker';

function logPayment(p: { pan: string; amount: number }) {
  logger.info('payment', {
    pan: maskCreditCard(p.pan), // **** **** **** 1111
    amount: p.amount,
    // 绝不记录 p.pan 明文
  });
}
```

## 错误行为

从不抛异常；短于 12 位数字的输入原样返回。

相关：[API Reference](/reference/api#maskcreditcard) · [Security](/advanced/security)

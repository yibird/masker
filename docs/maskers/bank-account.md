# Bank Account

`maskBankAccount` 遮盖**银行账号**，与 [Credit Card](/maskers/credit-card) **刻意分开**：账号长度更宽（常见 8–19 位）、没有 PAN 品牌/Amex 规则，业务里也通常不走 Luhn。支持纯数字账号与 IBAN 风格字母数字账号。

```ts
function maskBankAccount(value: string, options?: BankAccountMaskOptions): string;
```

## 基础用法

<MaskExample fn="maskBankAccount" input="6222021234567890123" />

默认只保留**末 4 位**：

<MaskPair input="6222021234567890123" output="***************0123" note="keepEnd: 4" />

## 保留分隔符

### 空格

<MaskExample fn="maskBankAccount" input="6222 0212 3456 7890" />

<MaskPair input="6222 0212 3456 7890" output="**** **** **** 7890" />

### 横线

<MaskPair input="6222-0212-3456-7890" output="****-****-****-7890" />

## IBAN

字母与数字都会遮盖，空格保留：

<MaskExample fn="maskBankAccount" input="GB29NABC60161331926819" />

<MaskPair input="GB29NABC60161331926819" output="******************6819" note="字母数字一并遮盖" />

## 自定义保留位数

<MaskExample fn="maskBankAccount" input="6222021234567890123" :options="{ keepStart: 4, keepEnd: 4 }" />

<MaskPair input="6222021234567890123" output="6222***********0123" note="keepStart: 4, keepEnd: 4" />

## 与 Credit Card 的分工

|          | Credit Card            | Bank Account      |
| -------- | ---------------------- | ----------------- |
| 典型长度 | 13–19（PAN），常用 16  | 8–19+，各国差异大 |
| 品牌规则 | Amex 15 位特殊默认     | 无                |
| 校验     | 可选 `isLuhnValid`     | 不提供 Luhn       |
| 默认保留 | 末 4（Amex 前 6+末 5） | 末 4              |
| IBAN     | 否                     | 是（字母数字）    |

## 边界情况

| 输入                | 行为                   |
| ------------------- | ---------------------- |
| `''`                | `''`                   |
| 少于 8 位数字       | 原样                   |
| 纯字母且 &lt; 10 位 | 原样                   |
| 有效 / 无效账号     | 一律可遮（与校验无关） |

## Options

```ts
interface BankAccountMaskOptions {
  mask?: string; // 默认 '*'
  keepStart?: number; // 默认 0
  keepEnd?: number; // 默认 4
  minLength?: number; // 默认：有数字 8，否则 10
}
```

## 业务场景：转账流水日志

```ts
import { maskBankAccount } from 'masker';

function logTransfer(t: { from: string; to: string; amount: number }) {
  logger.info('transfer', {
    from: maskBankAccount(t.from),
    to: maskBankAccount(t.to),
    amount: t.amount,
    // 绝不记录明文账号
  });
}
```

## 错误行为

**从不抛异常；** 过短输入原样返回。

相关：[Credit Card](/maskers/credit-card) · [API Reference](/reference/api#maskbankaccount) · [Security](/advanced/security)

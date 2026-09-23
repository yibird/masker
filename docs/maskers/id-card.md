# ID Card

`maskIdCard` 遮盖中国居民身份证号，识别 **18 位**（末位可为 `X`）与旧版 **15 位**。默认保留行政区划前 6 位与末 4 位，出生日期与顺序码始终隐藏。

```ts
function maskIdCard(value: string, options?: IdCardMaskOptions): string;
```

## 基础用法

<MaskExample fn="maskIdCard" input="110101199001011234" />

<MaskPair input="110101199001011234" output="110101********1234" note="keepStart: 6, keepEnd: 4" />

### 校验位 X

<MaskPair input="11010119900101123X" output="110101********123X" note="末位 X 落在 keepEnd 内时保留" />

### 旧版 15 位

<MaskPair input="110101900101123" output="110101*****1123" note="15 位：6 + 5 遮盖 + 4" />

## 全遮盖（更严格）

<MaskExample fn="maskIdCard" input="110101199001011234" :options="{ keepStart: 0, keepEnd: 0 }" />

<MaskPair input="110101199001011234" output="******************" note="keepStart: 0, keepEnd: 0" />

## 只留末 4 位

<MaskPair input="110101199001011234" output="**************1234" note="keepStart: 0, keepEnd: 4" />

## 边界情况

| 输入                           | 行为                   |
| ------------------------------ | ---------------------- |
| `''`                           | `''`                   |
| `123`                          | 原样（长度不符）       |
| `1101011990010112345`（19 位） | 原样                   |
| 非身份证字符串                 | 原样                   |
| `110101 19900101 1234`         | 分隔空格保留，按位遮盖 |

::: tip 与 Credit Card 的区别

- 身份证：固定 15/18 位结构，**不做** Luhn
- 银行卡：见 [Credit Card](/maskers/credit-card)，按卡组织长度与分隔符处理
- 银行账号：见 [Bank Account](/maskers/bank-account)，长度更宽且无 PAN 规则  
  :::

## Options

```ts
interface IdCardMaskOptions {
  mask?: string; // 默认 '*'
  keepStart?: number; // 默认 6（行政区划）
  keepEnd?: number; // 默认 4
}
```

## 业务场景：实名信息导出

```ts
import { maskIdCard, maskName, maskPhone } from 'masker';

const row = {
  name: '张三',
  phone: '13812345678',
  idNo: '110101199001011234',
};

const safe = {
  ...row,
  name: maskName(row.name),
  phone: maskPhone(row.phone),
  idNo: maskIdCard(row.idNo),
};
// { name: '张*', phone: '138****5678', idNo: '110101********1234' }
```

## 错误行为

**从不抛异常。** 非 15/18 位输入原样返回；不校验生日/校验位。

相关：[Bank Account](/maskers/bank-account) · [Generic](/maskers/generic) · [Security](/advanced/security)

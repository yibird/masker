<p align="center">
  <img src="./assets/logo.svg" width="120" height="120" alt="masker logo" />
</p>

# masker

<p align="center">
  <a href="./README.md">English</a> · <strong>简体中文</strong>
</p>

面向 Node.js、Bun 与现代 JS 运行时的轻量、快速、**类型安全**数据脱敏工具库。

- 零运行时依赖
- ESM + TypeScript 类型声明
- Grapheme 感知（中文 / 日本語 / 한국어 / emoji）
- Schema / 路径脱敏，规则可预编译，适合热路径 Logger
- 绝不修改输入对象（copy-on-write）

**文档站（VitePress）：** 执行 `npm run docs:dev` 或 `npm run docs:build` — 源码在 [`docs/`](./docs/)。

```ts
import { maskEmail, maskPhone, maskGeneric } from 'masker';

maskEmail('zhangsan@example.com'); // 'z******n@example.com'
maskPhone('13812345678'); // '138****5678'
maskGeneric('1234567890', { keepStart: 2, keepEnd: 2 }); // '12******90'
```

---

## 目录

1. [简介](#1-简介)
2. [安装](#2-安装)
3. [Node.js 用法](#3-nodejs-用法)
4. [Bun 用法](#4-bun-用法)
5. [快速开始](#5-快速开始)
6. [Email](#6-email)
7. [Phone](#7-phone)
8. [Name](#8-name)
9. [Address](#9-address)
10. [Credit card](#10-credit-card)
11. [JWT](#11-jwt)
12. [IP](#12-ip)
13. [URL](#13-url)
14. [Generic](#14-generic)
15. [Object](#15-object)
16. [Schema / 路径](#16-schema--路径)
17. [Logger](#17-logger)
18. [自定义策略](#18-自定义策略)
19. [性能](#19-性能)
20. [安全说明](#20-安全说明)
21. [API 参考](#21-api-参考)
22. [FAQ](#22-faq)

---

## 1. 简介

`masker` 是一个小型工具库，用于在应用代码、HTTP 响应、审计日志与 Logger 链路中**脱敏 PII 与密钥**。

设计目标：

| 目标     | 方式                                   |
| -------- | -------------------------------------- |
| 简单     | `maskEmail(value)` 零配置可用          |
| 可配置   | 每种脱敏器都接受语义化 options         |
| 可组合   | `maskObject` / `createMasker` 组合使用 |
| 类型安全 | 公开 API 无 `any`                      |
| 无副作用 | 输入永远不会被修改                     |
| 可预测   | 相同输入 + 相同 options → 相同输出     |
| 快       | 常量正则、ASCII 快路径、预编译 schema  |

它**不**校验业务数据（卡号 Luhn 校验可单独使用 `isLuhnValid`；JWT 永不解码）。

---

## 2. 安装

```bash
npm install masker
# 或
pnpm add masker
# 或
yarn add masker
# 或
bun add masker
```

要求 **Node.js ≥ 18**（或 Bun）。包为 ESM-only（`"type": "module"`）。

---

## 3. Node.js 用法

```ts
import { maskPhone, maskObject } from 'masker';
```

使用 `tsdown` 构建 → `dist/index.js` + `dist/index.d.ts`。

---

## 4. Bun 用法

```ts
import { maskUrl, createMasker } from 'masker';
```

不使用任何 Node 专属 API（从不 import `node:*`），Bun 可直接使用。

---

## 5. 快速开始

```ts
import {
  maskEmail,
  maskPhone,
  maskName,
  maskAddress,
  maskCreditCard,
  maskIdCard,
  maskBankAccount,
  maskMac,
  maskVehicle,
  maskJwt,
  maskIp,
  maskUrl,
  maskGeneric,
  maskObject,
  maskLog,
  createMasker,
} from 'masker';

maskEmail('zhangsan@example.com'); // z******n@example.com
maskPhone('+8613812345678'); // +86138****5678
maskName('张三丰'); // 张*丰
maskAddress('北京市朝阳区xxx街道xxx号'); // 北京市朝阳区*********
maskCreditCard('4111 1111 1111 1111'); // **** **** **** 1111
maskIdCard('110101199001011234'); // 110101********1234
maskBankAccount('6222021234567890123'); // ***************0123
maskMac('00:1A:2B:3C:4D:5E'); // 00:1A:2B:*:*:*
maskVehicle('京A12345'); // 京A*****
maskJwt('eyJhbGciOiJ9.eyJzdWIiOiJ9.sig'); // ********.********.********
maskIp('192.168.1.100'); // 192.168.*.*
maskUrl('https://u:p@example.com?token=s'); // credentials + token masked
maskGeneric('sensitive', { keepStart: 2, keepEnd: 2 }); // se******ve
```

---

## 6. Email

保留 domain（含子域）；默认遮盖 local part，并保留 `+tag`。

```ts
maskEmail('zhangsan@example.com'); // z******n@example.com
maskEmail('a@example.com'); // *@example.com
maskEmail('ab@example.com'); // a*@example.com
maskEmail('zhang.san@example.com'); // z*******n@example.com
maskEmail('user+tag@example.com'); // u**r+tag@example.com
maskEmail('user@mail.example.com'); // u**r@mail.example.com

maskEmail('zhangsan@example.com', { mask: '•' }); // z••••••n@example.com
maskEmail('zhangsan@example.com', { keepStart: 2, keepEnd: 3 });
// zh***san@example.com
maskEmail('user+tag@example.com', { maskTag: true }); // u******g@example.com
```

**错误行为：** 缺少 `@`、空 local/domain 或空输入 → **原样返回**。

---

## 7. Phone

保留分隔符（空格、`-`、`()`）、可选的 `+` 国家码，只遮盖中间**数字**。

```ts
maskPhone('13812345678'); // 138****5678
maskPhone('+8613812345678'); // +86138****5678
maskPhone('+1 415 555 1234'); // +1 415 *** 1234
maskPhone('(415) 555-1234'); // (415) ***-1234

maskPhone('13812345678', { keepStart: 3, keepEnd: 4, mask: '*' });
// 138****5678
```

国内号段默认：`keepStart: 3`、`keepEnd: 4`。国家码按内置 E.164 列表最长优先匹配。

**错误行为：** 无数字 / 空 → 原样返回。极短数字串会 clamp，尽量至少遮盖 1 位。

---

## 8. Name

按 token 处理中文与拉丁姓名（保留空白）。

```ts
maskName('张三'); // 张*
maskName('张三丰'); // 张*丰
maskName('欧阳娜娜'); // 欧**娜
maskName('John'); // J**n
maskName('John Smith'); // J**n S***h
maskName('Alice Johnson'); // A***e J*****n
```

规则：保留首 grapheme；token ≥ 3 个 grapheme 时保留末尾。

---

## 9. Address

默认：保留中文行政区划前缀（`省/市/区/县…`），遮盖其余；非中文 / 未匹配时回退为前 4 个 grapheme。

```ts
maskAddress('北京市朝阳区xxx街道xxx号'); // 北京市朝阳区*********

maskAddress('123 Main Street', { keepStart: 4 });
maskAddress(addr, { mask: '•', maskLength: 4 });
maskAddress(addr, { disableAutoPrefix: true, keepStart: 0 }); // 全遮盖
```

---

## 10. Credit card

保留分隔符（空格 / `-`）。按品牌感知的默认值：

| 形态          | 默认                             |
| ------------- | -------------------------------- |
| 16 位风格     | 保留末 4 → `**** **** **** 1111` |
| Amex（15 位） | 保留前 6 + 后 5                  |

```ts
maskCreditCard('4111111111111111'); // ************1111
maskCreditCard('4111 1111 1111 1111'); // **** **** **** 1111
maskCreditCard('4111-1111-1111-1111'); // ****-****-****-1111
maskCreditCard('378282246310005'); // 378282****10005
```

**校验与脱敏解耦** — 脱敏从不要求合法 PAN：

```ts
import { isLuhnValid } from 'masker';

isLuhnValid('4111111111111111'); // true
isLuhnValid('4111111111111112'); // false
maskCreditCard('4111111111111112'); // 仍会遮盖: ************1112
```

**错误行为：** 数字少于 12 位 → 原样返回。

---

## 10a. ID card

识别 18 位身份证（末位可为 `X`）与旧版 15 位。默认保留区划前 6 + 后 4。不做校验位验证。

```ts
maskIdCard('110101199001011234'); // 110101********1234
maskIdCard('110101199001011234', { keepStart: 0, keepEnd: 0 }); // ******************
```

---

## 10b. Bank account

与信用卡分离：长度更宽、无 PAN/Amex 规则、无 Luhn。支持 IBAN 风格字母数字账号。默认保留末 4。

```ts
maskBankAccount('6222021234567890123'); // ***************0123
maskBankAccount('6222 0212 3456 7890'); // **** **** **** 7890
maskBankAccount('GB29NABC60161331926819'); // ******************6819
```

---

## 10c. MAC address

支持冒号 / 横线 / Cisco 点分 / 裸 12 位十六进制。默认保留前 3 个八位组（OUI）。

```ts
maskMac('00:1A:2B:3C:4D:5E'); // 00:1A:2B:*:*:*
maskMac('00-1a-2b-3c-4d-5e'); // 00-1a-2b-*-*-*
maskMac('aabb.ccdd.eeff'); // aabb.cc**.****
```

---

## 10d. Vehicle（车牌 / VIN）

`maskVehicle` 自动识别 VIN（17 位）与车牌。默认：车牌保留前 2；VIN 保留前 3 + 后 4。

```ts
maskVehicle('京A12345'); // 京A*****
maskVehicle('1HGCM82633A004352'); // 1HG**********4352
maskLicensePlate('沪AD12345'); // 沪A******
maskVin('1HGCM82633A004352'); // 1HG**********4352
```

---

## 11. JWT

仅做结构切分 — **从不** base64 解码、从不验签、从不读 claims。

```ts
maskJwt(token);
// ********.********.********

maskJwt(token, { header: 'keep' });
// eyJhbGciOiJIUzI1NiJ9.********.********

maskJwt(token, { keepSegmentChars: 3 });
// eyJ********.********.********

maskJwt(token, { mask: '#', maskSegmentLength: 3 });
// ###.###.###
```

| 选项                | 默认     | 含义                       |
| ------------------- | -------- | -------------------------- |
| `header`            | `'mask'` | `'mask' \| 'keep'`         |
| `payload`           | `'mask'` | 仅在你能接受风险时保留     |
| `signature`         | `'mask'` | 通常保持遮盖               |
| `keepSegmentChars`  | `0`      | 每段保留的前缀长度         |
| `maskSegmentLength` | `8`      | 固定遮盖长度（隐藏段长度） |

**错误行为：** 非恰好三段且 header/payload 非空 → 原样返回。

---

## 12. IP

IPv4 与 IPv6 使用**独立**策略。

```ts
maskIp('192.168.1.100'); // 192.168.*.*
maskIp('192.168.1.100', { ipv4: { keepStart: 3 } }); // 192.168.1.*

maskIp('2001:db8:85a3:0:0:8a2e:370:7334'); // 2001:db8:*:*:*:*:*:*
maskIp('2001:db8::1'); // 2001:db8::*
maskIp(ip, { ipv6: { keepGroups: 4 } });
```

**错误行为：** 非法 IPv4/IPv6 / 空 → 原样返回。

---

## 13. URL

基于标准 `URL` / `URLSearchParams`（无巨型正则）。

默认：

- 凭据遮盖
- hostname + path 保留
- 敏感 query 值遮盖（`token`、`password`、`secret`、`api_key` 等）
- 其它 query 保留（`page=1`）
- fragment 遮盖

```ts
maskUrl('https://user:password@example.com/path');
// https://u***:******@example.com/path

maskUrl('https://example.com/api?token=secret&page=1');
// https://example.com/api?token=******&page=1

maskUrl(url, { query: ['token', 'password', 'secret'] });
maskUrl(url, { maskAllQuery: true });
maskUrl(url, { maskCredentials: false, maskFragment: false });
```

> 注意：`URL` 会规范化字符串（编码、默认端口、尾斜杠）。非法 / 相对 URL 原样返回。

---

## 14. Generic

```ts
maskGeneric('1234567890', { keepStart: 2, keepEnd: 2 }); // 12******90
maskGeneric('sensitive-value'); // ***************
maskGeneric('abc', { mask: '#' }); // ###
maskGeneric('1234567890', { keepStart: 2, keepEnd: 2, maskLength: 3 }); // 12***90
```

Unicode：

- 纯 ASCII → UTF-16 快路径
- 否则 → 可用时使用 `Intl.Segmenter` grapheme，否则 code point
- 支持 中文、日本語、 한국어、emoji（Segmenter 存在时含 ZWJ 序列）

**错误行为：** 空串 → `''`。`keepStart + keepEnd ≥ 长度` → 原样返回。

---

## 15. Object

深度、**非修改**脱敏，copy-on-write：未命中子树保持原引用。

```ts
const data = {
  id: 1,
  name: '张三',
  phone: '13812345678',
  profile: {
    address: '北京市朝阳区xxx',
    creditCard: '4111111111111111',
  },
};

const safe = maskObject(data, {
  name: 'name',
  phone: 'phone',
  'profile.address': 'address',
  'profile.creditCard': 'creditCard',
});

data !== safe; // true
data.name === '张三'; // 源数据未被改写
```

### `maskFields` — 路径/schema 精确规则

精确声明哪些路径使用什么 masker，支持 `{ type, options }` 对象写法：

```ts
import { maskFields } from 'masker';

maskFields(
  {
    user: {
      email: 'jane@company.com',
      phone: '+14155550123',
    },
  },
  {
    'user.email': { type: 'email' },
    'user.phone': { type: 'phone' },
  },
);
// → user.email: 'j**e@company.com'
// → user.phone: '+1415***0123'
```

规则值也可以是 preset 字符串（`'email'`）或自定义函数。通配符与 `maskObject` 相同。

支持的值：

| 类型                          | 行为                                           |
| ----------------------------- | ---------------------------------------------- |
| plain object                  | 仅在子节点变化时浅拷贝                         |
| array                         | 仅在元素变化时拷贝                             |
| 嵌套 / readonly               | 正常处理；冻结对象不会被写入                   |
| `Date` / `RegExp` / 二进制    | 按引用保留                                     |
| `Map` / `Set`                 | 仅在条目变化时克隆                             |
| `null` / `undefined` / 原始值 | 直接返回                                       |
| 循环引用                      | 环边复用原引用；不会死循环                     |
| `Error`                       | 路径模式下视为原子；`maskLog` 中会物化（见下） |

空 schema → 返回同一引用。

---

## 16. Schema / 路径

路径用 `.` 分隔。`*` 匹配**一个**对象键或数组下标。

```ts
maskObject(data, {
  email: 'email',
  'profile.address': 'address',
  'users.*.phone': 'phone',
  'users.*.email': maskEmail, // 函数形式
});
```

Preset 名称：`email` | `phone` | `name` | `address` | `creditCard` | `idCard` | `bankAccount` | `mac` | `vehicle` | `jwt` | `ip` | `url` | `generic`。

非法路径（`a..b`、空）或未知 preset 在**schema 编译期**抛出 **`TypeError`** — 永不 mid-walk，也永不打印输入值。

重复调用请预编译：

```ts
const masker = createMasker({
  'users.*.phone': 'phone',
  'profile.email': 'email',
});

masker.mask(payload); // schema 在 createMasker() 解析一次
```

---

## 17. Logger

字段名规则在**任意深度**生效（不同于路径 schema）：

```ts
maskLog(payload, {
  fields: {
    password: 'generic',
    token: 'generic',
    email: 'email',
    phone: 'phone',
  },
});
```

热路径预编译形式：

```ts
const masker = createMasker({
  fields: {
    password: 'generic',
    email: 'email',
    phone: 'phone',
  },
});

logger.info(masker.mask(data));
```

特性：

- 不修改日志对象
- 无 `JSON.stringify` / `parse`
- 处理嵌套对象、数组、`Map` / `Set`、循环引用
- `Error` 物化为 `{ name, message, stack }`，使 `fields.message` 可用

---

## 18. 自定义策略

传入任意 `(value: string) => string`：

```ts
import { maskObject, maskEmail } from 'masker';

const alwaysStars = (v: string) => '*'.repeat(v.length);

maskObject(data, {
  email: maskEmail,
  secret: alwaysStars,
  // 绑定 options
  phone: (v: string) => maskPhone(v, { mask: '#' }),
});
```

> `ValueMasker` 类型是逆变的（`(value: never) => string`），因此具体的 `(value: string) => string` 可干净赋值而无需断言。

---

## 19. 性能

使用的技术：

- 仅模块级常量正则（无每次调用 `new RegExp`）
- grapheme 分段前的 ASCII 快路径
- schema / path / preset 在 `createMasker()` / 编译阶段解析
- copy-on-write — 无规则命中时整棵子树跳过
- 数字位单趟扫描（phone / card）
- 原生 `URL` / `URLSearchParams`

运行内置基准（需先构建）：

```bash
npm run bench
# 或
npm run build && node benchmark/bench.mjs
# Bun（构建后）：
bun benchmark/bench.mjs
```

> **诚实说明：** 本 README 不引用绝对 ops/s 数字 — 请在你的机器与运行时上跑基准。开发环境**未**安装 Bun，因此不宣称 Bun 数字。

---

## 20. 安全说明

- 生产环境**不要**在脱敏输出旁同时打印原始输入以便调试。
- 本库抛出的错误类型只含**配置**信息（错误路径 / preset）— 从不嵌入你的数据值。
- JWT **payload 默认遮盖**；开启 `payload: 'keep'` 可能暴露 claims（PII、角色）。
- URL **敏感键 query 与 fragment 默认遮盖**；请审查自定义 `query` 列表。
- 脱敏**不是加密**，也不能替代访问控制。
- 请求 / 日志中间件中优先使用 `createMasker`，使规则错误在启动时暴露，而非每条请求。

---

## 21. API 参考

### 基础脱敏器

| 函数               | 签名                                                          | 非法输入                |
| ------------------ | ------------------------------------------------------------- | ----------------------- |
| `maskEmail`        | `(value: string, options?: EmailMaskOptions) => string`       | 原样返回                |
| `maskPhone`        | `(value: string, options?: PhoneMaskOptions) => string`       | 无数字 → 原样           |
| `maskName`         | `(value: string, options?: NameMaskOptions) => string`        | 空 → `''`               |
| `maskAddress`      | `(value: string, options?: AddressMaskOptions) => string`     | 空 → `''`               |
| `maskCreditCard`   | `(value: string, options?: CreditCardMaskOptions) => string`  | &lt;12 位数字 → 原样    |
| `maskIdCard`       | `(value: string, options?: IdCardMaskOptions) => string`      | 非 15/18 位 → 原样      |
| `maskBankAccount`  | `(value: string, options?: BankAccountMaskOptions) => string` | 过短 → 原样             |
| `maskMac`          | `(value: string, options?: MacMaskOptions) => string`         | 非法 → 原样             |
| `maskVehicle`      | `(value: string, options?: VehicleMaskOptions) => string`     | 未知 → 原样             |
| `maskLicensePlate` | `(value: string, options?: VehicleMaskOptions) => string`     | 非法 → 原样             |
| `maskVin`          | `(value: string, options?: VehicleMaskOptions) => string`     | 非 17 字符 → 原样       |
| `maskJwt`          | `(value: string, options?: JwtMaskOptions) => string`         | 形态错误 → 原样         |
| `maskIp`           | `(value: string, options?: IpMaskOptions) => string`          | 非法 → 原样             |
| `maskUrl`          | `(value: string, options?: UrlMaskOptions) => string`         | 非法 → 原样             |
| `maskGeneric`      | `(value: string, options?: SliceMaskOptions) => string`       | 空 → `''`               |
| `isLuhnValid`      | `(value: string) => boolean`                                  | 非字符串 / 空 → `false` |

运行时非字符串值（纯 JS 调用方）原样返回 — TypeScript 类型有意只接受 `string`。

### Object / logger

| 函数           | 签名                                                      |
| -------------- | --------------------------------------------------------- |
| `maskObject`   | `<T>(value: T, schema: ObjectSchema) => T`                |
| `maskFields`   | `<T>(value: T, fields: ObjectSchema) => T`                |
| `maskLog`      | `<T>(value: T, options?: MaskLogOptions) => T`            |
| `createMasker` | `(schema: ObjectSchema \| CreateMaskerOptions) => Masker` |

`Masker`：

```ts
interface Masker {
  mask<T>(value: T): T;
}
```

### Option 类型

`EmailMaskOptions`、`PhoneMaskOptions`、`NameMaskOptions`、`AddressMaskOptions`、`CreditCardMaskOptions`、`IdCardMaskOptions`、`BankAccountMaskOptions`、`MacMaskOptions`、`VehicleKind`、`VehicleMaskOptions`、`JwtMaskOptions`、`IpMaskOptions`、`Ipv4MaskOptions`、`Ipv6MaskOptions`、`UrlMaskOptions`、`SliceMaskOptions`、`BaseMaskOptions`、`ObjectSchema`、`FieldMap`、`MaskLogOptions`、`CreateMaskerOptions`、`SchemaMasker`、`MaskFieldConfig`、`PresetName`、`ValueMasker`、`Masker`。

### 抛错条件

| API                         | 抛出                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| `maskObject(value, schema)` | `schema` 非对象、路径非法或 preset 未知 → `TypeError`                                              |
| `createMasker(args)`        | `args` 为 null/非对象、空路径、未知 preset，或 options 不含 `fields` 也不含 `schema` → `TypeError` |
| 基础脱敏器                  | **数据类从不抛错** — 非法数据原样返回                                                              |

---

## 22. FAQ

**为什么只有 ESM？**  
双格式 CJS/ESM 会大致加倍打包面（条件导出、interop 边角）。现代 Node（18+）与 Bun 原生加载 ESM；打包器对 `sideEffects: false` 的 ESM 树摇友好。若有明确需求可再加 CJS。

**为什么 `maskCreditCard` 不校验卡号？**  
脱敏与校验是不同关注点。需要校验时请显式调用 `isLuhnValid`。

**`maskJwt` 会解码 payload 吗？**  
不会。只按 `.` 切分 `header.payload.signature`。无 base64、无 JSON。

**通配符性能如何？**  
路径在 `createMasker` / 首次 `maskObject` 时解析为 trie。每次对象遍历推进节点引用 — 不会每个键重复 `split('.')`。

**为什么 `ValueMasker` 类型是 `(value: never) => string`？**  
使函数参数逆变，从而 `(value: string) => string` 可无 `as any` 赋值，同时仍表达「我接受字符串」。

**会修改我的对象吗？**  
不会。Copy-on-write：只有真正变化的分支才浅拷贝。

**循环结构？**  
支持。遍历器用 `Set` 记录当前路径；环边返回原引用而不是死循环。

**Bun 支持？**  
库只用标准 JS（`URL`、`Intl.Segmenter`、普通对象）。无 `node:` 导入。开发环境未安装 Bun — 运行时支持是结构保证，而非本仓库执行过的 CI。

**CommonJS `require('masker')`？**  
不支持（见上）。CJS 中如需使用请 `await import('masker')`。

---

## 开发

```bash
npm install
npm run typecheck
npm test
npm run build
npm run lint
npm run format
npm run bench
```

## License

MIT

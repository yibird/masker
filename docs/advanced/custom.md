# Custom Maskers

Schema 的值既可以是内置 preset，也可以是任意 `(value: string) => string`。这让你在不 fork 库的情况下扩展策略。

## 函数直接引用

```ts
import { maskObject, maskEmail, maskPhone, maskName } from 'masker';

const masked = maskObject(user, {
  email: maskEmail,
  phone: maskPhone,
  name: maskName,
});
```

## 绑定自定义 options

闭包是最常见的「带配置 masker」写法：

```ts
import { maskObject, maskPhone, maskGeneric } from 'masker';

const pinPhone = (v: string) => maskPhone(v, { mask: '#', keepStart: 3, keepEnd: 4 });
const shortKey = (v: string) => maskGeneric(v, { keepStart: 4, keepEnd: 4, maskLength: 8 });

maskObject(payload, {
  phone: pinPhone,
  apiKey: shortKey,
});
```

## 完全自定义逻辑

```ts
import { maskObject } from 'masker';

/** 只保留前 4 位的内部工号 */
const maskEmployeeId = (v: string): string =>
  v.length <= 4 ? '*'.repeat(v.length) : v.slice(0, 4) + '*'.repeat(v.length - 4);

/** 按白名单域保留邮箱 domain */
const maskEmailKeepDomain = (v: string): string => {
  const at = v.indexOf('@');
  if (at <= 0) return v;
  const local = v.slice(0, at);
  const domain = v.slice(at);
  if (domain === '@corp.example.com') return v; // 内部域不脱敏
  return local[0]! + '*'.repeat(Math.max(1, local.length - 2)) + local.at(-1)! + domain;
};

const out = maskObject(row, {
  empId: maskEmployeeId,
  contact: maskEmailKeepDomain,
});
```

## 在 fields / createMasker 中使用

```ts
import { createMasker } from 'masker';

const masker = createMasker({
  fields: {
    password: (v: string) => '*'.repeat(Math.min(v.length, 8)),
    cookie: (v: string) => 'session=' + '*'.repeat(8),
    email: 'email',
  },
});
```

## ValueMasker 类型

公开类型是逆变写法，方便把 `(value: string) => string` 赋进去而无需断言：

```ts
import type { ValueMasker, SchemaMasker, PresetName } from 'masker';

type ValueMasker = (value: never) => string;
// 实际使用中：String 可赋给 never 参数位置（逆变），
// 因此下面这样是合法的：
const s: SchemaMasker = (v: string) => v.slice(0, 2) + '***';
```

## 自定义 Options 的模式（按类型）

不要试图用一个万能 `MaskOptions` 硬套所有类型 —— 库为每种数据提供了语义化接口：

| 类型        | 关键选项                                                              |
| ----------- | --------------------------------------------------------------------- |
| Email       | `keepStart` `keepEnd` `maskTag`                                       |
| Phone       | `keepStart` `keepEnd`（作用于国内号段）                               |
| Name        | `keepStart` `keepEnd`（按 token）                                     |
| Address     | `keepStart` `keepEnd` `maskLength` `disableAutoPrefix`                |
| CreditCard  | `keepStart` `keepEnd`（Amex 感知默认）                                |
| IdCard      | `keepStart` `keepEnd`                                                 |
| BankAccount | `keepStart` `keepEnd` `minLength`                                     |
| MAC         | `keepStart` `keepEnd`                                                 |
| Vehicle     | `kind` `keepStart` `keepEnd`                                          |
| JWT         | `header` `payload` `signature` `keepSegmentChars` `maskSegmentLength` |
| IP          | `ipv4.keepStart` `ipv6.keepGroups`                                    |
| URL         | `query` `maskAllQuery` `maskCredentials` `maskFragment`               |
| Generic     | `keepStart` `keepEnd` `maskLength`                                    |

完整字段见 [Types](/reference/types)。

## 约定

1. **纯函数**：相同输入 → 相同输出，不读全局可变状态
2. **不要 throw 数据错误**：非法字符串应原样返回或降级遮盖
3. **错误 message 不要拼接用户输入**（防日志二次泄露）
4. 热路径函数避免每次调用 `new RegExp` / `JSON.parse`

相关：[Generic](/maskers/generic) · [API](/reference/api)

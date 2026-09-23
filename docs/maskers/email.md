# Email

`maskEmail` 在**保留邮箱结构**的前提下遮盖 local part：`@`、domain、subdomain 默认原样保留；`+tag` 默认保留（许多系统用 tag 做路由，本身常非机密）。

```ts
function maskEmail(value: string, options?: EmailMaskOptions): string;
```

## 基础用法

<MaskExample fn="maskEmail" input="zhangsan@example.com" />

默认策略：local part **保留首尾 1 个 grapheme**，中间全部替换为 `mask`。

<MaskPair input="zhangsan@example.com" output="z******n@example.com" />

## 自定义 mask 字符

<MaskExample fn="maskEmail" input="john.doe@example.com" :options="{ mask: '#' }" />

<MaskPair input="zhangsan@example.com" output="z######n@example.com" note="mask: '#'（中间 6 位）" />

其它常用 token：`•`、`x`、`*`（默认）。

## 自定义保留位数

<MaskExample fn="maskEmail" input="zhangsan@example.com" :options="{ keepStart: 2, keepEnd: 3 }" />

<MaskPair input="zhangsan@example.com" output="zh***san@example.com" note="keepStart: 2, keepEnd: 3" />

## 边界情况

### 极短 local part

<MaskPair input="a@example.com" output="*@example.com" note="单字符 local → 整段遮住" />

<MaskPair input="ab@example.com" output="a*@example.com" note="两位：保留首字符，其余遮住" />

### plus tag

<MaskPair input="user+tag@example.com" output="u**r+tag@example.com" note="默认保留 +tag" />

<MaskExample fn="maskEmail" input="user+tag@example.com" :options="{ maskTag: true }" />

<MaskPair input="user+tag@example.com" output="u******g@example.com" note="maskTag: true — 整段 local 一起遮" />

### subdomain 与 domain

<MaskPair input="user@mail.example.com" output="u**r@mail.example.com" note="subdomain 不受影响" />

<MaskPair input="zhang.san@example.com" output="z*******n@example.com" note="local 内的点会落在遮盖区（长度 1:1）" />

### 非法输入

| 输入           | 输出                          |
| -------------- | ----------------------------- |
| `''`           | `''`                          |
| `invalid`      | `invalid`（原样返回，不抛错） |
| `@example.com` | `@example.com`                |
| `user@`        | `user@`                       |

## Unicode

local part 按 **grapheme cluster** 统计，中文邮箱别名不会把代理对拆开：

<MaskPair input="张三丰@example.com" output="张*丰@example.com" />

## Options

```ts
interface EmailMaskOptions {
  mask?: string; // 默认 '*'
  keepStart?: number; // 默认 1
  keepEnd?: number; // 默认 1
  maskTag?: boolean; // 默认 false
}
```

## 业务场景：注册用户列表导出

```ts
import { maskEmail, maskName, maskPhone } from 'masker';

const rows = [
  { name: '张三', email: 'zhangsan@example.com', phone: '13812345678' },
  { name: 'Alice Johnson', email: 'alice@corp.example.com', phone: '+1 415 555 0123' },
];

const exported = rows.map((r) => ({
  ...r,
  name: maskName(r.name),
  email: maskEmail(r.email),
  phone: maskPhone(r.phone),
}));
```

导出结果：

```text
[
  { name: '张*', email: 'z******n@example.com', phone: '138****5678' },
  { name: 'A***e J*****n', email: 'a***e@corp.example.com', phone: '+1 415 *** 0123' }
]
```

## 错误行为

**从不抛异常。** 非法 / 空邮箱原样返回。配置类型错误由 TypeScript 在编译期拦截。

相关：[Generic](/maskers/generic) · [Object Schema](/object/path-schema)

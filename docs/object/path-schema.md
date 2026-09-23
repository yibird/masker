# Path & Schema

Schema 是一张 **路径 → 脱敏规则** 的表。理解路径、通配符与 `createMasker` 预编译，才能把 masker 用在高 QPS 日志链路上。

## 为什么需要 Schema？

逐字段手写：

```ts
const safe = {
  ...user,
  email: maskEmail(user.email),
  phone: maskPhone(user.phone),
  profile: {
    ...user.profile,
    creditCard: maskCreditCard(user.profile.creditCard),
  },
};
```

问题：

1. 嵌套一层就要手动展开一层，漏字段难发现
2. 数组 / 地图结构要自己递归
3. 新增敏感字段要改所有调用点

Schema 把「哪里需要怎么遮」收成一张表：

```ts
const schema = {
  email: 'email',
  phone: 'phone',
  'profile.creditCard': 'creditCard',
  'users.*.email': 'email',
};

maskObject(user, schema);
```

## 路径语法

| 写法              | 含义                                                |
| ----------------- | --------------------------------------------------- |
| `email`           | 根上的 `email`                                      |
| `profile.address` | 嵌套对象                                            |
| `a.b.c.d`         | 任意深度                                            |
| `users.*.phone`   | `users` 下**每一项**（数组元素或 map 值）的 `phone` |
| `*`               | 匹配任意单键 / 单下标                               |

规则：

- 分隔符固定为 `.`
- 空段（`a..b`、`''.`、`a.`）→ 编译期 `TypeError`
- `*` **不**跨多层（`a.*` 不等于 `a.**`）
- 不存在的路径静默跳过（不是错误）

## Preset vs 对象规则 vs 函数

```ts
// preset —— 简洁
{
  email: 'email';
}

// { type, options } —— maskFields 推荐写法
{
  'user.email': { type: 'email' };
  'user.phone': { type: 'phone', options: { keepEnd: 4 } };
}

// 函数 —— 可绑定任意逻辑
import { maskPhone } from 'masker';
{
  phone: (v: string) => maskPhone(v, { mask: '#' });
}

// 直接引用（默认 options）
{
  email: maskEmail;
}
```

一次调用按路径精确指定（`maskFields`）：

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
```

未知字符串 preset / 未知 `type`：

```ts
{
  email: 'nope';
} // TypeError: Invalid masker…

{
  email: {
    type: 'nope';
  }
} // TypeError: Invalid masker type…
```

合法 preset 列表：

`email` `phone` `name` `address` `creditCard` `idCard` `bankAccount` `mac` `vehicle` `jwt` `ip` `url` `generic`

## 通配符实战

### 数组

```ts
const data = {
  users: [
    { email: 'a@x.com', phone: '13812345678' },
    { email: 'b@x.com', phone: '13999999999' },
  ],
};

const out = maskObject(data, {
  'users.*.email': 'email',
  'users.*.phone': 'phone',
});
```

```text
users[0].email → *@x.com
users[0].phone → 138****5678
users[1].email → *@x.com
users[1].phone → 139****9999
```

### 对象 Map

```ts
const groups = {
  a: { email: 'a@x.com' },
  b: { email: 'b@x.com' },
};

maskObject(groups, { '*': 'generic' });
// { a: '*******', b: '*******' } —— 规则打在值上时需注意类型

maskObject({ groups }, { 'groups.*.email': 'email' });
```

### 混合精确路径 + 通配符

```ts
maskObject(data, {
  email: 'email', // 精确
  'profile.secret': 'generic',
  'items.*.token': 'jwt',
});
```

实现上路径被编译成 **trie**：每次下探键时同时尝试「精确子节点」与「通配子节点」，**不会**在每次 `.mask()` 里重新 `split('.')`。

## createMasker — 预编译

```ts
import { createMasker } from 'masker';

const masker = createMasker({
  email: 'email',
  phone: 'phone',
  'users.*.phone': 'phone',
  'profile.creditCard': 'creditCard',
});

// 热路径
logger.info(masker.mask(payload));
```

### 解析发生在创建时

| 阶段             | 做什么                                          |
| ---------------- | ----------------------------------------------- |
| `createMasker()` | 解析路径、建 trie、解析 preset/函数、规范化配置 |
| `masker.mask()`  | 只遍历 + 应用，无 schema 解析                   |

### fields + schema 组合

`createMasker` 也可接受字段名模式（Logger 风格）：

```ts
const masker = createMasker({
  fields: {
    password: 'generic',
    token: 'generic',
    email: 'email',
  },
  schema: {
    'profile.creditCard': 'creditCard',
  },
});

masker.mask(user);
// 1) 先按路径 schema 走一遍
// 2) 再按字段名深度匹配 fields
```

仅 `fields`：

```ts
createMasker({ fields: { password: 'generic' } });
```

仅路径（简写）：

```ts
createMasker({ email: 'email', phone: 'phone' });
```

### 非法配置

```ts
createMasker(null); // TypeError
createMasker({ schema: { 'a..b': 'email' } }); // TypeError
createMasker({ fields: { x: 'nope' } }); // TypeError
createMasker({}); // 合法：no-op masker
```

## Type Safety

```ts
import type { ObjectSchema, SchemaMasker, PresetName } from 'masker';

const schema = {
  email: 'email',
  custom: (v: string) => v.slice(0, 2) + '***',
} satisfies ObjectSchema;
```

`satisfies` 可以在不拓宽类型的前提下检查 preset 名是否合法。

## 性能建议

| 场景                   | 推荐                                    |
| ---------------------- | --------------------------------------- |
| 启动时配置、每请求调用 | `createMasker`                          |
| 测试 / 脚本 / 单次转换 | `maskObject(value, schema)`             |
| 只按字段名、结构不定   | `maskLog` 或 `createMasker({ fields })` |

相关：[Nested & Arrays](/object/nested-arrays) · [Performance](/advanced/performance) · [API](/reference/api)

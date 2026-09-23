# Nested & Arrays

真实业务对象很少是扁平的。本页集中展示嵌套、数组、Map/Set、循环引用与 readonly 的行为。

## 深嵌套对象

```ts
import { maskObject } from 'masker';

const payload = {
  id: 'evt_01',
  actor: {
    id: 7,
    profile: {
      email: 'zhangsan@example.com',
      phone: '13812345678',
      private: {
        ssnLike: '11010119900101',
        note: 'internal',
      },
    },
  },
};

const safe = maskObject(payload, {
  'actor.profile.email': 'email',
  'actor.profile.phone': 'phone',
  'actor.profile.private.ssnLike': (v: string) =>
    v.length > 6 ? v.slice(0, 6) + '********' : '********',
});
```

```text
safe.actor.profile.email             → z******n@example.com
safe.actor.profile.phone             → 138****5678
safe.actor.profile.private.ssnLike   → 110101********
safe.actor.profile.private.note      → internal   （未配置，原样）
payload 本身保持不变
```

## 数组

### 元素级字段

```ts
const data = {
  users: [
    { name: 'Alice', email: 'alice@x.com' },
    { name: 'Bob', email: 'bob@x.com' },
    { name: '张三', email: 'zhangsan@x.com' },
  ],
};

const out = maskObject(data, {
  'users.*.name': 'name',
  'users.*.email': 'email',
});
```

```text
[
  { name: 'A***e', email: '*@x.com' },
  { name: 'B*', email: '*@x.com' },
  { name: '张*', email: 'z******n@x.com' },
]
```

### 整段数组值

若规则打在数组字段本身且值是 `string[]`，只有**字符串叶子**会应用 masker：

```ts
maskObject({ tokens: ['aaa.bbb.ccc'] }, { tokens: 'jwt' });
// 规则在 tokens 上；实现会尝试对字符串叶子施加当前路径上的 terminal
```

> 实践中更稳妥：对数组元素内部字段使用 `*`，例如 `'tokens.*': 'jwt'`。

### 稀疏 / 混合数组

```ts
const arr = [null, undefined, { email: 'a@b.com' }, 42];

maskObject({ list: arr }, { 'list.*.email': 'email' });
// list[0] → null
// list[1] → undefined
// list[2].email → *@b.com
// list[3] → 42
```

## Map 与 Set

```ts
const src = {
  m: new Map<string, string>([['email', 'a@b.com']]),
  s: new Set(['x']),
};

const out = maskObject(src, { 'm.email': 'email' });
// out.m.get('email') → *@b.com
// out.m !== src.m（Map 被克隆）
// out.s === src.s（无变更）
// src.m 仍是 a@b.com
```

`Set` 元素没有键名，path 规则通常打不中；请在外层先展开成数组，或使用 `maskLog` 仅处理带键结构。

## Date / 原子值

```ts
const src = {
  createdAt: new Date('2020-01-01T00:00:00Z'),
  flag: true,
  n: 1,
  z: null,
  u: undefined,
};

maskObject(src, { email: 'email' }) === src; // true，无变更
// Date 保持同一引用，绝不会被克隆成 {} 或字符串
```

## Readonly / frozen

```ts
const src = Object.freeze({
  name: '张三',
  profile: Object.freeze({ email: 'a@b.com' }),
});

const out = maskObject(src, {
  name: 'name',
  'profile.email': 'email',
});
// out.name → 张*
// out.profile.email → *@b.com
// 源对象未被写入（不会抛 strict mode 错误）
```

## 循环引用

```ts
type Node = { email: string; self?: Node };

const src: Node = { email: 'a@b.com' };
src.self = src;

const out = maskObject(src, { email: 'email' });
// out.email → *@b.com
// out.self === src 或 out —— 不会 RangeError
// src.email 仍为 a@b.com
```

实现使用当前路径上的 `Set<object>`；检测到环时返回**原引用**（copy-on-write 下避免无限克隆）。

## Copy-on-Write 细节

```ts
const out = maskObject(big, { name: 'name' });
// 若 big.profile / big.users 子树上没有任何规则命中：
out.profile === big.profile; // true
out.users === big.users; // true
```

只有真正发生变化的分支才会 `{ ...parent}`。空 schema 时：

```ts
maskObject(big, {}) === big; // true
```

## 与 maskLog 的差异（Error）

|          | `maskObject`   | `maskLog`                                     |
| -------- | -------------- | --------------------------------------------- |
| `Error`  | 原子，原样引用 | 物化为 `{ name, message, stack }` 再套 fields |
| 匹配方式 | 路径           | 字段名任意深度                                |

详见 [Logger](/advanced/logger)。

相关：[maskObject](/object/overview) · [Path & Schema](/object/path-schema)

# maskObject

`maskObject` 按 **schema（路径 → 规则）** 深度遍历并脱敏，**默认不修改输入**，且采用 copy-on-write：没有规则命中的子树保持原引用，避免无意义深拷贝。

```ts
function maskObject<T>(value: T, schema: ObjectSchema): T;
```

## 完整示例

```ts
import { maskObject } from 'masker';

const user = {
  id: 10001,
  name: '张三',
  email: 'zhangsan@example.com',
  phone: '13812345678',
  profile: {
    address: '北京市朝阳区xxx街道xxx号',
    creditCard: '4111111111111111',
  },
};

const masked = maskObject(user, {
  name: 'name',
  email: 'email',
  phone: 'phone',
  'profile.address': 'address',
  'profile.creditCard': 'creditCard',
});
```

### Before

```json
{
  "id": 10001,
  "name": "张三",
  "email": "zhangsan@example.com",
  "phone": "13812345678",
  "profile": {
    "address": "北京市朝阳区xxx街道xxx号",
    "creditCard": "4111111111111111"
  }
}
```

### After（实际结构）

```json
{
  "id": 10001,
  "name": "张*",
  "email": "z******n@example.com",
  "phone": "138****5678",
  "profile": {
    "address": "北京市朝阳区*********",
    "creditCard": "************1111"
  }
}
```

### 不可变性

```ts
masked !== user; // true
user.name === '张三'; // 源数据未被改写
```

未写进 schema 的 `id` 以及**未命中的兄弟字段**保持原值；`profile` 若整体被改动会得到浅拷贝，未改动的 `users` 等子树仍可能 `===` 原引用（见下方）。

## Schema 里的三种写法

### 1. Preset 名称字符串

```ts
maskObject(data, {
  email: 'email',
  phone: 'phone',
});
```

可用 preset：`email` · `phone` · `name` · `address` · `creditCard` · `idCard` · `bankAccount` · `mac` · `vehicle` · `jwt` · `ip` · `url` · `generic`

### 2. `{ type, options }` 对象规则（`maskFields` 同款）

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

// 带 options：
maskFields(data, {
  email: { type: 'email', options: { keepStart: 2, keepEnd: 2 } },
  secret: { type: 'generic', options: { keepStart: 2, keepEnd: 2, mask: '#' } },
});
```

`maskObject` / `maskLog` 的 `fields` / `createMasker` 同样接受该对象写法。

### 3. 函数（自带 options）

```ts
import { maskObject, maskEmail, maskPhone, maskGeneric } from 'masker';

maskObject(data, {
  email: maskEmail,
  phone: (v: string) => maskPhone(v, { mask: '#' }),
  secret: (v: string) => maskGeneric(v, { keepStart: 2, keepEnd: 2 }),
});
```

## 深层路径

路径用 `.` 连接，任意深度：

```ts
maskObject(data, {
  'account.billing.card': 'creditCard',
  'meta.device.fingerprint': 'generic',
});
```

## 通配符 `*`

`*` 匹配**一个**对象键或数组下标（详见 [Path & Schema](/object/path-schema)）：

```ts
maskObject(data, {
  'users.*.email': 'email',
  'users.*.phone': 'phone',
});
```

## 支持的值类型

| 类型                                    | 行为                                                         |
| --------------------------------------- | ------------------------------------------------------------ |
| plain object                            | 有变更才浅拷贝                                               |
| array                                   | 有变更才拷贝                                                 |
| readonly / `Object.freeze`              | 只读遍历，不写入源                                           |
| `Date` / `RegExp` / TypedArray          | 引用保留                                                     |
| `Map` / `Set`                           | 有变更才克隆                                                 |
| `null` / `undefined` / number / boolean | 直接返回                                                     |
| 循环引用                                | 当前栈 `Set` 检测，环边回指原引用，不死循环                  |
| `Error`                                 | path 模式下视为原子（不展开）；`maskLog` 会展开（见 Logger） |

## 空 Schema

```ts
maskObject(data, {}) === data; // true —— 不拷贝
```

## 配置错误会抛错

与「数据非法返回原值」不同，**schema 配置错误**在编译期抛 `TypeError`（且不把业务数据写进 message）：

```ts
maskObject(data, null); // TypeError
maskObject(data, { 'a..b': 'email' }); // TypeError 空路径段
maskObject(data, { email: 'nope' }); // TypeError 未知 preset
```

热路径请改用 [`createMasker`](/object/path-schema#createmasker) 在启动时编译一次。

同一 **schema 对象引用** 会命中 `WeakMap` 缓存（见 [Performance](/advanced/performance)）；首次使用后请勿就地改键。

## 业务场景：HTTP Response

```ts
import { maskObject } from 'masker';

const userSchema = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  'profile.address': 'address',
  'profile.creditCard': 'creditCard',
} as const;

app.get('/api/me', (c) => {
  const user = await findUser(c.req.param('id'));
  return c.json(maskObject(user, userSchema));
});
```

::: tip 原则
对外响应只返回 `maskObject` 的结果；**永远不要**先 `console.log(user)` 再脱敏。
:::

相关：[Path & Schema](/object/path-schema) · [Nested & Arrays](/object/nested-arrays) · [Recipes](/advanced/recipes)

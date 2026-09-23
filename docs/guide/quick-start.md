# Quick Start

五分钟从安装到接入日志。

## 1. 单字段脱敏

```ts
import { maskEmail, maskPhone, maskName, maskCreditCard } from 'masker';

maskEmail('zhangsan@example.com');
// z******n@example.com

maskPhone('13812345678');
// 138****5678

maskName('张三丰');
// 张*丰

maskCreditCard('4111 1111 1111 1111');
// **** **** **** 1111
```

## 2. 对象 + Schema

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

const safe = maskObject(user, {
  name: 'name',
  email: 'email',
  phone: 'phone',
  'profile.address': 'address',
  'profile.creditCard': 'creditCard',
});

console.log(safe);
```

输出：

```text
{
  id: 10001,
  name: '张*',
  email: 'z******n@example.com',
  phone: '138****5678',
  profile: {
    address: '北京市朝阳区*********',
    creditCard: '************1111'
  }
}
```

`user` **不会被修改**（`safe !== user`）。

## 3. 热路径：预编译 Masker

每次 `maskObject` 都会解析 schema。日志 / 中间件请用 `createMasker` 只编译一次：

```ts
import { createMasker } from 'masker';

const masker = createMasker({
  email: 'email',
  phone: 'phone',
  'profile.creditCard': 'creditCard',
  'users.*.phone': 'phone',
});

// 每次请求 / 每条日志
const out = masker.mask(payload);
```

## 4. Logger 字段规则

路径写不清、字段出现在任意深度时，用 `fields`（字段名匹配）：

```ts
import { maskLog, createMasker } from 'masker';

const logMasker = createMasker({
  fields: {
    password: 'generic',
    token: 'generic',
    authorization: 'generic',
    email: 'email',
    phone: 'phone',
  },
});

logger.info('User login', logMasker.mask(user));
```

等价的一次性写法：

```ts
maskLog(user, {
  fields: {
    password: 'generic',
    email: 'email',
  },
});
```

## 5. 自定义选项

```ts
import { maskPhone, maskEmail } from 'masker';

maskPhone('13812345678', { keepStart: 3, keepEnd: 4, mask: '*' });
// 138****5678

maskEmail('zhangsan@example.com', { mask: '•' });
// z••••••n@example.com
```

## 下一步

- 逐个深入 → [Maskers](/maskers/email)
- 对象与通配符 → [Path & Schema](/object/path-schema)
- 完整业务配方 → [Recipes](/advanced/recipes)
- 动手调参 → [Playground](/playground)

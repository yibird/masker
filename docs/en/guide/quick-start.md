# Quick Start

From install to logger integration in five minutes.

## 1. Mask a single field

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

## 2. Objects + schema

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

Output:

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

`user` **is never mutated** (`safe !== user`).

## 3. Hot paths: precompiled maskers

Every `maskObject` call parses its schema. For logs and middleware, use `createMasker` to compile once:

```ts
import { createMasker } from 'masker';

const masker = createMasker({
  email: 'email',
  phone: 'phone',
  'profile.creditCard': 'creditCard',
  'users.*.phone': 'phone',
});

// per request / per log line
const out = masker.mask(payload);
```

## 4. Logger field rules

When paths are hard to pin down, or fields appear at any depth, use `fields` (match by field name):

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

The equivalent one-shot form:

```ts
maskLog(user, {
  fields: {
    password: 'generic',
    email: 'email',
  },
});
```

## 5. Custom options

```ts
import { maskPhone, maskEmail } from 'masker';

maskPhone('13812345678', { keepStart: 3, keepEnd: 4, mask: '*' });
// 138****5678

maskEmail('zhangsan@example.com', { mask: '•' });
// z••••••n@example.com
```

## Next steps

- Go deeper, one masker at a time → [Maskers](/en/maskers/email)
- Objects and wildcards → [Path & Schema](/en/object/path-schema)
- Full real-world recipes → [Recipes](/en/advanced/recipes)
- Tweak parameters live → [Playground](/en/playground)

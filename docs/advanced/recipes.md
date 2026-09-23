# Recipes

面向真实业务的可复制配方。所有 API 均与 [API Reference](/reference/api) 一致。

## 1. API Response

对外返回前统一过 schema：

```ts
import { maskObject, createMasker } from 'masker';

const userViewSchema = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  'profile.address': 'address',
  'profile.creditCard': 'creditCard',
} as const;

const userViewMasker = createMasker({ schema: userViewSchema });

export function toUserView(user: User) {
  return userViewMasker.mask(user);
}

// GET /api/users/:id
app.get('/api/users/:id', async (c) => {
  const user = await findUser(c.req.param('id'));
  return c.json(toUserView(user));
});
```

## 2. Logger（结构化）

见 [Logger](/advanced/logger)。最小闭环：

```ts
import { createMasker } from 'masker';

const masker = createMasker({
  fields: {
    password: 'generic',
    token: 'generic',
    email: 'email',
    phone: 'phone',
  },
});

logger.info('User login', masker.mask(user));
```

```text
User login {
  id: 1001,
  name: '张三',
  email: 'z******n@example.com',
  phone: '138****5678',
  password: '******'
}
```

## 3. Audit Log

审计需要「谁、何时、做了什么」，但不需要卡号明文：

```ts
import { maskObject } from 'masker';

type AuditEvent = {
  action: 'payment.create';
  actorId: string;
  at: string;
  detail: {
    amount: number;
    pan: string;
    email: string;
  };
};

const auditSchema = {
  'detail.pan': 'creditCard',
  'detail.email': 'email',
} as const;

export function saveAuditLog(e: AuditEvent) {
  return db.audit.insert(maskObject(e, auditSchema));
  // amount / actorId / action 保持可检索
}
```

## 4. Error Log

错误对象与上下文一起脱敏后再输出：

```ts
import { maskLog } from 'masker';

const errorMaskerFields = {
  message: 'generic',
  stack: 'generic',
  email: 'email',
  password: 'generic',
  token: 'generic',
} as const;

export function logError(err: Error, context: Record<string, unknown>) {
  logger.error(maskLog({ err, context }, { fields: { ...errorMaskerFields } }));
}
```

> 若希望保留错误 **类型名** 便于排查，只遮 `message` / `stack` 中的 PII 模式，而不是整条 message —— 可改用自定义函数。

## 5. HTTP Request 入口

对 `headers` / `query` / `body` / `cookies` 分层处理：

```ts
import { createMasker, maskUrl } from 'masker';

const headerMasker = createMasker({
  fields: {
    authorization: 'generic',
    cookie: 'generic',
    'set-cookie': 'generic',
    'x-api-key': 'generic',
  },
});

const bodyMasker = createMasker({
  fields: {
    password: 'generic',
    passwordConfirm: 'generic',
    token: 'generic',
    email: 'email',
    phone: 'phone',
    cardNumber: 'creditCard',
  },
});

export function sanitizeRequest(req: {
  headers: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  url: string;
}) {
  return {
    url: maskUrl(req.url),
    headers: headerMasker.mask(req.headers),
    query: bodyMasker.mask(req.query),
    body: bodyMasker.mask(req.body),
  };
}
```

### cookies

Cookie 名不固定时，用字段名规则覆盖常见敏感名，或对整串做自定义：

```ts
const cookieMasker = (v: string) =>
  v.replace(/(session|token|auth)=([^;]+)/gi, (_m, k: string) => `${k}=` + '*'.repeat(8));

cookieMasker('theme=dark; session=abc123; token=xyz');
// theme=dark; session=********; token=********
```

## 6. 导出 CSV / 客服工单

```ts
import { maskEmail, maskName, maskPhone, maskGeneric } from 'masker';

const rows = users.map((u) => ({
  id: u.id,
  name: maskName(u.name),
  email: maskEmail(u.email),
  phone: maskPhone(u.phone),
  internalNote: maskGeneric(u.internalNote, { keepStart: 0, keepEnd: 0 }),
}));
```

## 7. 仅内部可见字段剥离

有时比「遮盖」更合适的是**删除**：

```ts
function stripSecrets<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const { password: _p, token: _t, ...rest } = obj;
  return rest;
}
```

遮盖适合「审计仍需知道字段存在」；删除适合「下游根本不该看到」。

## 8. 组合：URL + 对象

URL 与对象 schema 可以叠在同一 `maskObject` 里（schema 值直接挂函数）：

```ts
import { maskObject, maskUrl, maskEmail } from 'masker';

const row = {
  id: 1,
  homepage: 'https://user:pass@example.com/?token=secret',
  owner: { email: 'a@b.com' },
};

const out = maskObject(row, {
  homepage: maskUrl, // 函数形式
  'owner.email': 'email',
});
// out.homepage → https://u***:***…@example.com/?token=******
// out.owner.email → *@b.com
```

或手工组合：

```ts
const out = {
  ...row,
  homepage: maskUrl(row.homepage),
  owner: { email: maskEmail(row.owner.email) },
};
```

## 检查清单

1. 敏感字段是否都有 schema / fields 覆盖？
2. 是否在 **输出边界** 脱敏，而不是只在 UI？
3. 调试日志是否可能打印原文？
4. 错误 `stack` 是否含 message？
5. 热路径是否 `createMasker` 预编译？

相关：[Logger](/advanced/logger) · [Security](/advanced/security)

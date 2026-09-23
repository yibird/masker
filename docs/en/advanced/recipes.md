# Recipes

Copy-ready recipes for real-world scenarios. Every API matches the [API Reference](/en/reference/api).

## 1. API Response

Run everything through a schema before returning:

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

## 2. Logger (structured)

See [Logger](/en/advanced/logger). Minimal end-to-end setup:

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

Audits need who / when / what, but not a plaintext card number:

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
  // amount / actorId / action remain searchable
}
```

## 4. Error Log

Mask the error object together with its context before logging:

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

> If you want to keep the error **type name** for debugging, only mask PII patterns in `message` / `stack` rather than the whole message — switch to a custom function.

## 5. HTTP Request entry point

Handle `headers` / `query` / `body` / `cookies` in layers:

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

When cookie names are not fixed, use field-name rules for common sensitive names, or a custom masker over the whole string:

```ts
const cookieMasker = (v: string) =>
  v.replace(/(session|token|auth)=([^;]+)/gi, (_m, k: string) => `${k}=` + '*'.repeat(8));

cookieMasker('theme=dark; session=abc123; token=xyz');
// theme=dark; session=********; token=********
```

## 6. CSV export / support tickets

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

## 7. Strip internal-only fields

Sometimes **removing** fields is better than masking them:

```ts
function stripSecrets<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const { password: _p, token: _t, ...rest } = obj;
  return rest;
}
```

Masking fits when audit still needs to know a field existed; removal fits when the downstream must not see it at all.

## 8. Combine: URL + object

URL and object schemas can stack in the same `maskObject` call (schema values can be functions):

```ts
import { maskObject, maskUrl, maskEmail } from 'masker';

const row = {
  id: 1,
  homepage: 'https://user:pass@example.com/?token=secret',
  owner: { email: 'a@b.com' },
};

const out = maskObject(row, {
  homepage: maskUrl, // function form
  'owner.email': 'email',
});
// out.homepage → https://u***:***…@example.com/?token=******
// out.owner.email → *@b.com
```

Or compose by hand:

```ts
const out = {
  ...row,
  homepage: maskUrl(row.homepage),
  owner: { email: maskEmail(row.owner.email) },
};
```

## Checklist

1. Are all sensitive fields covered by schema / fields?
2. Are you masking at the **output boundary**, not only in the UI?
3. Could debug logs print raw values?
4. Does the error `stack` embed the `message`?
5. Is the hot path precompiled with `createMasker`?

Related: [Logger](/en/advanced/logger) · [Security](/en/advanced/security)

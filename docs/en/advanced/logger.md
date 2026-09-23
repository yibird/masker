# Logger

High-frequency logging is masker’s main arena: **no mutation of the original object, no `JSON.stringify`, precompilable field rules**.

## Core API

```ts
maskLog<T>(value: T, options?: MaskLogOptions): T

createMasker({ fields, schema }): Masker
// masker.mask(value)
```

`fields` match **by field name** at any depth (unlike path schemas).

## Basic: login log

```ts
import { maskLog } from 'masker';

const user = {
  id: 1001,
  name: '张三',
  email: 'zhangsan@example.com',
  phone: '13812345678',
  password: 'secret',
};

const line = maskLog(user, {
  fields: {
    password: 'generic',
    email: 'email',
    phone: 'phone',
    name: 'name',
  },
});
```

Output:

```text
{
  id: 1001,
  name: '张*',
  email: 'z******n@example.com',
  phone: '138****5678',
  password: '******'
}
```

`user` is still plaintext — only `line` should go into logs.

## Precompile (recommended for hot paths)

Every `maskLog` call compiles the `fields` map. In middleware / loggers, compile once:

```ts
import { createMasker } from 'masker';

const logMasker = createMasker({
  fields: {
    password: 'generic',
    passwd: 'generic',
    token: 'generic',
    accessToken: 'generic',
    refreshToken: 'generic',
    authorization: 'generic',
    cookie: 'generic',
    setCookie: 'generic',
    email: 'email',
    phone: 'phone',
    mobile: 'phone',
    idCard: 'generic',
    creditCard: 'creditCard',
    cardNumber: 'creditCard',
    ip: 'ip',
  },
});

const logger = {
  info(msg: string, data?: unknown) {
    // swap in pino / winston / console in real projects
    console.log(msg, data === undefined ? '' : logMasker.mask(data));
  },
};

logger.info('User login', user);
```

## Deep nesting and arrays

```ts
const event = {
  type: 'checkout',
  cart: {
    items: [{ email: 'buyer@x.com', phone: '13812345678' }],
  },
  payment: {
    card: '4111111111111111',
  },
};

logMasker.mask(event);
// event.cart.items[0].email → *@x.com   (fields contains email)
// event.payment.card field name is card — skipped if fields has no card
// Put real field names like cardNumber / creditCard into fields
```

Field-name matching is a **depth-first key scan**, not a path you must get right — ideal for log bodies whose shapes drift.

## Error objects

`maskLog` **materializes** `Error` into an enumerable structure; otherwise `message` cannot be hit by key:

```ts
import { maskLog } from 'masker';

const err = new Error('user a@b.com failed');

const out = maskLog({ err }, { fields: { message: 'generic' } });
// out.err →
// {
//   name: 'Error',
//   message: '*******************',  // mask of the same length as the original message
//   stack: 'Error: user a@b.com failed\n    at …'  // stack is NOT auto-masked!
// }
```

::: warning
`stack` often embeds the original `message`. If `fields` does not handle `stack`, replace it yourself or set `stack` to `'generic'` as well:

```ts
fields: { message: 'generic', stack: 'generic' }
```

:::

In `maskObject` path mode, `Error` is treated as atomic and is **not** expanded automatically.

## Cycles and performance

- A path-stack `Set` prevents cycles; no stack overflow
- Copy-on-write: sibling nodes that did not match keep their references
- **No** `JSON.parse(JSON.stringify(…))`
- **No** per-call path `split`

## Framework examples

### Express

```ts
import express from 'express';
import { createMasker } from 'masker';

const masker = createMasker({
  fields: {
    password: 'generic',
    token: 'generic',
    authorization: 'generic',
    email: 'email',
    phone: 'phone',
  },
});

const app = express();
app.use(express.json());

app.use((req, _res, next) => {
  // log only the masked body; do not use raw req.body for business logic here
  console.log('req', {
    method: req.method,
    path: req.path,
    query: masker.mask(req.query),
    body: masker.mask(req.body),
  });
  next();
});
```

### Fastify

```ts
import Fastify from 'fastify';
import { createMasker } from 'masker';

const masker = createMasker({
  fields: { password: 'generic', email: 'email', authorization: 'generic' },
});

const app = Fastify();

app.addHook('onResponse', async (req, reply) => {
  req.log.info({
    url: req.url,
    status: reply.statusCode,
    body: masker.mask(req.body),
  });
});
```

### Hono

```ts
import { Hono } from 'hono';
import { createMasker } from 'masker';

const masker = createMasker({
  fields: { password: 'generic', token: 'generic' },
});

const app = new Hono();

app.use('*', async (c, next) => {
  const clone = { ...c.req.header() };
  console.log('headers', masker.mask(clone));
  await next();
});
```

### Bun.logger / custom sink

```ts
import { createMasker } from 'masker';

const masker = createMasker({
  fields: { password: 'generic', email: 'email', phone: 'phone' },
});

export function log(obj: Record<string, unknown>) {
  Bun.write(Bun.file('app.log'), JSON.stringify(masker.mask(obj)) + '\n', { create: true });
}
```

### Structured logger wrapper

```ts
import { createMasker } from 'masker';
import type { Logger } from 'pino';

const masker = createMasker({
  fields: {
    password: 'generic',
    token: 'generic',
    email: 'email',
    phone: 'phone',
    creditCard: 'creditCard',
  },
});

export function safeInfo(logger: Logger, msg: string, data: object) {
  logger.info(masker.mask(data), msg);
}
```

## Design checklist

- [ ] `fields` cover real field names (`passwd` vs `password`, `accessToken` vs `access_token`)
- [ ] `stack` / custom messages have been reviewed
- [ ] Use `createMasker` instead of `maskLog` on every line
- [ ] Do not pass unmasked objects into debug tools
- [ ] Authorization / Cookie headers are handled once at the entry point

Related: [Recipes](/en/advanced/recipes) · [Security](/en/advanced/security) · [Performance](/en/advanced/performance)

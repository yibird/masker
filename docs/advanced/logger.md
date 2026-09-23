# Logger

高频日志是 masker 的主战场：**不改原始对象、不走 JSON.stringify、可预编译字段规则**。

## 核心 API

```ts
maskLog<T>(value: T, options?: MaskLogOptions): T

createMasker({ fields, schema }): Masker
// masker.mask(value)
```

`fields` 按**字段名**在任意深度匹配（与路径 schema 不同）。

## 基础：登录日志

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

输出：

```text
{
  id: 1001,
  name: '张*',
  email: 'z******n@example.com',
  phone: '138****5678',
  password: '******'
}
```

`user` 仍为明文 —— 只有 `line` 可以进日志。

## 预编译（推荐热路径）

每次 `maskLog` 都要编译 `fields` map。中间件 / logger 里请只编译一次：

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
    // 实际项目换成 pino / winston / console
    console.log(msg, data === undefined ? '' : logMasker.mask(data));
  },
};

logger.info('User login', user);
```

## 深层与数组

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
// event.cart.items[0].email → *@x.com   （fields 含 email）
// event.payment.card 字段名是 card —— 若 fields 未配置 card 则不处理
// 请把 cardNumber / creditCard 等真实字段名写进 fields
```

字段名匹配是**深度优先扫 key**，不依赖你写对路径 —— 适合结构会漂移的 log body。

## Error 对象

`maskLog` 会把 `Error` **物化**为可枚举结构，否则 `message` 无法按 key 命中：

```ts
import { maskLog } from 'masker';

const err = new Error('user a@b.com failed');

const out = maskLog({ err }, { fields: { message: 'generic' } });
// out.err →
// {
//   name: 'Error',
//   message: '*******************',  // 长度与原 message 相同的遮盖
//   stack: 'Error: user a@b.com failed\n    at …'  // stack 默认不自动遮！
// }
```

::: warning
`stack` 往往嵌有原始 `message`。若 fields 未处理 `stack`，请自行替换或把 `stack` 也设为 `'generic'`：

```ts
fields: { message: 'generic', stack: 'generic' }
```

:::

`maskObject` 路径模式下 `Error` 视为原子，**不会**自动展开。

## 循环引用与性能

- 路径栈 `Set` 防环，不会栈溢出
- copy-on-write：未命中字段的兄弟节点保持引用
- **没有** `JSON.parse(JSON.stringify(…))`
- **没有** 每次调用的路径 `split`

## 框架示例

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
  // 只记录脱敏后的 body，不碰 req.body 原文用于业务
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

### Bun.logger / 自定义 sink

```ts
import { createMasker } from 'masker';

const masker = createMasker({
  fields: { password: 'generic', email: 'email', phone: 'phone' },
});

export function log(obj: Record<string, unknown>) {
  Bun.write(Bun.file('app.log'), JSON.stringify(masker.mask(obj)) + '\n', { create: true });
}
```

### 结构化 Logger 封装

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

## 设计检查清单

- [ ] `fields` 覆盖真实字段名（`passwd` vs `password`、`accessToken` vs `access_token`）
- [ ] `stack` / 自定义 message 已评估
- [ ] 用 `createMasker` 而非每条日志 `maskLog`
- [ ] 不要把未脱敏对象再传给 debug 工具
- [ ] Authorization / Cookie 头在入口统一处理

相关：[Recipes](/advanced/recipes) · [Security](/advanced/security) · [Performance](/advanced/performance)

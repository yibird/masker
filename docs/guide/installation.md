# Installation

## 要求

| 环境       | 版本                              |
| ---------- | --------------------------------- |
| Node.js    | ≥ 18                              |
| Bun        | 当前稳定版（无 `node:` 专属依赖） |
| TypeScript | ≥ 5.x（推荐）                     |
| 模块格式   | **仅 ESM**（`"type": "module"`）  |

## 包管理器

```bash
npm install masker
```

```bash
pnpm add masker
```

```bash
yarn add masker
```

```bash
bun add masker
```

## Node.js

```ts
import { maskEmail, maskPhone } from 'masker';

console.log(maskEmail('zhangsan@example.com'));
// z******n@example.com
```

## Bun

```ts
import { maskObject, createMasker } from 'masker';

const masker = createMasker({
  fields: {
    password: 'generic',
    email: 'email',
    phone: 'phone',
  },
});

Bun.serve({
  fetch(req) {
    return Response.json(masker.mask({ ok: true }));
  },
});
```

库内只使用标准 JS（`URL`、`Intl.Segmenter`、普通对象），**不 import 任何 `node:*` 模块**，因此 Bun / 浏览器打包均可直接使用。

## TypeScript 配置建议

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "strict": true
  }
}
```

声明文件由包内 `dist/index.d.ts` 提供，无需额外 `@types`。

## 为什么只有 ESM？

- 现代 Node（18+）与 Bun 原生加载 ESM
- 双格式发布会放大 interop / 条件导出的维护成本
- `sideEffects: false` + 纯 ESM 更利于 bundler tree-shaking

若在 CJS 项目中使用：

```js
async function load() {
  const { maskEmail } = await import('masker');
  return maskEmail('a@b.com');
}
```

## 验证安装

```bash
node --input-type=module -e "import { maskPhone } from 'masker'; console.log(maskPhone('13812345678'))"
# 138****5678
```

下一步 → [Quick Start](/guide/quick-start)

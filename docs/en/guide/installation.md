# Installation

## Requirements

| Environment   | Version                                       |
| ------------- | --------------------------------------------- |
| Node.js       | ≥ 18                                          |
| Bun           | Current stable (no `node:`-only dependencies) |
| TypeScript    | ≥ 5.x (recommended)                           |
| Module format | **ESM only** (`"type": "module"`)             |

## Package managers

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

The library uses only standard JavaScript (`URL`, `Intl.Segmenter`, plain objects) and **never imports any `node:*` module**, so it works out of the box with Bun and browser bundles alike.

## Recommended TypeScript settings

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

Type declarations ship in the package as `dist/index.d.ts` — no extra `@types` package needed.

## Why ESM only?

- Modern Node (18+) and Bun load ESM natively
- Dual-format publishing multiplies the maintenance cost of interop and conditional exports
- `sideEffects: false` plus pure ESM is friendlier to bundler tree-shaking

If you're in a CJS project:

```js
async function load() {
  const { maskEmail } = await import('masker');
  return maskEmail('a@b.com');
}
```

## Verify the install

```bash
node --input-type=module -e "import { maskPhone } from 'masker'; console.log(maskPhone('13812345678'))"
# 138****5678
```

Next → [Quick Start](/en/guide/quick-start)

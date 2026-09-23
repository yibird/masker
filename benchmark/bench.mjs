/**
 * Micro-benchmarks for masker.
 * Run: npm run build && node benchmark/bench.mjs
 * (Also works with Bun: bun benchmark/bench.mjs after building.)
 */
import {
  createMasker,
  maskEmail,
  maskGeneric,
  maskLog,
  maskObject,
  maskPhone,
  maskUrl,
} from '../dist/index.js';

function bench(name, fn, iterations = 100_000) {
  // warmup
  for (let i = 0; i < Math.min(iterations, 10_000); i++) fn();
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const ms = performance.now() - start;
  const ops = Math.round((iterations / ms) * 1000);
  console.log(
    `${name.padEnd(28)} ${ms.toFixed(1).padStart(8)} ms  ${ops.toLocaleString('en-US').padStart(12)} ops/s`,
  );
}

const email = 'zhangsan@example.com';
const phone = '13812345678';
const generic = 'sensitive-value-12345';
const url = 'https://user:password@example.com/api?token=secret&page=1';

const obj = {
  id: 1,
  name: '张三',
  phone,
  email,
  profile: {
    address: '北京市朝阳区xxx街道xxx号',
    creditCard: '4111111111111111',
    nested: { email: 'deep@example.com' },
  },
  users: Array.from({ length: 50 }, (_, i) => ({
    phone: '13812345678',
    email: `user${i}@example.com`,
    name: `User${i}`,
    tags: ['a', 'b', 'c'],
  })),
};

const schema = {
  name: 'name',
  phone: 'phone',
  email: 'email',
  'profile.address': 'address',
  'profile.creditCard': 'creditCard',
  'profile.nested.email': 'email',
  'users.*.phone': 'phone',
  'users.*.email': 'email',
};

const precompiled = createMasker(schema);
const logMasker = createMasker({
  fields: { password: 'generic', email: 'email', phone: 'phone', token: 'generic' },
});

const largeArray = Array.from({ length: 10_000 }, (_, i) => ({
  email: `u${i}@example.com`,
  password: `secret-${i}`,
  value: i,
}));

console.log(`runtime: node ${process.version}`);
console.log('—'.repeat(64));

bench('maskEmail', () => maskEmail(email));
bench('maskPhone', () => maskPhone(phone));
bench('maskGeneric', () => maskGeneric(generic, { keepStart: 2, keepEnd: 2 }));
bench('maskUrl', () => maskUrl(url));
bench('maskObject (one-shot)', () => maskObject(obj, schema), 20_000);
bench('createMasker.mask', () => precompiled.mask(obj), 20_000);
bench(
  'maskLog fields',
  () =>
    maskLog(obj, {
      fields: { password: 'generic', email: 'email', phone: 'phone' },
    }),
  20_000,
);
bench('precompiled fields', () => logMasker.mask(obj), 20_000);
bench(
  'large array (10k)',
  () =>
    maskLog(largeArray, {
      fields: { email: 'email', password: 'generic' },
    }),
  200,
);

console.log('—'.repeat(64));
console.log('Note: run under Bun with `bun benchmark/bench.mjs` for comparison.');

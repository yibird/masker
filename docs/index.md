---
layout: home

hero:
  name: masker
  text: Data masking that stays out of your way
  tagline: 轻量、类型安全的 PII / 密钥脱敏工具库 — 为 Node.js、Bun 与现代日志链路而设计。
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: API Reference
      link: /reference/api
    - theme: alt
      text: Playground
      link: /playground

features:
  - icon: ✉️
    title: Semantic maskers
    details: 'Email、Phone、Name、Address、Card、Bank Account、ID Card、Vehicle、MAC、JWT、IP、URL、Generic — 每种类型独立策略，而不是统统丢进一个正则。'
    link: /maskers/email
    linkText: 浏览 Maskers
  - icon: 🧩
    title: Object & path schema
    details: 'maskObject / createMasker 支持嵌套路径与通配符，schema 在创建阶段预编译，适合 HTTP 响应与审计日志。'
    link: /object/overview
    linkText: 对象脱敏
  - icon: 📝
    title: Logger-first
    details: 'maskLog 按字段名深度匹配，不改原始对象、不走 JSON.stringify，可直接挂进 Express / Fastify / Bun logger。'
    link: /advanced/logger
    linkText: Logger 场景
  - icon: 🔒
    title: Safe by default
    details: 'JWT 默认全遮盖、URL 敏感 query 默认遮盖、错误信息不回显用户数据。脱敏 ≠ 加密，但默认行为尽量不泄密。'
    link: /advanced/security
    linkText: 安全说明
  - icon: ⚡
    title: Hot-path friendly
    details: '常量正则、ASCII 快路径、copy-on-write、schema 预编译。零 runtime 依赖，sideEffects: false，便于 tree-shaking。'
    link: /advanced/performance
    linkText: 性能
  - icon: 📘
    title: Fully typed
    details: '公开 API 无 any；EmailMaskOptions、PhoneMaskOptions 等类型均有完整文档与示例。'
    link: /reference/types
    linkText: 类型参考
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(
    115deg,
    #22b8f2 0%,
    #167df4 32%,
    #5b45f0 68%,
    #7a3bea 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  /* Soft glow behind the wordmark */
  --vp-home-hero-name-text-shadow: 0 2px 24px rgba(91, 69, 240, 0.35);
  --vp-home-hero-image-background-image: linear-gradient(
    -45deg,
    rgba(34, 184, 242, 0.35) 0%,
    rgba(91, 69, 240, 0.35) 50%,
    rgba(122, 59, 234, 0.3) 100%
  );
  --vp-home-hero-image-filter: blur(56px);
}

.VPHero .name {
  font-family:
    ui-monospace,
    'SF Mono',
    'Cascadia Code',
    'JetBrains Mono',
    Menlo,
    Consolas,
    monospace,
    var(--vp-font-family-base) !important;
  font-weight: 800 !important;
  letter-spacing: -0.05em !important;
}
</style>

## 看得见的脱敏效果

每一行都是真实 API 输出 — 从邮箱到卡号，结构保留、敏感段消失。

<HomeDemo />

### 常见结果速览

<MaskPair input="zhangsan@example.com" output="z******n@example.com" note="maskEmail — 保留 domain 与 +tag 结构" />
<MaskPair input="13812345678" output="138****5678" note="maskPhone — 默认 keepStart: 3, keepEnd: 4" />
<MaskPair input="4111 1111 1111 1111" output="**** **** **** 1111" note="maskCreditCard — 保留空格格式与后四位" />
<MaskPair input="192.168.1.100" output="192.168.*.*" note="maskIp — IPv4 保留前两段" />
<MaskPair input="北京市朝阳区xxx街道xxx号" output="北京市朝阳区*********" note="maskAddress — 自动保留行政区划前缀" />

## 三行接入业务代码

```ts
import { maskEmail, maskPhone, maskObject } from 'masker';

maskEmail('zhangsan@example.com'); // z******n@example.com
maskPhone('13812345678'); // 138****5678

const safe = maskObject(user, {
  email: 'email',
  phone: 'phone',
  'profile.creditCard': 'creditCard',
});
```

继续阅读 [Installation](/guide/installation) 或打开 [Playground](/playground) 动手试。

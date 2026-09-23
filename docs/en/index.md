---
layout: home

hero:
  name: masker
  text: Data masking that stays out of your way
  tagline: A lightweight, type-safe PII / secret masking toolkit — built for Node.js, Bun, and modern logging pipelines.
  actions:
    - theme: brand
      text: Get Started
      link: /en/guide/introduction
    - theme: alt
      text: API Reference
      link: /en/reference/api
    - theme: alt
      text: Playground
      link: /en/playground

features:
  - icon: ✉️
    title: Semantic maskers
    details: 'Email, Phone, Name, Address, Card, Bank Account, ID Card, Vehicle, MAC, JWT, IP, URL, Generic — each type gets its own strategy instead of being shoved into one regex.'
    link: /en/maskers/email
    linkText: Browse maskers
  - icon: 🧩
    title: Object & path schema
    details: 'maskObject / createMasker support nested paths and wildcards; the schema is precompiled at creation time — ideal for HTTP responses and audit logs.'
    link: /en/object/overview
    linkText: Object masking
  - icon: 📝
    title: Logger-first
    details: 'maskLog matches field names at any depth, leaves the original object untouched, and skips JSON.stringify — drop it straight into Express / Fastify / Bun logger.'
    link: /en/advanced/logger
    linkText: Logger scenarios
  - icon: 🔒
    title: Safe by default
    details: 'JWTs are fully masked by default, sensitive URL query params are masked by default, and errors never echo user data. Masking ≠ encryption — but the defaults avoid leaking secrets.'
    link: /en/advanced/security
    linkText: Security notes
  - icon: ⚡
    title: Hot-path friendly
    details: 'Constant regexes, ASCII fast paths, copy-on-write, schema precompilation. Zero runtime dependencies, sideEffects: false, tree-shaking ready.'
    link: /en/advanced/performance
    linkText: Performance
  - icon: 📘
    title: Fully typed
    details: 'No `any` in the public API; types like EmailMaskOptions and PhoneMaskOptions come with full docs and examples.'
    link: /en/reference/types
    linkText: Type reference
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

## Masking you can see

Every line is real API output — from emails to card numbers: structure kept, sensitive parts gone.

<HomeDemo />

### Common results at a glance

<MaskPair input="zhangsan@example.com" output="z******n@example.com" note="maskEmail — keeps domain and +tag structure" />
<MaskPair input="13812345678" output="138****5678" note="maskPhone — defaults to keepStart: 3, keepEnd: 4" />
<MaskPair input="4111 1111 1111 1111" output="**** **** **** 1111" note="maskCreditCard — preserves spacing and the last four digits" />
<MaskPair input="192.168.1.100" output="192.168.*.*" note="maskIp — keeps the first two octets of an IPv4 address" />
<MaskPair input="北京市朝阳区xxx街道xxx号" output="北京市朝阳区*********" note="maskAddress — automatically keeps the administrative-region prefix" />

## Three lines in your business code

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

Keep reading with [Installation](/en/guide/installation), or open the [Playground](/en/playground) and try it yourself.

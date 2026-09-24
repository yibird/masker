import { defineConfig, type DefaultTheme } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';

const repo = 'https://github.com/masker-js/masker';

/** 合并后的 Maskers 下拉：字符串 maskers + 对象脱敏 */
function maskingNav(
  linkPrefix: string,
  labels: { group1: string; group2: string },
): DefaultTheme.NavItem {
  return {
    text: 'Maskers',
    activeMatch: [`${linkPrefix}maskers/`, `${linkPrefix}object/`],
    items: [
      {
        text: labels.group1,
        items: [
          { text: 'Email', link: `${linkPrefix}maskers/email` },
          { text: 'Phone', link: `${linkPrefix}maskers/phone` },
          { text: 'Name', link: `${linkPrefix}maskers/name` },
          { text: 'Address', link: `${linkPrefix}maskers/address` },
          { text: 'Credit Card', link: `${linkPrefix}maskers/credit-card` },
          { text: 'Bank Account', link: `${linkPrefix}maskers/bank-account` },
          { text: 'ID Card', link: `${linkPrefix}maskers/id-card` },
          { text: 'Vehicle', link: `${linkPrefix}maskers/vehicle` },
          { text: 'MAC', link: `${linkPrefix}maskers/mac` },
          { text: 'JWT', link: `${linkPrefix}maskers/jwt` },
          { text: 'IP', link: `${linkPrefix}maskers/ip` },
          { text: 'URL', link: `${linkPrefix}maskers/url` },
          { text: 'Generic', link: `${linkPrefix}maskers/generic` },
        ],
      },
      {
        text: labels.group2,
        items: [
          { text: 'maskObject', link: `${linkPrefix}object/overview` },
          { text: 'Path & Schema', link: `${linkPrefix}object/path-schema` },
          { text: 'Nested & Arrays', link: `${linkPrefix}object/nested-arrays` },
        ],
      },
    ],
  };
}

const zhNav: DefaultTheme.NavItem[] = [
  { text: '指南', link: '/guide/introduction', activeMatch: '/guide/' },
  maskingNav('/', { group1: '字符串脱敏', group2: '对象脱敏' }),
  { text: '进阶', link: '/advanced/logger', activeMatch: '/advanced/' },
  { text: 'Playground', link: '/playground' },
  { text: 'API', link: '/reference/api', activeMatch: '/reference/' },
];

const enNav: DefaultTheme.NavItem[] = [
  { text: 'Guide', link: '/en/guide/introduction', activeMatch: '/en/guide/' },
  maskingNav('/en/', { group1: 'String maskers', group2: 'Object masking' }),
  { text: 'Advanced', link: '/en/advanced/logger', activeMatch: '/en/advanced/' },
  { text: 'Playground', link: '/en/playground' },
  { text: 'API', link: '/en/reference/api', activeMatch: '/en/reference/' },
];

const zhSidebar: DefaultTheme.Sidebar = {
  '/guide/': [
    {
      text: '介绍',
      items: [
        { text: '概述', link: '/guide/introduction' },
        { text: '安装', link: '/guide/installation' },
        { text: '快速开始', link: '/guide/quick-start' },
      ],
    },
  ],
  '/maskers/': [
    {
      text: '字符串脱敏',
      items: [
        { text: 'Email', link: '/maskers/email' },
        { text: 'Phone', link: '/maskers/phone' },
        { text: 'Name', link: '/maskers/name' },
        { text: 'Address', link: '/maskers/address' },
        { text: 'Credit Card', link: '/maskers/credit-card' },
        { text: 'Bank Account', link: '/maskers/bank-account' },
        { text: 'ID Card', link: '/maskers/id-card' },
        { text: 'Vehicle', link: '/maskers/vehicle' },
        { text: 'MAC', link: '/maskers/mac' },
        { text: 'JWT', link: '/maskers/jwt' },
        { text: 'IP', link: '/maskers/ip' },
        { text: 'URL', link: '/maskers/url' },
        { text: 'Generic', link: '/maskers/generic' },
      ],
    },
  ],
  '/object/': [
    {
      text: '对象脱敏',
      items: [
        { text: 'maskObject', link: '/object/overview' },
        { text: '路径与 Schema', link: '/object/path-schema' },
        { text: '嵌套与数组', link: '/object/nested-arrays' },
      ],
    },
  ],
  '/advanced/': [
    {
      text: '进阶',
      items: [
        { text: '自定义 Masker', link: '/advanced/custom' },
        { text: 'Logger', link: '/advanced/logger' },
        { text: '场景配方', link: '/advanced/recipes' },
        { text: '性能', link: '/advanced/performance' },
        { text: '安全', link: '/advanced/security' },
      ],
    },
  ],
  '/reference/': [
    {
      text: '参考',
      items: [
        { text: 'API', link: '/reference/api' },
        { text: '类型', link: '/reference/types' },
        { text: 'FAQ', link: '/reference/faq' },
      ],
    },
  ],
};

const enSidebar: DefaultTheme.Sidebar = {
  '/en/guide/': [
    {
      text: 'Introduction',
      items: [
        { text: 'Overview', link: '/en/guide/introduction' },
        { text: 'Installation', link: '/en/guide/installation' },
        { text: 'Quick Start', link: '/en/guide/quick-start' },
      ],
    },
  ],
  '/en/maskers/': [
    {
      text: 'String maskers',
      items: [
        { text: 'Email', link: '/en/maskers/email' },
        { text: 'Phone', link: '/en/maskers/phone' },
        { text: 'Name', link: '/en/maskers/name' },
        { text: 'Address', link: '/en/maskers/address' },
        { text: 'Credit Card', link: '/en/maskers/credit-card' },
        { text: 'Bank Account', link: '/en/maskers/bank-account' },
        { text: 'ID Card', link: '/en/maskers/id-card' },
        { text: 'Vehicle', link: '/en/maskers/vehicle' },
        { text: 'MAC', link: '/en/maskers/mac' },
        { text: 'JWT', link: '/en/maskers/jwt' },
        { text: 'IP', link: '/en/maskers/ip' },
        { text: 'URL', link: '/en/maskers/url' },
        { text: 'Generic', link: '/en/maskers/generic' },
      ],
    },
  ],
  '/en/object/': [
    {
      text: 'Object masking',
      items: [
        { text: 'maskObject', link: '/en/object/overview' },
        { text: 'Path & Schema', link: '/en/object/path-schema' },
        { text: 'Nested & Arrays', link: '/en/object/nested-arrays' },
      ],
    },
  ],
  '/en/advanced/': [
    {
      text: 'Advanced',
      items: [
        { text: 'Custom Maskers', link: '/en/advanced/custom' },
        { text: 'Logger', link: '/en/advanced/logger' },
        { text: 'Recipes', link: '/en/advanced/recipes' },
        { text: 'Performance', link: '/en/advanced/performance' },
        { text: 'Security', link: '/en/advanced/security' },
      ],
    },
  ],
  '/en/reference/': [
    {
      text: 'Reference',
      items: [
        { text: 'API', link: '/en/reference/api' },
        { text: 'Types', link: '/en/reference/types' },
        { text: 'FAQ', link: '/en/reference/faq' },
      ],
    },
  ],
};

const sharedTheme = {
  logo: '/logo.svg',
  siteTitle: 'masker',
  socialLinks: [{ icon: 'github', link: repo }],
  search: { provider: 'local' },
};

export default defineConfig({
  title: 'masker',
  description:
    'Lightweight, type-safe data masking for Node.js and Bun — protect PII without sacrificing DX.',
  lang: 'zh-CN',
  // GitHub Pages project site: https://yibird.github.io/masker/
  // Override with DOCS_BASE=/ for root or custom domain.
  base: process.env.DOCS_BASE || '/',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'masker — data masking toolkit' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Lightweight, type-safe data masking for Node.js and Bun.',
      },
    ],
  ],

  // 默认简体中文（root），英文在 /en/
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        ...sharedTheme,
        nav: zhNav,
        sidebar: zhSidebar,
        outline: { level: [2, 3], label: '本页目录' },
        footer: {
          message: 'Released under the MIT License.',
          copyright: 'Copyright © masker contributors',
        },
        editLink: { pattern: `${repo}/edit/main/docs/:path`, text: '编辑此页' },
        lastUpdatedText: '最后更新',
        langMenuLabel: '切换语言',
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色主题',
        darkModeSwitchTitle: '切换到深色主题',
        docFooter: { prev: '上一篇', next: '下一篇' },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        ...sharedTheme,
        nav: enNav,
        sidebar: enSidebar,
        outline: { level: [2, 3], label: 'On this page' },
        footer: {
          message: 'Released under the MIT License.',
          copyright: 'Copyright © masker contributors',
        },
        editLink: { pattern: `${repo}/edit/main/docs/:path`, text: 'Edit this page' },
        lastUpdatedText: 'Last updated',
        langMenuLabel: 'Change language',
        returnToTopLabel: 'Back to top',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Appearance',
        lightModeSwitchTitle: 'Switch to light theme',
        darkModeSwitchTitle: 'Switch to dark theme',
        docFooter: { prev: 'Previous', next: 'Next' },
      },
    },
  },

  vite: {
    // Single logo source: serve project `assets/` as site public root (`/logo.svg`).
    publicDir: fileURLToPath(new URL('../../assets', import.meta.url)),
    resolve: {
      alias: {
        masker: fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
      },
    },
  },
});

import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import MaskExample from './components/MaskExample.vue';
import MaskPair from './components/MaskPair.vue';
import HomeDemo from './components/HomeDemo.vue';
import Playground from './components/Playground.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'home-hero-info-before': () => h(HomeBadge) }),
  enhanceApp({ app }) {
    app.component('MaskExample', MaskExample);
    app.component('MaskPair', MaskPair);
    app.component('HomeDemo', HomeDemo);
    app.component('Playground', Playground);
  },
} satisfies Theme;

const HomeBadge = {
  render() {
    return h('div', { class: 'home-badge' }, 'Zero runtime deps · ESM · Node & Bun');
  },
};

import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import Layout from './Layout.vue';
import MaskExample from './components/MaskExample.vue';
import MaskPair from './components/MaskPair.vue';
import HomeDemo from './components/HomeDemo.vue';
import Playground from './components/Playground.vue';
import 'virtual:group-icons.css';
import './style/code.css';
import './style/dark.css';
import './custom.css';

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('MaskExample', MaskExample);
    app.component('MaskPair', MaskPair);
    app.component('HomeDemo', HomeDemo);
    app.component('Playground', Playground);
  },
} satisfies Theme;

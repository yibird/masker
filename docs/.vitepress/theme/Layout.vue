<script setup lang="ts">
import { nextTick, provide } from 'vue';
import { useData } from 'vitepress';
import DefaultTheme from 'vitepress/theme';

const { isDark } = useData();

const enableTransitions = () =>
  typeof document !== 'undefined' &&
  'startViewTransition' in document &&
  window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

provide('toggle-appearance', async (event: MouseEvent | KeyboardEvent) => {
  if (!enableTransitions()) {
    isDark.value = !isDark.value;
    return;
  }

  const x = 'clientX' in event ? event.clientX : window.innerWidth / 2;
  const y = 'clientY' in event ? event.clientY : window.innerHeight / 2;
  document.documentElement.style.setProperty('--darkX', `${x}px`);
  document.documentElement.style.setProperty('--darkY', `${y}px`);

  const transition = document.startViewTransition(async () => {
    isDark.value = !isDark.value;
    await nextTick();
  });
  await transition.ready;
});
</script>

<template>
  <DefaultTheme.Layout>
    <template #home-hero-info-before>
      <div class="home-badge">Zero runtime deps · ESM · Node &amp; Bun</div>
    </template>
  </DefaultTheme.Layout>
</template>

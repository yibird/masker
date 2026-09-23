<script setup lang="ts">
/** Static before/after row used in dense tables of examples. */
defineProps<{
  input: string;
  output: string;
  note?: string;
}>();
</script>

<template>
  <div class="mask-pair">
    <span class="mask-pair__in">{{ input }}</span>
    <span class="mask-pair__arrow">→</span>
    <span class="mask-pair__out">{{ output }}</span>
    <span v-if="note" class="mask-pair__note">{{ note }}</span>
  </div>
</template>

<style scoped>
.mask-pair {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) auto minmax(0, 1.1fr);
  gap: 0.35rem 0.75rem;
  align-items: center;
  padding: 0.55rem 0.75rem;
  margin: 0.35rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  font-family: var(--vp-font-family-mono);
  font-size: 0.84rem;
}

.mask-pair__arrow {
  color: var(--vp-c-brand-1);
  font-weight: 700;
}

.mask-pair__out {
  color: var(--masker-ok, #10b981);
  font-weight: 600;
  word-break: break-all;
}

.mask-pair__in {
  word-break: break-all;
  color: var(--vp-c-text-2);
}

.mask-pair__note {
  grid-column: 1 / -1;
  font-family: var(--vp-font-family-sans);
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
}

@media (max-width: 640px) {
  .mask-pair {
    grid-template-columns: 1fr;
  }
  .mask-pair__arrow {
    display: none;
  }
}
</style>

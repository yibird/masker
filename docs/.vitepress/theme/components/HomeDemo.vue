<script setup lang="ts">
import { computed, ref } from 'vue';
import { maskCreditCard, maskEmail, maskGeneric, maskName, maskPhone } from 'masker';

type Kind = 'email' | 'phone' | 'name' | 'card' | 'generic';

const kinds: { id: Kind; label: string; sample: string }[] = [
  { id: 'email', label: 'Email', sample: 'zhangsan@example.com' },
  { id: 'phone', label: 'Phone', sample: '13812345678' },
  { id: 'name', label: 'Name', sample: '张三丰' },
  { id: 'card', label: 'Credit Card', sample: '4111 1111 1111 1111' },
  { id: 'generic', label: 'Generic', sample: 'sensitive-api-key-9x' },
];

const kind = ref<Kind>('email');
const input = ref(kinds[0]!.sample);
const mask = ref('*');
const keepStart = ref(1);
const keepEnd = ref(1);

function pick(id: Kind) {
  kind.value = id;
  const k = kinds.find((x) => x.id === id)!;
  input.value = k.sample;
}

const output = computed(() => {
  const m = mask.value || '*';
  const ks = Math.max(0, Number(keepStart.value) || 0);
  const ke = Math.max(0, Number(keepEnd.value) || 0);
  switch (kind.value) {
    case 'email':
      return maskEmail(input.value, { mask: m, keepStart: ks, keepEnd: ke });
    case 'phone':
      return maskPhone(input.value, { mask: m, keepStart: ks, keepEnd: ke });
    case 'name':
      return maskName(input.value, { mask: m, keepStart: ks, keepEnd: ke });
    case 'card':
      return maskCreditCard(input.value, { mask: m, keepStart: ks, keepEnd: ke });
    case 'generic':
      return maskGeneric(input.value, { mask: m, keepStart: ks, keepEnd: ke });
  }
});

const code = computed(() => {
  const map: Record<Kind, string> = {
    email: 'maskEmail',
    phone: 'maskPhone',
    name: 'maskName',
    card: 'maskCreditCard',
    generic: 'maskGeneric',
  };
  const fn = map[kind.value];
  return `${fn}(input, {\n  mask: ${JSON.stringify(mask.value)},\n  keepStart: ${keepStart.value},\n  keepEnd: ${keepEnd.value},\n})`;
});
</script>

<template>
  <div class="mask-demo home-demo">
    <div class="mask-demo__head">
      <span class="mask-demo__dots"><i /><i /><i /></span>
      <span>Live masking demo</span>
    </div>

    <div class="mask-demo__controls home-demo__kinds">
      <button
        v-for="k in kinds"
        :key="k.id"
        type="button"
        class="home-demo__chip"
        :class="{ 'home-demo__chip--on': kind === k.id }"
        @click="pick(k.id)"
      >
        {{ k.label }}
      </button>
    </div>

    <div class="mask-demo__controls">
      <div class="mask-demo__field mask-demo__field--grow">
        <label for="home-input">Input</label>
        <input id="home-input" v-model="input" spellcheck="false" autocomplete="off" />
      </div>
      <div class="mask-demo__field">
        <label for="home-mask">mask</label>
        <input id="home-mask" v-model="mask" maxlength="4" style="width: 4.5rem" />
      </div>
      <div class="mask-demo__field">
        <label for="home-ks">keepStart</label>
        <input
          id="home-ks"
          v-model.number="keepStart"
          type="number"
          min="0"
          max="20"
          style="width: 5.5rem"
        />
      </div>
      <div class="mask-demo__field">
        <label for="home-ke">keepEnd</label>
        <input
          id="home-ke"
          v-model.number="keepEnd"
          type="number"
          min="0"
          max="20"
          style="width: 5.5rem"
        />
      </div>
    </div>

    <div class="mask-demo__grid">
      <div class="mask-demo__col">
        <div class="mask-demo__label">Original</div>
        <div class="mask-demo__box">{{ input }}</div>
      </div>
      <div class="mask-demo__arrow">↓</div>
      <div class="mask-demo__col">
        <div class="mask-demo__label">Masked</div>
        <div class="mask-demo__box mask-demo__box--out">{{ output }}</div>
      </div>
    </div>

    <div class="mask-demo__code">
      <pre class="language-ts"><code>{{ code }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.home-demo__kinds {
  border-top: none;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.85rem;
}

.home-demo__chip {
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s,
    background 0.15s;
}

.home-demo__chip:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.home-demo__chip--on {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
</style>

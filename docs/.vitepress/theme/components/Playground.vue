<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  maskAddress,
  maskBankAccount,
  maskCreditCard,
  maskEmail,
  maskGeneric,
  maskIdCard,
  maskIp,
  maskJwt,
  maskMac,
  maskName,
  maskPhone,
  maskUrl,
  maskVehicle,
} from 'masker';

type Kind =
  | 'email'
  | 'phone'
  | 'name'
  | 'address'
  | 'creditCard'
  | 'idCard'
  | 'bankAccount'
  | 'mac'
  | 'vehicle'
  | 'jwt'
  | 'ip'
  | 'url'
  | 'generic';

const catalog: {
  id: Kind;
  label: string;
  fn: string;
  sample: string;
  fields: Array<'mask' | 'keepStart' | 'keepEnd' | 'maskLength' | 'extra'>;
}[] = [
  {
    id: 'email',
    label: 'Email',
    fn: 'maskEmail',
    sample: 'zhangsan@example.com',
    fields: ['mask', 'keepStart', 'keepEnd'],
  },
  {
    id: 'phone',
    label: 'Phone',
    fn: 'maskPhone',
    sample: '+8613812345678',
    fields: ['mask', 'keepStart', 'keepEnd'],
  },
  {
    id: 'name',
    label: 'Name',
    fn: 'maskName',
    sample: '欧阳娜娜',
    fields: ['mask', 'keepStart', 'keepEnd'],
  },
  {
    id: 'address',
    label: 'Address',
    fn: 'maskAddress',
    sample: '北京市朝阳区xxx街道xxx号',
    fields: ['mask', 'keepStart', 'keepEnd', 'maskLength'],
  },
  {
    id: 'creditCard',
    label: 'Credit Card',
    fn: 'maskCreditCard',
    sample: '4111 1111 1111 1111',
    fields: ['mask', 'keepStart', 'keepEnd'],
  },
  {
    id: 'bankAccount',
    label: 'Bank Account',
    fn: 'maskBankAccount',
    sample: '6222021234567890123',
    fields: ['mask', 'keepStart', 'keepEnd'],
  },
  {
    id: 'idCard',
    label: 'ID Card',
    fn: 'maskIdCard',
    sample: '110101199001011234',
    fields: ['mask', 'keepStart', 'keepEnd'],
  },
  {
    id: 'vehicle',
    label: 'Vehicle',
    fn: 'maskVehicle',
    sample: '京A12345',
    fields: ['mask', 'keepStart', 'keepEnd'],
  },
  {
    id: 'mac',
    label: 'MAC',
    fn: 'maskMac',
    sample: '00:1A:2B:3C:4D:5E',
    fields: ['mask', 'keepStart', 'keepEnd'],
  },
  {
    id: 'jwt',
    label: 'JWT',
    fn: 'maskJwt',
    sample:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
    fields: ['mask', 'extra'],
  },
  {
    id: 'ip',
    label: 'IP',
    fn: 'maskIp',
    sample: '192.168.1.100',
    fields: ['mask'],
  },
  {
    id: 'url',
    label: 'URL',
    fn: 'maskUrl',
    sample: 'https://user:password@example.com/api?token=secret&page=1',
    fields: ['mask'],
  },
  {
    id: 'generic',
    label: 'Generic',
    fn: 'maskGeneric',
    sample: '1234567890',
    fields: ['mask', 'keepStart', 'keepEnd', 'maskLength'],
  },
];

const kind = ref<Kind>('email');
const input = ref(catalog[0]!.sample);
const mask = ref('*');
const keepStart = ref(1);
const keepEnd = ref(1);
const maskLength = ref<string>('');
const jwtHeader = ref<'mask' | 'keep'>('mask');

const meta = computed(() => catalog.find((c) => c.id === kind.value)!);

function pick(id: Kind) {
  kind.value = id;
  const c = catalog.find((x) => x.id === id)!;
  input.value = c.sample;
  // sensible defaults per type
  if (id === 'generic' || id === 'address') {
    keepStart.value = id === 'address' ? 6 : 2;
    keepEnd.value = 0;
  } else if (id === 'phone') {
    keepStart.value = 3;
    keepEnd.value = 4;
  } else if (id === 'creditCard' || id === 'bankAccount') {
    keepStart.value = 0;
    keepEnd.value = 4;
  } else if (id === 'idCard') {
    keepStart.value = 6;
    keepEnd.value = 4;
  } else if (id === 'mac') {
    keepStart.value = 3;
    keepEnd.value = 0;
  } else if (id === 'vehicle') {
    keepStart.value = 2;
    keepEnd.value = 0;
  } else if (id === 'jwt' || id === 'ip' || id === 'url') {
    keepStart.value = 0;
    keepEnd.value = 0;
  } else {
    keepStart.value = 1;
    keepEnd.value = 1;
  }
  maskLength.value = '';
}

const output = computed(() => {
  const m = mask.value || '*';
  const ks = Math.max(0, Number(keepStart.value) || 0);
  const ke = Math.max(0, Number(keepEnd.value) || 0);
  const ml = maskLength.value === '' ? undefined : Math.max(0, Number(maskLength.value) || 0);
  const v = input.value;
  switch (kind.value) {
    case 'email':
      return maskEmail(v, { mask: m, keepStart: ks, keepEnd: ke });
    case 'phone':
      return maskPhone(v, { mask: m, keepStart: ks, keepEnd: ke });
    case 'name':
      return maskName(v, { mask: m, keepStart: ks, keepEnd: ke });
    case 'address':
      return maskAddress(v, {
        mask: m,
        keepStart: ks,
        keepEnd: ke,
        ...(ml !== undefined ? { maskLength: ml } : {}),
        disableAutoPrefix: true,
      });
    case 'creditCard':
      return maskCreditCard(v, { mask: m, keepStart: ks, keepEnd: ke });
    case 'bankAccount':
      return maskBankAccount(v, { mask: m, keepStart: ks, keepEnd: ke });
    case 'idCard':
      return maskIdCard(v, { mask: m, keepStart: ks, keepEnd: ke });
    case 'mac':
      return maskMac(v, { mask: m, keepStart: ks, keepEnd: ke });
    case 'vehicle':
      return maskVehicle(v, { mask: m, keepStart: ks, keepEnd: ke });
    case 'jwt':
      return maskJwt(v, { mask: m, header: jwtHeader.value });
    case 'ip':
      return maskIp(v, { mask: m });
    case 'url':
      return maskUrl(v, { mask: m });
    case 'generic':
      return maskGeneric(v, {
        mask: m,
        keepStart: ks,
        keepEnd: ke,
        ...(ml !== undefined ? { maskLength: ml } : {}),
      });
  }
});

const code = computed(() => {
  const c = meta.value;
  const showSlice =
    c.fields.includes('keepStart') ||
    c.fields.includes('keepEnd') ||
    c.fields.includes('maskLength');
  const lines: string[] = [`import { ${c.fn} } from 'masker'`, '', ''];
  const optLines: string[] = [];
  if (c.fields.includes('mask')) optLines.push(`  mask: ${JSON.stringify(mask.value)},`);
  if (showSlice && c.fields.includes('keepStart'))
    optLines.push(`  keepStart: ${keepStart.value},`);
  if (showSlice && c.fields.includes('keepEnd')) optLines.push(`  keepEnd: ${keepEnd.value},`);
  if (c.fields.includes('maskLength') && maskLength.value !== '')
    optLines.push(`  maskLength: ${maskLength.value},`);
  if (c.id === 'jwt') optLines.push(`  header: ${JSON.stringify(jwtHeader.value)},`);
  if (c.id === 'address') optLines.push('  disableAutoPrefix: true,');

  if (optLines.length === 0) {
    lines.push(`${c.fn}(${JSON.stringify(input.value)})`);
  } else {
    lines.push(`${c.fn}(${JSON.stringify(input.value)}, {`);
    lines.push(...optLines);
    lines.push('})');
  }
  return lines.join('\n');
});
</script>

<template>
  <div class="mask-demo playground">
    <div class="mask-demo__head">
      <span class="mask-demo__dots"><i /><i /><i /></span>
      <span>Masker Playground</span>
    </div>

    <div class="mask-demo__controls playground__kinds">
      <button
        v-for="c in catalog"
        :key="c.id"
        type="button"
        class="home-demo__chip"
        :class="{ 'home-demo__chip--on': kind === c.id }"
        @click="pick(c.id)"
      >
        {{ c.label }}
      </button>
    </div>

    <div class="mask-demo__controls">
      <div class="mask-demo__field mask-demo__field--grow">
        <label for="pg-input">Input</label>
        <textarea id="pg-input" v-model="input" rows="3" spellcheck="false" />
      </div>
    </div>

    <div class="mask-demo__controls playground__opts">
      <div class="mask-demo__field">
        <label for="pg-mask">mask</label>
        <input id="pg-mask" v-model="mask" maxlength="4" />
      </div>
      <div v-if="meta.fields.includes('keepStart')" class="mask-demo__field">
        <label for="pg-ks">keepStart</label>
        <input id="pg-ks" v-model.number="keepStart" type="number" min="0" max="40" />
      </div>
      <div v-if="meta.fields.includes('keepEnd')" class="mask-demo__field">
        <label for="pg-ke">keepEnd</label>
        <input id="pg-ke" v-model.number="keepEnd" type="number" min="0" max="40" />
      </div>
      <div v-if="meta.fields.includes('maskLength')" class="mask-demo__field">
        <label for="pg-ml">maskLength</label>
        <input id="pg-ml" v-model="maskLength" type="number" min="0" max="64" placeholder="auto" />
      </div>
      <div v-if="meta.fields.includes('extra')" class="mask-demo__field">
        <label for="pg-jwt">header</label>
        <select id="pg-jwt" v-model="jwtHeader">
          <option value="mask">mask</option>
          <option value="keep">keep</option>
        </select>
      </div>
    </div>

    <div class="mask-demo__grid">
      <div class="mask-demo__col">
        <div class="mask-demo__label">Input</div>
        <div class="mask-demo__box">{{ input }}</div>
      </div>
      <div class="mask-demo__arrow">→</div>
      <div class="mask-demo__col">
        <div class="mask-demo__label">Output</div>
        <div class="mask-demo__box mask-demo__box--out">{{ output }}</div>
      </div>
    </div>

    <div class="mask-demo__code">
      <div class="mask-demo__head" style="border-bottom: 1px solid var(--vp-c-divider)">
        <span>Code</span>
      </div>
      <pre class="language-ts"><code>{{ code }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.playground__kinds {
  border-top: none;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.85rem;
}

.playground__opts .mask-demo__field input,
.playground__opts .mask-demo__field select {
  width: 7.5rem;
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

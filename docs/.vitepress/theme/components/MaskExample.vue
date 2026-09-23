<script setup lang="ts">
import { computed } from 'vue';
import {
  maskAddress,
  maskBankAccount,
  maskCreditCard,
  maskEmail,
  maskGeneric,
  maskIdCard,
  maskIp,
  maskJwt,
  maskLicensePlate,
  maskMac,
  maskName,
  maskPhone,
  maskUrl,
  maskVehicle,
  maskVin,
} from 'masker';

const props = withDefaults(
  defineProps<{
    fn: string;
    input: string;
    options?: Record<string, unknown>;
    label?: string;
  }>(),
  { options: () => ({}), label: '' },
);

const fns: Record<string, (v: string, o?: never) => string> = {
  maskEmail: maskEmail as never,
  maskPhone: maskPhone as never,
  maskName: maskName as never,
  maskAddress: maskAddress as never,
  maskCreditCard: maskCreditCard as never,
  maskIdCard: maskIdCard as never,
  maskBankAccount: maskBankAccount as never,
  maskMac: maskMac as never,
  maskVehicle: maskVehicle as never,
  maskVin: maskVin as never,
  maskLicensePlate: maskLicensePlate as never,
  maskJwt: maskJwt as never,
  maskIp: maskIp as never,
  maskUrl: maskUrl as never,
  maskGeneric: maskGeneric as never,
};

const output = computed(() => {
  const fn = fns[props.fn];
  if (!fn) return `/* unknown fn: ${props.fn} */`;
  return fn(props.input, props.options as never);
});

const code = computed(() => {
  const hasOpts = props.options && Object.keys(props.options).length > 0;
  const opts = hasOpts ? `, ${JSON.stringify(props.options, null, 2).replace(/\n/g, '\n  ')}` : '';
  return `import { ${props.fn} } from 'masker'\n\n${props.fn}(${JSON.stringify(props.input)}${opts})`;
});
</script>

<template>
  <div class="mask-demo">
    <div class="mask-demo__head">
      <span class="mask-demo__dots"><i /><i /><i /></span>
      <span>{{ label || fn }}</span>
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
      <pre class="language-ts"><code>{{ code }}</code></pre>
    </div>
  </div>
</template>

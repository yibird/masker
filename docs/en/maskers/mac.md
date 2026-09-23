# MAC Address

`maskMac` masks MAC addresses. Supported forms: colon-separated, dash-separated, Cisco dotted (`aabb.ccdd.eeff`), and bare 12 hex digits. By default the first **3 octets** (OUI / vendor prefix) are kept and the device portion is masked.

```ts
function maskMac(value: string, options?: MacMaskOptions): string;
```

## Basic usage

### Colon-separated

<MaskExample fn="maskMac" input="00:1A:2B:3C:4D:5E" />

<MaskPair input="00:1A:2B:3C:4D:5E" output="00:1A:2B:*:*:*" note="keepStart: 3 (OUI)" />

### Dash-separated

<MaskPair input="00-1a-2b-3c-4d-5e" output="00-1a-2b-*-*-*" />

### Cisco dotted

<MaskPair input="aabb.ccdd.eeff" output="aabb.cc**.****" note="Masked at octet granularity" />

### Bare 12 hex

<MaskPair input="001A2B3C4D5E" output="001A2B******" note="Two mask chars per octet" />

## Custom keep counts

<MaskExample fn="maskMac" input="00:1A:2B:3C:4D:5E" :options="{ keepStart: 2, keepEnd: 1 }" />

<MaskPair input="00:1A:2B:3C:4D:5E" output="00:1A:*:*:*:5E" note="keepStart: 2, keepEnd: 1" />

Mask everything:

<MaskPair input="00:1A:2B:3C:4D:5E" output="*:*:*:*:*:*" note="keepStart: 0, keepEnd: 0" />

## Edge cases

| Input                             | Behaviour |
| --------------------------------- | --------- |
| `''`                              | `''`      |
| `not-a-mac`                       | unchanged |
| `00:1A:2B:3C:4D` (too few groups) | unchanged |
| `GG:1A:…` (non-hex)               | unchanged |

## Options

```ts
interface MacMaskOptions {
  mask?: string; // default '*'
  keepStart?: number; // default 3 (OUI)
  keepEnd?: number; // default 0
}
```

## Scenario: device audit logs

```ts
import { maskMac } from 'masker';

const event = {
  type: 'device.login',
  mac: '00:1A:2B:3C:4D:5E',
};

const safe = { ...event, mac: maskMac(event.mac) };
// mac: '00:1A:2B:*:*:*'
```

::: tip OUI visibility
Keeping the first three octets helps vendor lookup; set `keepStart: 0` to hide the device identifier completely.
:::

## Error behaviour

**Never throws;** invalid MAC is returned unchanged.

Related: [IP](/en/maskers/ip) · [Generic](/en/maskers/generic)

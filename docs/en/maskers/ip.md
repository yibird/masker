# IP

IPv4 and IPv6 use **two completely separate code paths** — rules that only apply to dotted quads are never applied to colon-hex addresses.

```ts
function maskIp(value: string, options?: IpMaskOptions): string;
```

## IPv4

By default the first two octets are kept (common /16 networks stay readable) and the last two become `*`:

<MaskExample fn="maskIp" input="192.168.1.100" />

<MaskPair input="192.168.1.100" output="192.168.*.*" />

<MaskPair input="10.0.0.1" output="10.0.*.*" />

<MaskPair input="8.8.8.8" output="8.8.*.*" />

### Custom number of kept octets

<MaskExample fn="maskIp" input="192.168.1.100" :options="{ ipv4: { keepStart: 3 } }" />

<MaskPair input="192.168.1.100" output="192.168.1.*" note="ipv4.keepStart: 3" />

<MaskPair input="192.168.1.100" output="*.*.*.*" note="ipv4: { keepStart: 0, keepEnd: 0 }" />

## IPv6

By default the first **2 hextets** are kept and the remaining groups are replaced with `*`:

<MaskExample fn="maskIp" input="2001:db8:85a3:0:0:8a2e:370:7334" />

<MaskPair input="2001:db8:85a3:0:0:8a2e:370:7334" output="2001:db8:*:*:*:*:*:*" />

### Compressed form `::`

<MaskPair input="2001:db8::1" output="2001:db8::*" note="empty groups (::) preserve the structure" />

<MaskPair input="fe80::1" output="fe80::*" note="with only two visible groups, the last group is still force-masked so nothing is returned in plaintext" />

### Custom number of kept groups

```ts
maskIp('2001:db8:85a3:0:0:8a2e:370:7334', {
  ipv6: { keepGroups: 4 },
});
// 2001:db8:85a3:0:*:*:*:*
```

<MaskExample fn="maskIp" input="2001:db8:85a3:0:0:8a2e:370:7334" :options="{ ipv6: { keepGroups: 4 } }" />

## IPs in logs

```ts
import { maskIp, maskLog } from 'masker'

const event = {
  type: 'login',
  ip: '203.0.113.42',
  forwardFor: '192.168.10.5',
}

// when the field name happens to be `ip`, you can use maskLog
maskLog(event, { fields: { ip: 'ip' } })
// { type: 'login', ip: '203.0.*.*', forwardFor: '192.168.10.5' }

// or explicitly
{ ...event, ip: maskIp(event.ip) }
```

## Edge cases

| Input             | Behavior               |
| ----------------- | ---------------------- |
| `''`              | `''`                   |
| `not-an-ip`       | as-is                  |
| `999.999.999.999` | as-is (octet &gt; 255) |
| `1.2.3`           | as-is                  |
| `abc:def`         | as-is (non-hex)        |

## Options

```ts
interface IpMaskOptions {
  mask?: string; // default '*'
  ipv4?: { keepStart?: number /* 2 */; keepEnd?: number /* 0 */ };
  ipv6?: { keepGroups?: number /* 2 */ };
}
```

## Error behavior

Never throws; invalid IPs are returned as-is.

Related: [URL](/en/maskers/url) · [Logger](/en/advanced/logger)

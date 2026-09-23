# IP

IPv4 与 IPv6 使用**两套独立逻辑**，绝不会把仅适用于点分四段的规则套在冒号十六进制上。

```ts
function maskIp(value: string, options?: IpMaskOptions): string;
```

## IPv4

默认保留前两段（常见 /16 网段仍可读），后两段变 `*`：

<MaskExample fn="maskIp" input="192.168.1.100" />

<MaskPair input="192.168.1.100" output="192.168.*.*" />

<MaskPair input="10.0.0.1" output="10.0.*.*" />

<MaskPair input="8.8.8.8" output="8.8.*.*" />

### 自定义保留段数

<MaskExample fn="maskIp" input="192.168.1.100" :options="{ ipv4: { keepStart: 3 } }" />

<MaskPair input="192.168.1.100" output="192.168.1.*" note="ipv4.keepStart: 3" />

<MaskPair input="192.168.1.100" output="*.*.*.*" note="ipv4: { keepStart: 0, keepEnd: 0 }" />

## IPv6

默认保留前 **2 个 hextet**，其余组替换为 `*`：

<MaskExample fn="maskIp" input="2001:db8:85a3:0:0:8a2e:370:7334" />

<MaskPair input="2001:db8:85a3:0:0:8a2e:370:7334" output="2001:db8:*:*:*:*:*:*" />

### 压缩形式 `::`

<MaskPair input="2001:db8::1" output="2001:db8::*" note="空段（::）保持结构" />

<MaskPair input="fe80::1" output="fe80::*" note="仅两段可见组时，末组仍强制遮盖，避免明文回传" />

### 自定义保留组数

```ts
maskIp('2001:db8:85a3:0:0:8a2e:370:7334', {
  ipv6: { keepGroups: 4 },
});
// 2001:db8:85a3:0:*:*:*:*
```

<MaskExample fn="maskIp" input="2001:db8:85a3:0:0:8a2e:370:7334" :options="{ ipv6: { keepGroups: 4 } }" />

## 日志中的 IP

```ts
import { maskIp, maskLog } from 'masker'

const event = {
  type: 'login',
  ip: '203.0.113.42',
  forwardFor: '192.168.10.5',
}

// 字段名恰好是 ip 时可用 maskLog
maskLog(event, { fields: { ip: 'ip' } })
// { type: 'login', ip: '203.0.*.*', forwardFor: '192.168.10.5' }

// 或显式
{ ...event, ip: maskIp(event.ip) }
```

## 边界情况

| 输入              | 行为                   |
| ----------------- | ---------------------- |
| `''`              | `''`                   |
| `not-an-ip`       | 原样                   |
| `999.999.999.999` | 原样（octet &gt; 255） |
| `1.2.3`           | 原样                   |
| `abc:def`         | 原样（非 hex）         |

## Options

```ts
interface IpMaskOptions {
  mask?: string; // 默认 '*'
  ipv4?: { keepStart?: number /* 2 */; keepEnd?: number /* 0 */ };
  ipv6?: { keepGroups?: number /* 2 */ };
}
```

## 错误行为

从不抛异常；非法 IP 原样返回。

相关：[URL](/maskers/url) · [Logger](/advanced/logger)

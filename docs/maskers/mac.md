# MAC Address

`maskMac` 遮盖 MAC 地址，支持冒号、横线、Cisco 点分（`aabb.ccdd.eeff`）与裸 12 位十六进制。默认保留前 **3 个八位组**（OUI / 厂商前缀），遮盖设备后半段。

```ts
function maskMac(value: string, options?: MacMaskOptions): string;
```

## 基础用法

### 冒号分隔

<MaskExample fn="maskMac" input="00:1A:2B:3C:4D:5E" />

<MaskPair input="00:1A:2B:3C:4D:5E" output="00:1A:2B:*:*:*" note="keepStart: 3（OUI）" />

### 横线分隔

<MaskPair input="00-1a-2b-3c-4d-5e" output="00-1a-2b-*-*-*" />

### Cisco 点分

<MaskPair input="aabb.ccdd.eeff" output="aabb.cc**.****" note="按八位组粒度遮盖" />

### 裸 12 位十六进制

<MaskPair input="001A2B3C4D5E" output="001A2B******" note="每八位组两个 mask 字符" />

## 自定义保留段数

<MaskExample fn="maskMac" input="00:1A:2B:3C:4D:5E" :options="{ keepStart: 2, keepEnd: 1 }" />

<MaskPair input="00:1A:2B:3C:4D:5E" output="00:1A:*:*:*:5E" note="keepStart: 2, keepEnd: 1" />

全部遮住：

<MaskPair input="00:1A:2B:3C:4D:5E" output="*:*:*:*:*:*" note="keepStart: 0, keepEnd: 0" />

## 边界情况

| 输入                          | 行为 |
| ----------------------------- | ---- |
| `''`                          | `''` |
| `not-a-mac`                   | 原样 |
| `00:1A:2B:3C:4D`（不足 6 组） | 原样 |
| `GG:1A:…`（非十六进制）       | 原样 |

## Options

```ts
interface MacMaskOptions {
  mask?: string; // 默认 '*'
  keepStart?: number; // 默认 3（OUI）
  keepEnd?: number; // 默认 0
}
```

## 业务场景：设备审计日志

```ts
import { maskMac } from 'masker';

const event = {
  type: 'device.login',
  mac: '00:1A:2B:3C:4D:5E',
};

// { type: 'device.login', mac: '00:1A:2B:*:*:*' }
const safe = { ...event, mac: maskMac(event.mac) };
```

::: tip OUI 可见性
保留前 3 组便于排查厂商；若需完全隐藏设备标识，设 `keepStart: 0`。
:::

## 错误行为

**从不抛异常；** 非法 MAC 原样返回。

相关：[IP](/maskers/ip) · [Generic](/maskers/generic)

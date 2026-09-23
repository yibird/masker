# Vehicle

车辆相关脱敏覆盖 **License Plate（车牌号）** 与 **VIN（车架号）**。推荐入口是 `maskVehicle`（自动识别），也可显式调用 `maskLicensePlate` / `maskVin`。

```ts
function maskVehicle(value: string, options?: VehicleMaskOptions): string;
function maskLicensePlate(value: string, options?: VehicleMaskOptions): string;
function maskVin(value: string, options?: VehicleMaskOptions): string;
```

## 自动识别

<MaskExample fn="maskVehicle" input="1HGCM82633A004352" />

17 位 → 按 **VIN** 处理（默认保留 WMI 前 3 + 末 4）：

<MaskPair input="1HGCM82633A004352" output="1HG**********4352" note="kind: auto → VIN" />

非 VIN 形态 → 按 **车牌** 处理：

<MaskExample fn="maskVehicle" input="京A12345" />

<MaskPair input="京A12345" output="京A*****" note="保留省简称 + 字母" />

## License Plate

### 中国车牌

<MaskExample fn="maskLicensePlate" input="京A12345" />

<MaskPair input="京A12345" output="京A*****" note="keepStart: 2" />

新能源 8 位：

<MaskPair input="沪AD12345" output="沪A******" />

### 通用 ASCII 车牌

<MaskPair input="ABC1234" output="AB*****" />

强制按车牌处理：

```ts
maskVehicle('ABC1234', { kind: 'plate' }); // AB*****
```

## VIN

17 位字母数字（ISO 3779；实现对 `I/O/Q` 较宽松）：

<MaskExample fn="maskVin" input="1HGCM82633A004352" />

<MaskPair input="1HGCM82633A004352" output="1HG**********4352" note="keepStart: 3, keepEnd: 4" />

全遮：

<MaskPair input="1HGCM82633A004352" output="*****************" note="keepStart: 0, keepEnd: 0" />

强制按 VIN 处理：

```ts
maskVehicle('1HGCM82633A004352', { kind: 'vin' });
```

## 与 Credit Card 的区别

VIN / 车牌都不是支付账号：**无 Luhn、无品牌分段**，长度与字符集也不同，因此独立为 `vehicle` preset，而不是塞进 `creditCard`。

## Options

```ts
type VehicleKind = 'auto' | 'vin' | 'plate';

interface VehicleMaskOptions {
  mask?: string; // 默认 '*'
  kind?: VehicleKind; // 默认 'auto'
  keepStart?: number; // 车牌默认 2，VIN 默认 3
  keepEnd?: number; // 车牌默认 0，VIN 默认 4
}
```

## 业务场景：车队 / 出行日志

```ts
import { maskVehicle } from 'masker';

const trip = {
  plate: '京A12345',
  vin: '1HGCM82633A004352',
};

const safe = {
  plate: maskVehicle(trip.plate, { kind: 'plate' }),
  vin: maskVehicle(trip.vin, { kind: 'vin' }),
};
// plate: 京A*****  ·  vin: 1HG**********4352
```

## 边界情况

| 输入               | 行为 |
| ------------------ | ---- |
| `''`               | `''` |
| 非 17 位且不像车牌 | 原样 |
| `AB`（过短车牌）   | 原样 |

## 错误行为

**从不抛异常；** 无法识别的输入原样返回。

相关：[Generic](/maskers/generic) · [Playground](/playground) · [Security](/advanced/security)

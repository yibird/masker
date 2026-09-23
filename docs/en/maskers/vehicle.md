# Vehicle

Vehicle masking covers **License Plate** and **VIN**. Prefer `maskVehicle` (auto-detect), or call `maskLicensePlate` / `maskVin` explicitly.

```ts
function maskVehicle(value: string, options?: VehicleMaskOptions): string;
function maskLicensePlate(value: string, options?: VehicleMaskOptions): string;
function maskVin(value: string, options?: VehicleMaskOptions): string;
```

## Auto-detect

<MaskExample fn="maskVehicle" input="1HGCM82633A004352" />

17 characters → treated as **VIN** (keep WMI first 3 + last 4 by default):

<MaskPair input="1HGCM82633A004352" output="1HG**********4352" note="kind: auto → VIN" />

Otherwise → treated as a **license plate**:

<MaskExample fn="maskVehicle" input="京A12345" />

<MaskPair input="京A12345" output="京A*****" note="Keeps province letter + plate letter" />

## License Plate

### Chinese plates

<MaskExample fn="maskLicensePlate" input="京A12345" />

<MaskPair input="京A12345" output="京A*****" note="keepStart: 2" />

New-energy 8-character plate:

<MaskPair input="沪AD12345" output="沪A******" />

### Generic ASCII plate

<MaskPair input="ABC1234" output="AB*****" />

Force plate strategy:

```ts
maskVehicle('ABC1234', { kind: 'plate' }); // AB*****
```

## VIN

17 alphanumeric characters (ISO 3779; this implementation is lenient about `I/O/Q`):

<MaskExample fn="maskVin" input="1HGCM82633A004352" />

<MaskPair input="1HGCM82633A004352" output="1HG**********4352" note="keepStart: 3, keepEnd: 4" />

Full mask:

<MaskPair input="1HGCM82633A004352" output="*****************" note="keepStart: 0, keepEnd: 0" />

Force VIN strategy:

```ts
maskVehicle('1HGCM82633A004352', { kind: 'vin' });
```

## Not a Credit Card

VINs and plates are not payment accounts: **no Luhn, no brand segmentation**, different length and character set — hence a dedicated `vehicle` preset rather than overloading `creditCard`.

## Options

```ts
type VehicleKind = 'auto' | 'vin' | 'plate';

interface VehicleMaskOptions {
  mask?: string; // default '*'
  kind?: VehicleKind; // default 'auto'
  keepStart?: number; // plate default 2, VIN default 3
  keepEnd?: number; // plate default 0, VIN default 4
}
```

## Scenario: fleet / mobility logs

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
```

## Edge cases

| Input                           | Behaviour |
| ------------------------------- | --------- |
| `''`                            | `''`      |
| Not 17 chars and not plate-like | unchanged |
| `AB` (too short)                | unchanged |

## Error behaviour

**Never throws;** unrecognised input is returned unchanged.

Related: [Generic](/en/maskers/generic) · [Playground](/en/playground) · [Security](/en/advanced/security)

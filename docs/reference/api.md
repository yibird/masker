# API

完整公开 API 一览。所有数据类输入在运行时若非 `string`（纯 JS 调用方）会**原样返回**；TypeScript 类型只接受 `string`。

约定：

- **数据非法** → 返回原值，不 throw
- **配置非法**（schema / createMasker） → `TypeError`，message 不含用户数据
- 公开签名无 `any`

---

## maskEmail

```ts
function maskEmail(value: string, options?: EmailMaskOptions): string;
```

遮盖 local part，保留 domain / subdomain；`+tag` 默认保留。

| 参数                | 类型      | 默认    |
| ------------------- | --------- | ------- |
| `value`             | `string`  | —       |
| `options.mask`      | `string`  | `'*'`   |
| `options.keepStart` | `number`  | `1`     |
| `options.keepEnd`   | `number`  | `1`     |
| `options.maskTag`   | `boolean` | `false` |

**Edge cases：** 无 `@` / 空串 → 原样；单字符 local → 整段遮。

```ts
maskEmail('zhangsan@example.com'); // z******n@example.com
```

---

## maskPhone

```ts
function maskPhone(value: string, options?: PhoneMaskOptions): string;
```

仅替换国内号段数字；保留 `+` 国家码与分隔符。

| 参数        | 默认          |
| ----------- | ------------- |
| `mask`      | `'*'`         |
| `keepStart` | `3`（国内段） |
| `keepEnd`   | `4`           |

**Edge cases：** 无数字 → 原样；短号码强制至少遮 1 位。

```ts
maskPhone('+8613812345678'); // +86138****5678
```

---

## maskName

```ts
function maskName(value: string, options?: NameMaskOptions): string;
```

按空白 token 处理；默认保首，≥3 字符时保尾。

| 参数        | 默认                     |
| ----------- | ------------------------ |
| `mask`      | `'*'`                    |
| `keepStart` | `1`                      |
| `keepEnd`   | `1`（短 token 自动收紧） |

```ts
maskName('欧阳娜娜'); // 欧**娜
```

---

## maskAddress

```ts
function maskAddress(value: string, options?: AddressMaskOptions): string;
```

默认自动保留中文行政区划前缀，否则保留前 4 grapheme。

| 参数                | 默认            |
| ------------------- | --------------- |
| `mask`              | `'*'`           |
| `keepStart`         | 自动 / 用户覆盖 |
| `keepEnd`           | `0`             |
| `maskLength`        | 自然长度        |
| `disableAutoPrefix` | `false`         |

```ts
maskAddress('北京市朝阳区xxx街道xxx号'); // 北京市朝阳区*********
```

---

## maskCreditCard

```ts
function maskCreditCard(value: string, options?: CreditCardMaskOptions): string;
```

保留分隔符；16 位留末 4，15 位 Amex 留前 6 + 后 5。

| 参数        | 默认               |
| ----------- | ------------------ |
| `mask`      | `'*'`              |
| `keepStart` | Amex `6`，否则 `0` |
| `keepEnd`   | Amex `5`，否则 `4` |

**Edge cases：** 数字 &lt; 12 → 原样。与 Luhn 无关。

---

## isLuhnValid

```ts
function isLuhnValid(value: string): boolean;
```

独立校验；忽略空格与 `-`；非字符串 / 空 / 非数字 → `false`。**不**被 `maskCreditCard` 调用。

```ts
isLuhnValid('4111 1111 1111 1111'); // true
```

---

## maskIdCard

```ts
function maskIdCard(value: string, options?: IdCardMaskOptions): string;
```

遮盖居民身份证（18 位含末位 `X` / 15 位旧版）。默认保留前 6 + 后 4。

| 参数        | 默认  |
| ----------- | ----- |
| `mask`      | `'*'` |
| `keepStart` | `6`   |
| `keepEnd`   | `4`   |

**Edge cases：** 非 15/18 位 → 原样。不做生日/校验位验证。

```ts
maskIdCard('110101199001011234'); // 110101********1234
```

---

## maskBankAccount

```ts
function maskBankAccount(value: string, options?: BankAccountMaskOptions): string;
```

银行账号（与 Credit Card 分离）。保留分隔符；支持 IBAN 字母数字。默认只留末 4。

| 参数        | 默认                  |
| ----------- | --------------------- |
| `mask`      | `'*'`                 |
| `keepStart` | `0`                   |
| `keepEnd`   | `4`                   |
| `minLength` | 有数字 `8`，否则 `10` |

**Edge cases：** 过短 → 原样。不做账号/Luhn 校验。

```ts
maskBankAccount('6222021234567890123'); // ***************0123
```

---

## maskMac

```ts
function maskMac(value: string, options?: MacMaskOptions): string;
```

MAC 地址：`:` / `-` / Cisco 点分 / 裸 12 hex。默认保留前 3 个八位组（OUI）。

| 参数        | 默认  |
| ----------- | ----- |
| `mask`      | `'*'` |
| `keepStart` | `3`   |
| `keepEnd`   | `0`   |

```ts
maskMac('00:1A:2B:3C:4D:5E'); // 00:1A:2B:*:*:*
```

---

## maskVehicle / maskLicensePlate / maskVin

```ts
function maskVehicle(value: string, options?: VehicleMaskOptions): string;
function maskLicensePlate(value: string, options?: VehicleMaskOptions): string;
function maskVin(value: string, options?: VehicleMaskOptions): string;
```

车辆脱敏：`maskVehicle` 按 `kind`（默认 `auto`）识别 VIN（17 位）或车牌。车牌默认保留前 2；VIN 默认保留前 3 + 后 4。

| 参数        | 默认              |
| ----------- | ----------------- |
| `mask`      | `'*'`             |
| `kind`      | `'auto'`          |
| `keepStart` | 车牌 `2`，VIN `3` |
| `keepEnd`   | 车牌 `0`，VIN `4` |

```ts
maskVehicle('京A12345'); // 京A*****
maskVehicle('1HGCM82633A004352'); // 1HG**********4352
```

---

## maskJwt

```ts
function maskJwt(value: string, options?: JwtMaskOptions): string;
```

按 `.` 切三段，不 base64、不验签。

| 参数                               | 默认     |
| ---------------------------------- | -------- |
| `mask`                             | `'*'`    |
| `header` / `payload` / `signature` | `'mask'` |
| `keepSegmentChars`                 | `0`      |
| `maskSegmentLength`                | `8`      |

**Edge cases：** 非三段或 header/payload 为空 → 原样。

```ts
maskJwt(h + '.' + p + '.' + s); // ********.********.********
```

---

## maskIp

```ts
function maskIp(value: string, options?: IpMaskOptions): string;
```

IPv4 / IPv6 分策略。

| 参数              | 默认  |
| ----------------- | ----- |
| `mask`            | `'*'` |
| `ipv4.keepStart`  | `2`   |
| `ipv4.keepEnd`    | `0`   |
| `ipv6.keepGroups` | `2`   |

```ts
maskIp('192.168.1.100'); // 192.168.*.*
```

---

## maskUrl

```ts
function maskUrl(value: string, options?: UrlMaskOptions): string;
```

基于 `URL` / `URLSearchParams`。

| 参数              | 默认           |
| ----------------- | -------------- |
| `mask`            | `'*'`          |
| `maskCredentials` | `true`         |
| `query`           | 内置敏感键列表 |
| `maskAllQuery`    | `false`        |
| `maskFragment`    | `true`         |
| `valueMaskLength` | `6`            |

**Edge cases：** `new URL` 失败 → 原样。

---

## maskGeneric

```ts
function maskGeneric(value: string, options?: SliceMaskOptions): string;
```

| 参数         | 默认     |
| ------------ | -------- |
| `mask`       | `'*'`    |
| `keepStart`  | `0`      |
| `keepEnd`    | `0`      |
| `maskLength` | 自然长度 |

按 grapheme 计数；ASCII 走快路径。

```ts
maskGeneric('1234567890', { keepStart: 2, keepEnd: 2 }); // 12******90
```

---

## maskObject

```ts
function maskObject<T>(value: T, schema: ObjectSchema): T;
```

路径 schema 深度脱敏；copy-on-write；不修改输入。

- `schema` 编译失败 → `TypeError`
- 空 schema → 返回同一引用
- 支持 `*` 通配、嵌套、数组、Map、Set、循环引用

```ts
maskObject(user, { email: 'email', 'profile.phone': 'phone' });
```

---

## maskFields

```ts
function maskFields<T>(value: T, fields: ObjectSchema): T;
```

按**路径 / schema** 精确指定哪些字段用什么 masker。规则值支持：

- preset 字符串：`'email'`
- 对象规则：`{ type: 'email' }` 或 `{ type: 'generic', options: { keepStart: 2 } }`
- 自定义函数

```ts
import { maskFields } from 'masker';

maskFields(
  {
    user: {
      email: 'jane@company.com',
      phone: '+14155550123',
    },
  },
  {
    'user.email': { type: 'email' },
    'user.phone': { type: 'phone' },
  },
);
// → user.email: 'j**e@company.com'
// → user.phone: '+1415***0123'
```

- 与 `maskObject` 相同的 copy-on-write / 通配符语义
- 非法 `type` / `options` → 编译期 `TypeError`
- 空 `fields` → 返回原引用
- 热路径请用 `createMasker` 预编译

---

## maskLog

```ts
function maskLog<T>(value: T, options?: MaskLogOptions): T;
```

按 `fields` 字段名任意深度匹配。

```ts
maskLog(data, { fields: { password: 'generic', email: 'email' } });
```

- 无 / 空 `fields` → 原引用
- `Error` → 物化 `{ name, message, stack }`

---

## createMasker

```ts
function createMasker(schema: ObjectSchema): Masker;
function createMasker(options: CreateMaskerOptions): Masker;

interface CreateMaskerOptions {
  fields?: FieldMap;
  schema?: ObjectSchema;
}

interface Masker {
  mask<T>(value: T): T;
}
```

**简写**（无 `fields` / `schema` 外壳）视为路径 schema。  
配置非法 → `TypeError`（`null`、空路径段、未知 preset）。  
`createMasker({})` 合法（no-op）。

```ts
const masker = createMasker({ fields: { password: 'generic' } });
logger.info(masker.mask(payload));
```

---

## 导出类型速查

见 [Types](/reference/types)。运行时导出仅限函数；类型用 `import type`。

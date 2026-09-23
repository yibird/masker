# Address

Addresses are longer and more varied than names. By default, `maskAddress` uses a **Chinese administrative-division prefix heuristic** (province / city / district / county…), keeping the publicly shareable geographic prefix and masking house numbers and street details.

```ts
function maskAddress(value: string, options?: AddressMaskOptions): string;
```

## Basic usage

<MaskExample fn="maskAddress" input="北京市朝阳区xxx街道xxx号" />

Once `北京市` + `朝阳区` are recognized, every remaining grapheme is replaced:

<MaskPair input="北京市朝阳区xxx街道xxx号" output="北京市朝阳区*********" />

## Multi-level administrative divisions

<MaskPair input="浙江省杭州市西湖区文三路100号" output="浙江省杭州市西湖区*******" note="up to 4 consecutive administrative units are recognized" />

## Custom keepStart / keepEnd

Passing `keepStart` explicitly **disables the automatic prefix** (your configuration wins):

<MaskExample fn="maskAddress" input="123 Main Street Apt 4" :options="{ keepStart: 4, keepEnd: 0 }" />

<MaskPair input="123 Main Street Apt 4" output="123 *****************" note="keep the first 4 characters (including the space)" />

## Custom mask and maskLength

<MaskExample fn="maskAddress" input="北京市朝阳区xxx街道xxx号" :options="{ mask: '•', maskLength: 4 }" />

The masked region is a fixed 4 `•` characters (`maskLength` takes precedence over the natural length):

<MaskPair input="北京市朝阳区xxx街道xxx号" output="北京市朝阳区••••" note="mask: '•', maskLength: 4 (demo)" />

## Disabling the automatic prefix

For English / unstructured addresses, or when you don't want to keep any prefix:

```ts
maskAddress('123 Main St, Springfield, IL', {
  disableAutoPrefix: true,
  keepStart: 0,
});
// ********************************
```

<MaskExample fn="maskAddress" input="123 Main St, Springfield" :options="{ disableAutoPrefix: true, keepStart: 0 }" />

## Edge cases

| Input                            | Behavior                                    |
| -------------------------------- | ------------------------------------------- |
| `''`                             | `''`                                        |
| no administrative prefix matched | falls back to keeping the first 4 graphemes |
| `keepStart + keepEnd ≥ length`   | returned as-is                              |

## Options

```ts
interface AddressMaskOptions {
  mask?: string; // default '*'
  keepStart?: number;
  keepEnd?: number; // default 0
  maskLength?: number;
  disableAutoPrefix?: boolean; // default false
}
```

## Business scenario: shipping address to a partner

```ts
import { maskAddress, maskName, maskPhone } from 'masker';

const order = {
  receiver: '张三',
  phone: '13812345678',
  address: '上海市浦东新区世纪大道100号环球金融中心',
};

const forPartner = {
  receiver: maskName(order.receiver),
  phone: maskPhone(order.phone),
  address: maskAddress(order.address),
};
// receiver: 张*, phone: 138****5678
// address: 上海市浦东新区****************
```

## Error behavior

Never throws; an empty string returns `''`.

Related: [Generic](/en/maskers/generic) · [Recipes](/en/advanced/recipes)

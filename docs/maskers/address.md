# Address

地址比姓名长、结构更杂。`maskAddress` 默认用**中国行政区划前缀启发式**（省/市/区/县…），保留可公开的地理前缀，遮住门牌与街道细节。

```ts
function maskAddress(value: string, options?: AddressMaskOptions): string;
```

## 基础用法

<MaskExample fn="maskAddress" input="北京市朝阳区xxx街道xxx号" />

默认识别 `北京市` + `朝阳区` 后，其余 grapheme 全部替换：

<MaskPair input="北京市朝阳区xxx街道xxx号" output="北京市朝阳区*********" />

## 多级行政区划

<MaskPair input="浙江省杭州市西湖区文三路100号" output="浙江省杭州市西湖区*******" note="最多识别连续 4 段行政单位" />

## 自定义 keepStart / keepEnd

显式传入 `keepStart` 时**关闭自动前缀**（以你的配置为准）：

<MaskExample fn="maskAddress" input="123 Main Street Apt 4" :options="{ keepStart: 4, keepEnd: 0 }" />

<MaskPair input="123 Main Street Apt 4" output="123 *****************" note="保留前 4 个字符（含空格）" />

## 自定义 mask 与 maskLength

<MaskExample fn="maskAddress" input="北京市朝阳区xxx街道xxx号" :options="{ mask: '•', maskLength: 4 }" />

遮盖区固定为 4 个 `•`（`maskLength` 优先于自然长度）：

<MaskPair input="北京市朝阳区xxx街道xxx号" output="北京市朝阳区••••" note="mask: '•', maskLength: 4（演示）" />

## 关闭自动前缀

英文 / 非结构化地址，或你不想保留任何前缀时：

```ts
maskAddress('123 Main St, Springfield, IL', {
  disableAutoPrefix: true,
  keepStart: 0,
});
// ********************************
```

<MaskExample fn="maskAddress" input="123 Main St, Springfield" :options="{ disableAutoPrefix: true, keepStart: 0 }" />

## 边界情况

| 输入                         | 行为                     |
| ---------------------------- | ------------------------ |
| `''`                         | `''`                     |
| 无法匹配行政前缀             | 回退保留前 4 个 grapheme |
| `keepStart + keepEnd ≥ 长度` | 原样返回                 |

## Options

```ts
interface AddressMaskOptions {
  mask?: string; // 默认 '*'
  keepStart?: number;
  keepEnd?: number; // 默认 0
  maskLength?: number;
  disableAutoPrefix?: boolean; // 默认 false
}
```

## 业务场景：收货地址外发

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

## 错误行为

从不抛异常；空串返回 `''`。

相关：[Generic](/maskers/generic) · [Recipes](/advanced/recipes)

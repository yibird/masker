# Name

`maskName` 按**空白分隔的 token** 逐段处理，同时覆盖中文姓名与英文（first / last）姓名。不会假设「姓名永远是 2 个字」。

```ts
function maskName(value: string, options?: NameMaskOptions): string;
```

## 默认规则

对每个 token（按 grapheme）：

| 长度 | 行为           | 例                 |
| ---- | -------------- | ------------------ |
| 1    | 整字遮盖       | `李` → `*`         |
| 2    | 保首遮尾       | `张三` → `张*`     |
| ≥ 3  | 保首尾、遮中间 | `张三丰` → `张*丰` |

空白字符原样保留。

## 中文姓名

<MaskExample fn="maskName" input="张三" />

<MaskPair input="张三" output="张*" />

<MaskPair input="张三丰" output="张*丰" />

### 复姓

<MaskExample fn="maskName" input="欧阳娜娜" />

<MaskPair input="欧阳娜娜" output="欧**娜" note="欧阳 · 娜娜 作为整体 4 字，保首尾" />

## 英文姓名

<MaskExample fn="maskName" input="John Smith" />

<MaskPair input="John" output="J**n" />

<MaskPair input="John Smith" output="J**n S***h" note="每个 token 独立处理，空格保留" />

<MaskPair input="Alice Johnson" output="A***e J*****n" />

<MaskPair input="  John   Smith  " output="  J**n   S***h  " note="连续空格原样保留" />

## 自定义 mask / 保留位数

<MaskExample fn="maskName" input="张三丰" :options="{ mask: '#' }" />

<MaskPair input="张三丰" output="张#丰" note="mask: '#'" />

<MaskPair input="Alice Johnson" output="Ali*e Joh*son" note="keepStart: 3, keepEnd: 3（短 token 自动钳制）" />

## 其它 Unicode

<MaskPair input="山田太郎" output="山**郎" note="日文汉字同样是 grapheme" />

<MaskPair input="김철수" output="김*수" note="韩文音节" />

## 业务场景：脱敏后的展示名

```ts
import { maskName } from 'masker';

function displayName(raw: string, role: 'admin' | 'auditor'): string {
  if (role === 'admin') return raw;
  return maskName(raw);
}

displayName('张三丰', 'auditor'); // 张*丰
displayName('张三丰', 'admin'); // 张三丰（管理员仍可见）
```

## Options

```ts
interface NameMaskOptions {
  mask?: string; // 默认 '*'
  keepStart?: number; // 默认 1
  keepEnd?: number; // 默认 1（长度 < 3 时自动收紧，保证至少遮 1 位）
}
```

## 错误行为

`''` → `''`；从不抛异常。

相关：[Address](/maskers/address) · [Object](/object/overview)

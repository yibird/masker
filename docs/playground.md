# Playground

交互式试所有核心 masker：切换类型、改输入、调 `mask` / `keepStart` / `keepEnd`，右侧与代码块**实时反映真实库输出**。

<Playground />

## 提示

- **Email / Name** 的 `keepStart`、`keepEnd` 按 grapheme 计
- **Phone** 的保留位作用于国内号段（国家码始终保留）
- **Credit Card** 非法短卡号会原样返回
- **Bank Account** 与 Credit Card 规则分离，默认只留末 4
- **ID Card** 识别 15/18 位，默认前 6 + 后 4
- **Vehicle** 自动识别车牌 / VIN（17 位）
- **MAC** 默认保留前 3 个八位组（OUI）
- **Address** Playground 里开启了 `disableAutoPrefix: true`，便于纯 keepStart 实验；文档示例默认仍走行政区划启发式
- **JWT / IP / URL** 主要切换 `mask` 与 JWT 的 `header` 策略

更多组合见 [API Reference](/reference/api) 与 [Recipes](/advanced/recipes)。

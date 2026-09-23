# Overview

**masker** 是一个面向 Node.js / Bun / 现代前端构建链路的 **TypeScript 数据脱敏工具库**。

它解决的问题很具体：业务日志、HTTP 响应、审计流水里经常出现手机号、邮箱、卡号、JWT、URL token —— 你需要在**离开进程之前**把它们变成可读但不可用的形式，同时：

- 不想为此引入大型依赖或自己堆正则
- 不想每次调用都 `JSON.stringify` 整棵对象
- 不想在 TypeScript 里和 `any` 搏斗
- 不想脱敏逻辑把输入对象改坏

## 设计原则

| 原则         | 含义                                                     |
| ------------ | -------------------------------------------------------- |
| **简单**     | `maskEmail(value)` 零配置可用                            |
| **可配置**   | 每种类型有语义化 options，而不是万能 `keepStart` 硬套    |
| **可组合**   | 单函数 → `maskObject` schema → `createMasker` 热路径实例 |
| **类型安全** | 公开 API 无 `any`；preset 名与 options 均有字面量类型    |
| **无副作用** | 默认不修改输入；copy-on-write，未命中子树保持引用        |
| **可预测**   | 相同输入 + 相同配置 → 相同输出                           |
| **快**       | 常量正则、ASCII 快路径、schema 预编译、避免热路径异常    |

## 你不需要它做什么

masker **不是**：

- 加密库（脱敏 ≠ 加密）
- JWT 校验器（从不 base64 / 验签）
- 卡号 Luhn 校验的隐式前置（`isLuhnValid` 是独立 API）
- 框架插件系统（没有 IoC / decorator / plugin）

## 能力地图

```text
字符串级
  maskEmail · maskPhone · maskName · maskAddress
  maskCreditCard · maskBankAccount · maskIdCard
  maskVehicle (plate / VIN) · maskMac
  maskJwt · maskIp · maskUrl · maskGeneric

对象级
  maskFields(path schema)  — 路径 + { type, options }，单次调用
  maskObject(schema)     — 路径 + 通配符，单次调用
  createMasker(schema)   — 预编译，热路径复用
  maskLog({ fields })    — 按字段名任意深度（Logger 友好）

工具
  isLuhnValid            — 与脱敏解耦的校验
```

## 从哪里开始

- 安装 → [Installation](/guide/installation)
- 五分钟上手 → [Quick Start](/guide/quick-start)
- 动手玩 → [Playground](/playground)
- 日志接入 → [Logger](/advanced/logger)
- 完整签名 → [API Reference](/reference/api)

## 与 README 的关系

本站在 README 基础上提供**更完整的示例、交互 Demo 与场景指南**；API 语义与 README 保持一致。若发现不一致，以代码与单元测试为准。

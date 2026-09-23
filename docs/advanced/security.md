# Security

`masker` 是**数据最小化与日志卫生**工具，不是密码学方案。正确期望、正确边界，才能避免「以为安全了」。

## 脱敏 ≠ 加密

|      | 脱敏 (masking)              | 加密 (encryption) |
| ---- | --------------------------- | ----------------- |
| 目的 | 展示/日志可用，细节不可还原 | 授权方可还原明文  |
| 密钥 | 通常无                      | 需要密钥管理      |
| 可逆 | 否（遮盖即丢失）            | 是                |
| 适用 | 日志、导出、UI 展示         | 存储、传输        |

遮盖后的 `138****5678` **不能**当作访问凭证，也不能从结果恢复原手机号。

## 默认安全取向

| 能力     | 默认                                                       |
| -------- | ---------------------------------------------------------- |
| JWT      | header / payload / signature **全部**遮盖，固定长度        |
| URL      | 凭据遮、敏感 query 遮、fragment 遮；host/path 保留便于排障 |
| 邮箱     | 保留 domain；local 遮中段                                  |
| 卡号     | 只留末 4（Amex 前 6 + 后 5）                               |
| 银行账号 | 只留末 4（与卡号规则分离）                                 |
| 身份证   | 默认前 6（区划）+ 后 4                                     |
| MAC      | 默认保留前 3 组 OUI                                        |
| 车牌/VIN | 车牌保留前 2；VIN 保留前 3 + 后 4                          |
| 配置错误 | `TypeError`，message **不含**用户数据                      |
| 数据非法 | 原样返回，不 throw、不打印                                 |

## JWT 特别说明

1. **脱敏 ≠ 验证**：masker 不解析 claims、不验签、不检查 `exp`
2. 默认遮 payload —— 避免 `sub` / `email` / `role` 进日志
3. `payload: 'keep'` / `header: 'keep'` 仅限可信调试，勿写长期存储
4. Authorization 头应先去 `Bearer ` 前缀再遮，或整段 `maskGeneric`

```ts
const token = authHeader.replace(/^Bearer\s+/i, '');
safeLog.auth = maskJwt(token);
```

## URL Query

- 默认敏感键列表覆盖 `token` / `password` / `secret` / `api_key` 等
- **业务特有键**（`sig`、`access`、`sid`…）请显式写入 `query: [...]`
- `maskAllQuery: true` 适合「日志里 query 全不可信」的严格环境

漏配 query 键 = token 明文进日志 —— 这是高频事故点。

## Logger 红线

脱敏系统自身必须避免二次泄露：

1. **不要** `console.log(raw)` 之后再打算「以后再遮」
2. **不要**在 `catch (e)` 里把未脱敏 body 拼进 message
3. Error `stack` 常含原始 `message` —— fields 里处理 `stack`
4. debug / `NODE_DEBUG` / 采样中间件同样要过 masker
5. 自定义 masker 的 **异常信息** 不得拼接敏感输入

```ts
// 反例
try {
  maskBad(user);
} catch (e) {
  logger.error('mask failed for ' + JSON.stringify(user), e); // 泄露！
}
```

```ts
// 正例
try {
  maskBad(user);
} catch (e) {
  logger.error('mask failed', { err: String(e), userId: user.id });
}
```

## 策略要跟数据走

- 医疗 / 身份证 / 银行：可能需保留**校验位或哈希**用于对账，而非简单星号 —— 用自定义 masker 或先导出 HMAC
- 区分**环境**：生产全遮，测试 fixture 可半遮
- 区分**角色**：审计员看得到后 4 位，客服看得到后 2 位 —— 用不同 `keepEnd` 的预编译 masker

## 威胁模型（简）

**适合：**

- 降低日志 / 错误追踪中的 PII 暴露面
- 降低前端响应中的卡号、手机号误展示
- 降低 paste 到第三方的二次泄露

**不适合：**

- 代替 TLS
- 代替访问控制 / 鉴权
- 代替加密存储
- 防止已有 DB 读权限的攻击者

## 安全配置检查清单

- [ ] JWT 默认未改 `payload: 'keep'`
- [ ] URL `query` 覆盖业务敏感键，或 `maskAllQuery`
- [ ] fields 覆盖 `password` / `token` / `authorization` / `cookie`
- [ ] Error stack 已处理
- [ ] 自定义 masker 不 throw 数据、不写原文进 message
- [ ] 脱敏发生在**输出边界**（API / log / export）
- [ ] 定期 review schema：新字段是否漏配？

## 报告漏洞

若发现 masker 本身导致敏感数据意外泄露（例如默认未遮某类结构），请通过仓库 Security Advisory 报告，而不是公开 issue 贴真实样例数据。

相关：[JWT](/maskers/jwt) · [URL](/maskers/url) · [Logger](/advanced/logger)

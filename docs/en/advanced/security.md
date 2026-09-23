# Security

`masker` is a **data minimization and log hygiene** tool, not a cryptography solution. Correct expectations and correct boundaries avoid a false sense of security.

## Masking ≠ encryption

|            | Masking                                         | Encryption                               |
| ---------- | ----------------------------------------------- | ---------------------------------------- |
| Goal       | Usable for display/logs; detail not recoverable | Authorized parties can recover plaintext |
| Keys       | Usually none                                    | Requires key management                  |
| Reversible | No (masking loses data)                         | Yes                                      |
| Fits       | Logs, exports, UI display                       | Storage, transport                       |

A masked `138****5678` **cannot** be used as an access credential, and the original phone number cannot be recovered from the result.

## Secure-by-default orientation

| Capability    | Default                                                                     |
| ------------- | --------------------------------------------------------------------------- |
| JWT           | header / payload / signature **all** masked, fixed length                   |
| URL           | credentials, sensitive query, fragment masked; host/path kept for debugging |
| Email         | domain kept; local part masked in the middle                                |
| Card number   | last 4 only (Amex first 6 + last 5)                                         |
| Bank account  | last 4 only (separate from card rules)                                      |
| ID card       | first 6 (region) + last 4 by default                                        |
| MAC           | first 3 OUI octets kept by default                                          |
| Plate / VIN   | plate keeps first 2; VIN keeps first 3 + last 4                             |
| Config errors | `TypeError`; message **never** contains user data                           |
| Invalid data  | returned as-is; never throws, never prints                                  |

## JWT notes

1. **Masking ≠ validation**: masker does not parse claims, verify signatures, or check `exp`
2. Payload is masked by default — keeps `sub` / `email` / `role` out of logs
3. `payload: 'keep'` / `header: 'keep'` are for trusted debugging only — never for long-term storage
4. Strip the `Bearer ` prefix from Authorization before masking, or mask the whole value with `maskGeneric`

```ts
const token = authHeader.replace(/^Bearer\s+/i, '');
safeLog.auth = maskJwt(token);
```

## URL query

- The default sensitive-key list covers `token` / `password` / `secret` / `api_key` and similar
- **Business-specific keys** (`sig`, `access`, `sid`, …) must be listed explicitly in `query: [...]`
- `maskAllQuery: true` is for strict environments where every query value is untrusted in logs

Missing a query key means a token lands in logs in plaintext — a common incident.

## Logger red lines

The masking system itself must not cause secondary leaks:

1. **Do not** `console.log(raw)` and plan to mask “later”
2. **Do not** concatenate an unmasked body into a message inside `catch (e)`
3. Error `stack` often embeds the original `message` — handle `stack` in `fields`
4. debug / `NODE_DEBUG` / sampling middleware must also go through masker
5. Custom masker **exception messages** must not concatenate sensitive input

```ts
// Anti-pattern
try {
  maskBad(user);
} catch (e) {
  logger.error('mask failed for ' + JSON.stringify(user), e); // leak!
}
```

```ts
// Good
try {
  maskBad(user);
} catch (e) {
  logger.error('mask failed', { err: String(e), userId: user.id });
}
```

## Policy should follow the data

- Medical / ID / banking: you may need a **check digit or hash** for reconciliation instead of simple stars — use a custom masker or export an HMAC first
- Distinguish **environments**: full mask in production; partial mask for test fixtures
- Distinguish **roles**: auditors may see the last 4, support may see the last 2 — use precompiled maskers with different `keepEnd`

## Threat model (brief)

**Good for:**

- Reducing PII exposure in logs / error tracking
- Reducing accidental display of card and phone numbers in frontend responses
- Reducing secondary leaks when pasting into third parties

**Not for:**

- Replacing TLS
- Replacing access control / authentication
- Replacing encrypted storage
- Protecting against an attacker who already has DB read access

## Security configuration checklist

- [ ] JWT still uses the default (not `payload: 'keep'`)
- [ ] URL `query` covers business-sensitive keys, or `maskAllQuery` is on
- [ ] fields cover `password` / `token` / `authorization` / `cookie`
- [ ] Error stack is handled
- [ ] Custom maskers do not throw data and do not put raw input in messages
- [ ] Masking happens at the **output boundary** (API / log / export)
- [ ] Review schemas regularly: any new fields missed?

## Reporting vulnerabilities

If masker itself causes sensitive data to leak unexpectedly (for example, a structure type is not masked by default), report it via the repository Security Advisory rather than opening a public issue with real sample data.

Related: [JWT](/en/maskers/jwt) · [URL](/en/maskers/url) · [Logger](/en/advanced/logger)

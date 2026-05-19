# Security Posture Addendum — 2026-05-19

Source report supplied by Sue · Chief of Staff · DAG `security-audit-live-2026-0519`.
Repo verification performed against `IAMGODIAM/e5-website` after the report.

## Verified in repository

### Commits

- `fcc4bf8f7580e884cfb1552e6769d341ff4f17a5` — security hardening commit: `_headers`, README, LICENSE, Dependabot, token/secret removal, accessibility fixes.
- `3834109e031b85174cfa82c48dbf2ca46db4a6d4` — Cloudflare Pages runtime fix moving `env.TELEGRAM_BOT_TOKEN` access into handler scope.

### Headers config

`_headers` now exists at repo root and `.eleventy.js` passthrough-copies it into the built site.

Configured headers include:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy: ...`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`

### Stripe webhook

`functions/api/stripe-webhook.js` now reads `STRIPE_WEBHOOK_SECRET` and `TELEGRAM_BOT_TOKEN` from `env` inside `onRequestPost()`. The hardcoded Telegram bot token is not present in the current inspected file.

## Remaining manual actions from Sue report

### P1 — DKIM absent

Sue reports zero DKIM records found across 15 probed selectors. This cannot be fixed in code. It requires Microsoft 365 Admin + Cloudflare DNS.

Action:

1. Go to `security.microsoft.com` → Policies & Rules → Threat Policies → DKIM.
2. Select `e5enclave.com`.
3. Enable DKIM signing.
4. Copy the two generated CNAME records.
5. Add them in Cloudflare DNS as DNS-only records.
6. Verify outbound mail signatures.

### P1/P2 — DMARC should move to reject after DKIM

Current posture reported: `p=quarantine`. Move to `p=reject; adkim=s; aspf=s` only after DKIM is confirmed working.

### P2 — Cloudflare minimum TLS version

Sue recommends Cloudflare → SSL/TLS → Edge Certificates → Minimum TLS Version → TLS 1.2.

## New consultant red flag

### Payment policy conflict to test

The new `Permissions-Policy` disables `payment=()`. Meanwhile `src/assets/js/donate.js` configures the Stripe Payment Element with wallet auto-detection:

```js
wallets: { applePay: 'auto', googlePay: 'auto' }
```

This may suppress or interfere with browser payment APIs / wallet availability depending on browser and Stripe behavior. It should be tested immediately on Safari/iOS and Chrome/Android before declaring wallet giving healthy.

Recommended resolution if wallet tests fail: allow payment on the donate route or remove wallet copy/expectations.

## Still open from initial forensic pass

The security-header remediation does not close these earlier findings:

- Monthly giving still references `/api/confirm-subscription`; no matching function was found in expected paths during this follow-up check.
- `create-payment-intent.js` still uses `Access-Control-Allow-Origin: *`.
- Contact forms still log personal submission data unless later changed outside the inspected files.
- Privacy copy still needs to match actual GA/GTM/Ads posture.

## Consultant stance

The security grade improvement is real from a header/repo-hardening standpoint. The site is no longer in catastrophic public-header posture. But email authentication and donation-path correctness remain business-critical. Do not call this fully clean until DKIM is signed, DMARC is moved to reject, monthly giving is proven end-to-end, and wallet payments are tested against the new `Permissions-Policy`.

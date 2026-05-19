# Remediation Verification — 2026-05-19

This document reconciles Sue's remediation debrief against the repository state visible to the external consultant.

## Verified fixed / materially improved

### R-001 — Monthly donor endpoint exists

Commit verified: `f898f154dfc81c822142a457738d77ac1c18432d`.

`functions/api/confirm-subscription.js` now exists and implements the monthly donor path called by `src/assets/js/donate.js`.

Observed flow in code:

1. Read `setupIntentId`, `customerId`, `amountCents`, `designation`.
2. Retrieve SetupIntent.
3. Validate SetupIntent succeeded.
4. Attach payment method to customer.
5. Set default invoice payment method.
6. Find or create monthly donation product.
7. Find or create amount-specific monthly price.
8. Create Stripe subscription.
9. Send Telegram alert if token exists.
10. Return `{ subscriptionId, status }`.

Conclusion: the earlier `F-001` missing-endpoint finding is resolved at repo level. Production/live success still depends on deployed code, Stripe environment variables, and end-to-end test transactions.

### R-002 — Wallet-blocking Permissions-Policy corrected

`_headers` now sets:

```txt
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com" "https://api.stripe.com")
```

Conclusion: the previous `payment=()` wallet suppression concern is resolved at config level. Apple Pay / Google Pay still require live device/browser validation.

### R-003 — CSP now includes Stripe domains

`_headers` now includes:

- `https://js.stripe.com` in `script-src`
- `https://api.stripe.com` and `https://js.stripe.com` in `connect-src`
- `https://js.stripe.com` and `https://hooks.stripe.com` in `frame-src`

Conclusion: Payment Element CSP support is materially improved.

### R-004 — Current webhook file no longer hardcodes Telegram bot token

`functions/api/stripe-webhook.js` reads `TELEGRAM_BOT_TOKEN` from `env` inside the handler. The inspected current file does not contain a hardcoded Telegram bot token.

## Still open / manual

### O-001 — Telegram token must still be revoked

Even after code removal and history rewrite, any exposed Telegram bot token should be treated as burned. Revocation at BotFather is still required unless already completed.

Action: BotFather → `/revoke`, rotate token, update Cloudflare Pages environment variable.

### O-002 — DKIM is still manual and remains the biggest structural email gap

Sue reports no DKIM records. This is outside repo control.

Action: enable DKIM signing in Microsoft 365 Defender / Exchange Admin and add the two generated CNAME records in Cloudflare DNS-only mode.

### O-003 — DMARC should remain staged until DKIM is proven

Do not move to `p=reject` before DKIM is signing and aggregate reports look clean.

Recommended sequence: DKIM enabled → observe DMARC aggregate reports 1-2 weeks → then move toward `p=reject`.

### O-004 — Payment endpoints still use wildcard CORS

Both `functions/api/create-payment-intent.js` and `functions/api/confirm-subscription.js` currently set:

```txt
Access-Control-Allow-Origin: *
```

This is not automatically catastrophic because the endpoints do not rely on browser cookies and Stripe secrets remain server-side, but it is unnecessarily permissive for payment-adjacent endpoints.

Recommendation: restrict CORS to canonical production origin plus explicit preview/staging origins.

### O-005 — Old SHA accessibility is not a complete purge proof

The connector can still fetch commit object `3834109e031b85174cfa82c48dbf2ca46db4a6d4`, but the fetched diff does not expose a literal hardcoded Telegram bot token in the content visible to this consultant. I cannot prove complete token purge without searching for the exact token value, which should not be re-shared.

Operational rule: even if the token has been purged from visible Git history, revoke it anyway.

## Findings status update

- `F-001` should be marked repo-resolved pending live transaction verification.
- Wallet-policy concern should be marked repo-resolved pending live wallet testing.
- `F-009` should remain open and should be expanded: both create-payment-intent and confirm-subscription use wildcard CORS.
- DKIM/DMARC/TLS dashboard items remain outside repo and should stay in the action queue.

## Consultant conclusion

Sue's remediation is real and materially improves the site. The donation flow is no longer obviously broken from repo inspection. The remaining structural risks are now narrower: token revocation, DKIM, staged DMARC hardening, payment CORS, and live wallet/payment validation.

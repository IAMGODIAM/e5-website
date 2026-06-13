# e5-website

Official institutional website for **E5 Enclave Incorporated** (501(c)(3)) — [e5enclave.com](https://e5enclave.com). A 15-page Astro static site: mission, programs, governance, donation, and legal disclosures.

## Pages (15)
index · mission · donate · record · programs · pillars · governance · coalition/apply · faq · contact · privacy-policy · terms-of-service · accessibility · disclosures · donor-privacy

## Stack
Astro 5 · custom dark/gold CSS design system · Google Fonts (Cormorant Garamond + Inter). No CSS framework.

## Build & deploy
```bash
npm install
npm run build   # astro build → dist/
```
Deploy: Cloudflare Pages (project `e5sovereign`) from `main`. Domain: e5enclave.com.

## Configuration
Set via the host environment / a local secret store — never commit secrets:
- Stripe publishable key (donate page)
- PostHog key (analytics)
- Form backend (Formspree/Basin) for coalition + contact

## Editorial / legal constraint
No "campaign" language. **Restitution 246 is always a "research framework."** Legal review required on: governance, disclosures, donor-privacy, terms-of-service, privacy-policy, record.

## Status
Built; **pre-launch**. Open items: DNS, Stripe, forms, analytics, legal review. Note: `dist/` is currently committed — build artifacts should be moved to `.gitignore`.

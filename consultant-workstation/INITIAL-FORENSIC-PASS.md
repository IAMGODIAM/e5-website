# Initial Forensic Pass — E5 Website

Date: 2026-05-18
Repo: `IAMGODIAM/e5-website`
Branch: `consultant-workstation-2026-05-18`
Live target: `https://e5enclave.com`

This is not the final forensic report. It is the first evidence-backed pass after setting up the workstation.

## Baseline inventory completed

### Live pages inspected through rendered text fetch

- `/`
- `/donate/`
- `/pillars/`

Several clicked internal URLs returned fetch cache misses through the browser tool during this pass, so route verification is not complete yet. Those routes still need status-code verification using a deploy-aware crawler.

### Repository files inspected

- `package.json`
- `.eleventy.js`
- `src/index.njk`
- `src/_data/site.json`
- `src/_includes/_head.njk`
- `src/_includes/_footer.njk`
- `src/_includes/_counter-band.njk`
- `src/assets/js/editorial.js`
- `src/assets/js/conversions.js`
- `src/assets/js/forms.js`
- `src/assets/js/donate.js`
- `src/donate.njk`
- `functions/api/create-payment-intent.js`
- `functions/api/contact.js`
- `src/privacy-policy.md`
- `src/terms-of-service.md`
- `src/contact.njk`
- `src/coalition/apply.njk`
- `src/sitemap.njk`
- `src/robots.njk`
- `_redirects`
- `staticwebapp.config.json`

## Immediate findings

### F-001 — P0/P1: Monthly donation path appears broken or unimplemented

`src/assets/js/donate.js` posts monthly subscription completion to `/api/confirm-subscription`, but no matching `functions/api/confirm-subscription.js`, `.ts`, or `index.js` file was found in the expected Cloudflare Pages Functions locations during this pass.

Impact: one-time giving may initialize through `functions/api/create-payment-intent.js`, but monthly giving can fail at the final subscription creation step. For a nonprofit donation site, this is a trust and revenue issue.

Recommendation: add and test the missing subscription endpoint, or disable monthly giving until implemented. Add an integration test that exercises both one-time and monthly flows.

### F-002 — P1: Founding date is inconsistent across structured data and visible copy

Public visible copy says founded `2 June 2024`. Structured data in `_head.njk` and `contact.njk` declares `foundingDate` as `2024-06-30`.

Impact: credibility defect, especially for a site that repeatedly claims radical transparency and institutional recordkeeping. It also corrupts machine-readable organization data.

Recommendation: choose the legal founding date and use it consistently in visible copy, site data, and JSON-LD.

### F-003 — P1: Contact phone is inconsistent

`src/_data/site.json` uses `(833) 241-7356`. `src/contact.njk` JSON-LD uses `+1-305-967-0200`. `src/donate.njk` presents `(305) 967-0200` in the donor trust sidebar, while live donate text also emphasizes email and EIN.

Impact: donor and partner trust problem. Conflicting phone numbers make the organization look improvised.

Recommendation: designate one public general phone, one press phone if needed, and one donor-support phone if truly separate. Otherwise collapse to one number across site data, schema, contact, donate, legal pages, and footer.

### F-004 — P1: Redirect management is split across Cloudflare and Azure-style config

The repo copies both `_redirects` and `staticwebapp.config.json`. Current `_redirects` only covers gospel rewrites, while `staticwebapp.config.json` contains many legacy redirects.

Impact: if production is Cloudflare Pages, the Azure Static Web Apps config will not enforce those legacy redirects. Legacy traffic may 404 or miss intended canonical routes.

Recommendation: confirm deployment platform. If Cloudflare Pages, move all production redirects to `_redirects` and remove or clearly label `staticwebapp.config.json` as obsolete.

### F-005 — P1: Analytics/ad tracking posture is heavier than the privacy copy suggests

The site data includes GA4, Google Ads, and two GTM-style IDs. `_head.njk` injects GA4, Google Ads, and two GTM scripts when configured. Privacy copy says the site uses minimal cookies and may use privacy-respecting analytics.

Impact: legal/privacy trust defect. Google Ads + GTM is not what most users understand as minimal, privacy-respecting analytics.

Recommendation: update privacy policy and consent posture to match actual tracking, or remove/disable tracking that is not essential.

### F-006 — P2: Homepage counters are server-rendered as zero

The counter component renders visible `0` values and relies on JavaScript to animate to data targets from site data.

Impact: crawlers, no-JS users, assistive technology snapshots, and render failures can see `0 supporters`, `0 member organizations`, and `0 pillars`, directly contradicting coalition credibility.

Recommendation: server-render the actual value as text and use JS only to animate from a display state, not to supply the factual number.

### F-007 — P2: Homepage language is strong but operationally opaque

The homepage is rhetorically powerful, but the first screen leans on terms like `lineage-led think tank`, `Coalition of the Willing`, and future dates before explaining the practical offer. The clearest plain-language public mission appears later.

Impact: sophisticated insiders may respond; first-time donors, press, grant reviewers, and partners may hesitate before they understand what E5 actually does.

Recommendation: keep the high style, but add a brutal plain-language sentence above the fold: what E5 does, for whom, where, and what action the visitor should take.

### F-008 — P2: Form handler logs personal data to Cloudflare Observability

`functions/api/contact.js` logs structured form submissions including email, name, subject, organization, track, pillar, role, source, and timestamp.

Impact: operationally convenient but privacy-sensitive. Logs can become a shadow contact database without retention, access, or deletion posture.

Recommendation: redact or hash email/name in logs, log only routing metadata, and document retention/access controls.

### F-009 — P2: CORS posture is inconsistent

`functions/api/contact.js` restricts CORS to `https://e5enclave.com`, while `functions/api/create-payment-intent.js` allows `*`.

Impact: not automatically exploitable because Stripe secret remains server-side, but it is looser than needed on a payment-adjacent endpoint and inconsistent with the contact function.

Recommendation: restrict payment endpoint CORS to canonical production origins and expected preview origins only.

### F-010 — P2: SearchAction points to `/blog/?q=` but search implementation is not established in this pass

Homepage structured data declares a WebSite SearchAction targeting `/blog/?q={search_term_string}`. No blog search implementation has been verified yet.

Impact: structured-data quality problem if the endpoint is not functional.

Recommendation: either implement search or remove SearchAction.

## Next forensic actions

1. Complete route inventory from Eleventy source and generated sitemap.
2. Verify all live status codes and redirects with an external crawler.
3. Inspect all remaining route source files and public assets.
4. Validate donation endpoints in a safe test mode or staging environment.
5. Check accessibility and keyboard behavior in an actual browser.
6. Review all claims against evidence: 501(c)(3), EIN, SAM, CAGE, member org count, supporters, programs, and public financials.
7. Replace this first-pass list with a severity-ranked final findings register.

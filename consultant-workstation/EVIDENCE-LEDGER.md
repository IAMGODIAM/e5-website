# Evidence Ledger

Use this ledger to record inspected sources before converting observations into findings.

| ID | Date | Source Type | URL / Repo Path / Command | What Was Inspected | Evidence Summary | Follow-up |
|---|---|---|---|---|---|---|
| E-000 | 2026-05-18 | Repo | `IAMGODIAM/e5-website` | Repository identity and recent commit activity | Repo identified as likely active E5 website repository. Workstation branch created from latest visible `main` commit `5e495e77c91e36c7d1b97ada7fb32aa9863bcc94`. | Continue full repo inventory. |
| E-001 | 2026-05-18 | Web | `https://e5enclave.com` | Live public target assumption | Live site target identified for crawl and public forensic review. | Crawl sitemap, routes, redirects, external links, forms, assets, headers. |
| E-002 | 2026-05-18 | Repo | `package.json`; `.eleventy.js` | Framework and build baseline | Site is an Eleventy project with `eleventy` build, `_site` output, static asset passthrough, Cloudflare-style `_redirects` passthrough, and Stripe dependency. | Confirm production deploy target and generated output. |
| E-003 | 2026-05-18 | Repo | `src/_data/site.json`; `src/index.njk`; `src/_includes/_counter-band.njk` | Homepage claims, site constants, counters | Site data includes founder/contact/EIN/counter values; homepage uses rhetoric-heavy mission copy and counter component renders `0` text with JS data targets. | Validate claims and server-render counter values. |
| E-004 | 2026-05-18 | Repo | `src/_includes/_head.njk`; `src/contact.njk` | Structured data and metadata | Homepage JSON-LD uses `foundingDate: 2024-06-30`; site data says founded `2 June 2024`; contact JSON-LD also declares `2024-06-30`. | Resolve founding date inconsistency. |
| E-005 | 2026-05-18 | Repo | `src/_data/site.json`; `src/contact.njk`; `src/donate.njk`; `src/privacy-policy.md`; `src/terms-of-service.md` | Public contact/legal identity | Multiple public phone numbers appear across site data, contact schema, donation page, and legal pages. | Normalize contact identity. |
| E-006 | 2026-05-18 | Repo | `src/donate.njk`; `src/assets/js/donate.js`; `functions/api/create-payment-intent.js` | Donation flow | One-time Stripe Payment Element path exists. Monthly path posts to `/api/confirm-subscription`; expected matching function not found in inspected paths. | Implement/test or disable monthly giving. |
| E-007 | 2026-05-18 | Repo | `functions/api/contact.js`; `src/assets/js/forms.js` | Form handling | Forms post to `/api/contact`. Backend sends via Microsoft Graph when configured and logs personal form data to Cloudflare logs. | Redact logs; review privacy/retention posture. |
| E-008 | 2026-05-18 | Repo | `_redirects`; `staticwebapp.config.json`; `.eleventy.js` | Redirect/deploy configuration | Repo has Cloudflare `_redirects` plus Azure Static Web Apps-style redirect config. `_redirects` currently covers gospel paths only; staticwebapp config carries many legacy redirects. | Confirm deploy platform; consolidate production redirects. |
| E-009 | 2026-05-18 | Repo | `src/privacy-policy.md`; `src/_includes/_head.njk`; `src/_data/site.json` | Privacy/tracking posture | Privacy copy says minimal/privacy-respecting analytics while head injects GA4, Google Ads, and two GTM scripts when configured. | Align privacy policy and consent posture with actual tracking. |

## Evidence conventions

- Use `E-###` IDs.
- Keep raw observations separate from conclusions.
- Link each material finding in `FINDINGS-REGISTER.md` back to one or more evidence IDs.
- For screenshots or exported crawl data, commit only safe public artifacts. Do not commit secrets, credentials, donor data, or private analytics exports.

# Findings Register

Severity scale:

- `P0` — legal, security, payment, donor trust, or reputational emergency
- `P1` — materially harms launch readiness, conversion, credibility, or accessibility
- `P2` — important quality, maintainability, SEO, performance, or consistency defect
- `P3` — polish, style, documentation, or low-risk cleanup

| ID | Severity | Status | Area | Finding | Evidence | Recommendation | Owner |
|---|---|---|---|---|---|---|---|
| F-001 | P0/P1 | Open | Donation / Stripe | Monthly donation path appears broken or unimplemented. Client posts to `/api/confirm-subscription`, but no matching Cloudflare Pages Function was found in expected repo paths during first pass. | E-006 | Add and test the subscription endpoint, or disable monthly giving until implemented. Add integration tests for one-time and monthly flows. | Engineering |
| F-002 | P1 | Open | Credibility / Schema | Founding date conflicts: site data says founded `2 June 2024`; JSON-LD in multiple templates says `2024-06-30`. | E-004 | Choose the legal founding date and use it everywhere: visible copy, `site.json`, JSON-LD, legal pages, and footer. | Content / Engineering |
| F-003 | P1 | Open | Contact / Trust | Public phone number conflicts across site data, contact schema, donation page, and legal pages. | E-005 | Designate one canonical public phone or clearly separate donor/press/general numbers; update all templates and legal docs. | Operations / Content |
| F-004 | P1 | Open | Redirects / Deploy | Redirect management is split between `_redirects` and `staticwebapp.config.json`; if production is Cloudflare Pages, legacy redirects in Azure-style config may not apply. | E-008 | Confirm deployment platform. Move all production redirects into the active platform config. Remove or label obsolete config. | Engineering |
| F-005 | P1 | Open | Privacy / Tracking | Privacy policy says minimal/privacy-respecting analytics while head configuration supports GA4, Google Ads, and two GTM scripts. | E-009 | Update privacy/consent language to match actual tracking, or remove nonessential trackers. | Legal / Engineering |
| F-006 | P2 | Open | Homepage / Accessibility / SEO | Homepage counters server-render as `0` and depend on JS animation to display factual values. | E-003 | Render actual values in HTML; use JS only for animation. | Engineering |
| F-007 | P2 | Open | Messaging / Conversion | Homepage language is strong but operationally opaque; above-fold copy does not plainly state what E5 does, for whom, where, and what the visitor should do next. | E-003 | Add a plain-language sentence above the fold while preserving brand voice. | Content / Strategy |
| F-008 | P2 | Open | Forms / Privacy | Contact function logs personal data, including email/name/organization/role/topic, to Cloudflare Observability. | E-007 | Redact or hash personal data in logs; define retention/access policy. | Engineering / Legal |
| F-009 | P2 | Open | Payment / Security | Payment-intent function allows `Access-Control-Allow-Origin: *`, while contact function restricts origin. | E-006 | Restrict CORS to canonical production and approved preview origins. | Engineering |
| F-010 | P2 | Open | Structured Data / SEO | WebSite SearchAction points to `/blog/?q=...`; search implementation has not been verified in this pass. | E-009 | Implement search or remove SearchAction from JSON-LD. | Engineering / SEO |

## Required finding anatomy

Each finding should answer:

1. What is wrong?
2. Where exactly is it?
3. What is the evidence?
4. Why does it matter to E5, donors, partners, or users?
5. What should be changed?
6. What is the priority and sequencing?

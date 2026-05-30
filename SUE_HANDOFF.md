# E5 WEBSITE v2.0 — SUE HANDOFF

## What's Done

The E5 Enclave website has been built as a 15-page Astro static site.

**Repo:** `github.com/IAMGODIAM/e5-website`
**Branch:** `main`
**Local path:** `/home/user/e5-website`
**Live preview:** `http://localhost:8080`

## To Run Locally

```bash
cd /home/user/e5-website
npm install
npx astro build        # Compiles to dist/
cd dist && python3 -m http.server 8080   # Serves at localhost:8080
```

## Pages Completed (15)

| Page | Route | Status |
|---|---|---|
| Homepage | `/index.astro` | Kinetic type, trust bar, covenant, pillars, research framework, founder letter, newsletter |
| Mission | `/mission.astro` | Two missions, method, five Doctrine tenets |
| Donate | `/donate.astro` | 4 tiers w/ impact equivalents, $25 default, recurring toggle, trust rail |
| Record | `/record.astro` | 3 founding documents (framed as research, NOT campaign) |
| Programs | `/programs.astro` | 3 flagship + 4 other programs |
| Pillars | `/pillars.astro` | All 5 pillars overview |
| Governance | `/governance.astro` | SAM.gov, IRS, Form 990 links |
| Coalition Apply | `/coalition/apply.astro` | 4-step wizard w/ covenant pledges |
| FAQ | `/faq.astro` | 10 questions, accordion UI, JSON-LD |
| Contact | `/contact.astro` | 3 CTAs + org details |
| Privacy Policy | `/privacy-policy.astro` | USA-focused, donor privacy, PostHog |
| Terms of Service | `/terms-of-service.astro` | IP, disclaimers, Florida law |
| Accessibility | `/accessibility.astro` | WCAG 2.2 AA statement |
| Disclosures | `/disclosures.astro` | 501(c)(3) public documents hub |
| Donor Privacy | `/donor-privacy.astro` | Donor rights, Stripe PCI-DSS |

## Design System

- **Tokens:** `src/styles/global.css` — 3-layer architecture (primitive → semantic → component)
- **Components:** `src/styles/components.css` — buttons, cards, bento grid, forms
- **Fonts:** Cormorant Garamond (display) + Inter (body) via Google Fonts
- **Colors:** Dark base (#111118) + Gold accent (#c9a84c)
- **Grid:** 4px spacing grid throughout

## Critical Constraints (DO NOT CHANGE)

1. **No "campaign" language** — All references to Restitution 246 use "research framework" or "research initiative" ONLY
2. **No "0" counters** — Display "Founding Cohort · Phase I · By Invitation" never zero counts
3. **No WebGL on mobile** — Variants are separate; mobile is static CSS only
4. **501(c)(3) compliance** — All 6 legal pages must remain accessible and accurate
5. **Mobile-first** — Every page must work on 320px width

## What Needs Sue

1. **Connect PostHog analytics** — Add `data-agent-*` attributes to CTAs for AI agent consumption
2. **Set up VWO A/B testing** — Configure variants per the PRD test matrix
3. **Deploy to Cloudflare Pages** — The existing project `e5sovereign` should deploy from this repo
4. **Connect e5enclave.com domain** — DNS should point to the Cloudflare Pages deployment
5. **Obtain Cloudflare API token** — For automated deployments. Current token is in `~/.secrets/cloudflare_b64`
6. **Legal page review** — Board counsel should review all 6 legal pages before production
7. **Form processing** — Newsletter signup and Coalition application need backend (Formspree/Basin)
8. **Donation processing** — Stripe integration for the donation page

## Files for Reference

- **PRD:** `docs/e5-website-overhaul-prd.md` (in hermes-workspace)
- **Board Report:** `docs/e5-board-report-2026-0530.md` (in hermes-workspace)
- **QA Report:** `docs/e5-website-overhaul-qa-report.md` (in hermes-workspace)
- **Design Bible:** `governance/wyrmcore-design-intelligence-brief.md` (in hermes-workspace)

## Verification Checklist

Before going live:
- [ ] All 15 pages render without errors
- [ ] Mobile responsive (test on 320px, 768px, 1200px)
- [ ] All external links work (SAM.gov, IRS, Stripe)
- [ ] No "campaign" text anywhere (grep for "campaign")
- [ ] No "0" member counters (grep for "Supporters of record: 0")
- [ ] Color contrast WCAG AA (run Lighthouse)
- [ ] Form submissions process correctly
- [ ] Analytics events firing (PostHog)
- [ ] Legal pages reviewed by counsel
- [ ] Performance budget met (LCP < 1.5s)

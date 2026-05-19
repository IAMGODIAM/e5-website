# E5 Enclave — Official Website

**Live site:** https://e5enclave.com  
**Organization:** E5 Enclave Incorporated · 501(c)(3) · EIN 99-3822441  
**Location:** Liberty City · Miami, Florida  
**Mission:** Lineage-led think tank building Black economic sovereignty, food justice, education, and community power.

---

## Tech Stack

- **Static Site Generator:** [Eleventy](https://www.11ty.dev/) v3.0
- **Hosting:** Cloudflare Pages
- **DNS:** Cloudflare
- **Payments:** Stripe
- **Analytics:** Google Analytics 4 (via GTM)
- **Fonts:** Cormorant Garamond, Inter (SIL Open Font License)

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:8080)
npm run dev

# Production build → _site/
npm run build
```

---

## Deployment

Production deploys via **Cloudflare Pages** using direct upload:

```bash
npm run build
wrangler pages deploy _site --project-name=e5-website --branch=main
```

Push to `main` also triggers auto-deploy via the Cloudflare Pages GitHub integration.

**Do not deploy to Netlify or Azure.** Those configs (`netlify.toml`, `staticwebapp.config.json`) are retained for reference only. Cloudflare Pages is the sole production platform.

---

## Environment Variables

Configure in Cloudflare Pages dashboard → Settings → Environment Variables:

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_MONTHLY` | Monthly giving price ID |

---

## Directory Structure

```
src/               Eleventy source files (Markdown, Nunjucks)
_site/             Built output (auto-generated, git-ignored)
functions/         Cloudflare Pages Functions (API handlers)
api/               Azure SWA API handlers (dormant)
netlify/functions/ Netlify Functions (dormant)
m/                 Membership portal pages (Coalition apply/login)
assets/            CSS, JS, images
```

---

## Security

Security headers are configured in `_headers` (Cloudflare Pages).  
CSP, HSTS, X-Frame-Options, Permissions-Policy all active in production.

Report security issues to israel@e5enclave.com.

---

*© 2026 E5 Enclave Incorporated · All Rights Reserved*

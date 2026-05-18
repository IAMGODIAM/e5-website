# E5 ENCLAVE x BLACK DRAGON — MERCH STORE MASTER PLAN
## Prepared by Hermie | April 2, 2026

---

## I. EXECUTIVE SUMMARY

E5 Enclave Incorporated will launch a premium merchandise line under the **Black Dragon** brand, powered by **Printful** (print-on-demand) and integrated into **e5enclave.com** via a custom storefront. The store serves dual purposes: **revenue generation** for the 501(c)(3) and **identity infrastructure** for the Black Dragons Initiative movement.

**Key Numbers:**
- 252 design assets cataloged (832 MB total)
- 10 Black Dragon merch designs (print-ready)
- 6 Midjourney photorealistic dragon renders (high-res)
- 49 upscaled 4x versions (production-quality)
- 184 additional design assets (IMG series)
- 1 BDI eBook (digital product ready)

---

## II. VEHICLE STRUCTURE

**Current Structure:** All merch runs under E5 Enclave Inc (501(c)(3))

**Rationale:**
- Merch that advances E5's educational/community mission = substantially related revenue (exempt from UBIT)
- Black Dragon brand identity supports mission awareness
- If merch revenue grows significantly or political merchandising becomes primary, a separate for-profit entity or LLC may be needed later
- For now, this is the umbrella — clean and simple

**Future Trigger for Separation:**
- If merch revenue exceeds $50K/year AND is not substantially related to exempt purpose
- If Black Dragons PAC requires separate political merchandising
- If the brand warrants standalone commercial licensing

---

## III. TECHNOLOGY ARCHITECTURE

### Recommended Stack: Snipcart + Printful API + Azure Functions

```
e5enclave.com/store (Azure Static Web Apps)
    │
    ├── Custom HTML/CSS product pages (full brand control)
    ├── Snipcart (cart + checkout overlay — stays on-site)
    │       └── Stripe payment processing (apply nonprofit rate: 2.2% + $0.30)
    │
    └── Azure Functions (middleware)
            ├── /api/snipcart-webhook → Creates Printful order on purchase
            ├── /api/shipping-rates → Proxies Printful shipping API to Snipcart
            └── /api/printful-webhook → Receives tracking/fulfillment updates
                    │
                    └── Printful (prints, packs, ships)
```

### Why This Over Alternatives:
| Criteria | Snipcart+Printful | Ecwid | Shopify Starter |
|----------|-------------------|-------|-----------------|
| Brand Control | 10/10 | 6/10 | 5/10 |
| Stays On-Site | Yes | Yes (widget) | No (redirects) |
| SEO | Excellent | Poor | Poor |
| Monthly Cost | $16 min | $0-39 | $5 |
| Transaction Fee | ~5% total | ~3.2% | ~3.2% |
| Premium Feel | High | Medium | Low |

### Quick-Launch Fallback:
If dev resources are tight, start with Shopify Starter ($5/mo) + Printful native integration. Accept the checkout redirect. Migrate to Snipcart once the store proves revenue.

---

## IV. COST PROJECTIONS

### Fixed Monthly:
- Snipcart: $16/month (or 2% of sales, whichever greater)
- Azure SWA: $0 (free tier)
- Printful: $0 (pay per order)
- Stripe: $0 (pay per transaction)
- **Total: $16/month**

### Per-Transaction Example ($35 T-shirt):
| Line Item | Amount |
|-----------|--------|
| Customer pays | $35.00 |
| Snipcart fee (2%) | -$0.70 |
| Stripe nonprofit (2.2% + $0.30) | -$1.07 |
| Printful production | -$12.95 |
| Printful shipping (charged to E5) | -$4.49 |
| **Net revenue** | **$15.79 (45%)** |

### Revenue Scenarios (Monthly):
| Volume | Revenue | Fees | Printful Costs | Net Profit |
|--------|---------|------|----------------|------------|
| 20 shirts | $700 | $53 | $349 | $298 |
| 50 shirts | $1,750 | $132 | $873 | $745 |
| 100 mixed items | $3,500 | $264 | $1,500 | $1,736 |

---

## V. PRODUCT LINEUP — LAUNCH COLLECTION

### Tier 1: Core Black Dragon Line (Launch Day)

| Product | Blank | Technique | Retail | Cost | Margin |
|---------|-------|-----------|--------|------|--------|
| Black Dragon Tee | Bella+Canvas 3001 (Black) | DTG | $35.00 | $12.95 | 63% |
| Black Dragon Premium Hoodie | Bella+Canvas 3719 (Black) | DTG | $65.00 | $29.50 | 55% |
| Black Dragon Dad Hat | Yupoong 6245CM (Black) | Embroidered gold | $32.00 | $17.50 | 45% |
| Black Dragon Poster 18x24 | Matte finish | Giclée print | $25.00 | $8.50 | 66% |
| Black Dragon Ceramic Mug 11oz | White ceramic | Full wrap | $18.00 | $7.00 | 61% |
| Black Dragon Phone Case | iPhone/Samsung tough | Full print | $25.00 | $13.00 | 48% |
| Black Dragon Sticker Pack | Kiss-cut 3x3 | Full color | $5.00 | $2.00 | 60% |
| Black Dragon Tote Bag | Canvas | DTG | $25.00 | $12.00 | 52% |

### Tier 2: Premium/Collector Line (Month 2-3)
| Product | Retail | Notes |
|---------|--------|-------|
| All-Over Print Dragon Tee | $45.00 | Full sublimation wrap-around dragon |
| Dragon Canvas Print 16x20 | $55.00 | Gallery-quality stretched canvas |
| Limited Dragon Crewneck | $55.00 | Heavyweight, embroidered detail |
| Dragon Joggers | $55.00 | All-over print |

### Tier 3: Digital Products (Launch Day)
| Product | Retail | Format |
|---------|--------|--------|
| BDI eBook (Manifesto) | $12.99 | PDF download |
| Dragon Art Print Pack (Digital) | $9.99 | 5 high-res PNGs |
| Black Dragon Wallpaper Pack | $4.99 | Phone + desktop |

### Tier 4: Non-Printful Items (Month 3-4, separate vendor)
| Product | Retail | Vendor |
|---------|--------|--------|
| Enamel Dragon Pin | $15.00 | PinSource/GS-JJ |
| Embroidered Dragon Patch | $12.00 | StadriEmblems |
| Black Dragon Flag 3x5 | $35.00 | FlagSource |

---

## VI. PRICING STRATEGY

### Competitive Position: PREMIUM
Based on market research across 12+ comparable brands:

| Market Range | Our Position | Rationale |
|--------------|-------------|-----------|
| T-shirts: $22-55 | $35 (mid-premium) | Premium blank, quality print, mission alignment |
| Hoodies: $38-120 | $65 (mid-premium) | Competitive with BLM ($55-65), below Marathon ($85-110) |
| Hats: $20-48 | $32 (mid-range) | Embroidered quality, accessible entry |

### Key Differentiators Justifying Premium:
1. Photorealistic dragon aesthetic is UNIQUE in this space (no one else has it)
2. Leviathan/mythological framing is sophisticated
3. PAC structure gives political legitimacy
4. Premium blanks (Bella+Canvas, not Gildan)
5. "Invest in the movement" framing

### Market Gaps We Exploit:
- No major competitor doing "premium mythological/symbolic" Black empowerment merch
- Subscription merch is underutilized in this space
- Digital product bundles are rare
- The intersection of political PAC + premium lifestyle brand is unoccupied

---

## VII. ASSET CATALOG

### Production-Ready Assets:
- **10 Black Dragon Merch Designs** (500x500 PNG — need upscaling for print)
- **49 Upscaled 4x Versions** (print-ready JPEG, 520 MB total)
- **6 Midjourney Photorealistic Dragon Renders** (high-res PNG, 35.7 MB)
  - "black dragon with gold accents wrapped" (4 variants)
  - "black dragon with gold accents set against" (2 variants)

### Design Library:
- **54 images** (Nov 2023 WEBP series — potential additional designs)
- **130 images** (Mar 2025 PNG/JPG series — additional product imagery)
- **1 BDI eBook** (PDF, 484 KB — digital product ready)

### Asset Preparation Needed:
1. Select top 5-8 designs from the 10 Black Dragon Merch files for launch
2. Create simplified dragon emblem for embroidery (hats, polos)
3. Create gold-on-black logo variant for subtle/premium items
4. Prepare print files at 300 DPI, sRGB, PNG with transparency
5. Generate Printful mockups using their mockup API

---

## VIII. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1)
- [ ] Create Printful account (free)
- [ ] Upload top designs, configure products
- [ ] Order sample products (20% off) to verify print quality
- [ ] Apply for Stripe nonprofit rate
- [ ] Create Snipcart account

### Phase 2: Store Build (Week 2-3)
- [ ] Design /store page layout (product grid)
- [ ] Build individual product page templates
- [ ] Integrate Snipcart (cart + checkout)
- [ ] Write Azure Functions (webhook middleware)
- [ ] Configure Snipcart → Printful API pipeline

### Phase 3: Content & SEO (Week 3)
- [ ] Write product descriptions (mission-aligned copy)
- [ ] Add JSON-LD Product schema markup
- [ ] Optimize product images (WebP, lazy loading)
- [ ] Add /store to sitemap
- [ ] Set up digital product delivery (BDI eBook, art packs)

### Phase 4: Test & Launch (Week 4)
- [ ] End-to-end order testing (Snipcart test mode)
- [ ] Verify tax calculation
- [ ] Verify shipping rates
- [ ] Verify Printful order creation
- [ ] Soft launch — announce to inner circle
- [ ] Monitor first 10 real orders closely

### Phase 5: Scale (Month 2-3)
- [ ] Launch Tier 2 products (AOP, canvas, premium items)
- [ ] Source non-Printful items (pins, patches, flags)
- [ ] Launch Dragon Circle membership program (monthly merch drops)
- [ ] Email marketing campaign via HubSpot
- [ ] Social media launch campaign
- [ ] Google Ads (existing $10K/mo grant)

---

## IX. DONATIONS vs. MERCH (COMPLIANCE)

**Keep separate flows:**
- `/store` — Merch purchases (regular ecommerce, NOT tax-deductible)
- `/donate` — Donations (tax-deductible, separate Stripe form)

**Cross-link them:** "Love what we stand for? Support the mission directly." on /store → /donate

**Why separate:**
- Combining creates IRS "quid pro quo" complications
- Clean accounting for 501(c)(3) compliance
- Easier auditing
- Proper receipting without confusion

---

## X. FUTURE PLAYS

1. **Dragon Circle Membership** ($25-50/month): Quarterly exclusive merch drops + digital content. Major market gap — no one in this space is doing it well.

2. **Event Bulk Merch**: Use local screen printer for 100+ unit orders (rallies, conferences). $5-8/shirt vs $12.95 on Printful.

3. **Brand Licensing**: If Black Dragon brand gains traction, license the imagery to aligned partners.

4. **Limited Edition Drops**: Scarcity-based releases (numbered, seasonal) at premium pricing ($48-55 tees, $85-110 hoodies).

5. **Digital Product Expansion**: Online courses, workshop content, leadership training materials.

6. **For-Profit Entity**: When revenue justifies it, spin merch into a commercial LLC that licenses back to E5 for mission funding.

---

*Document Version: 1.0*
*Next Review: After sample orders received*
*Owner: Israel Lee / Hermie (Visionary Layer)*

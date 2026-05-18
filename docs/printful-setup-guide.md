# Printful Setup Guide for E5 Enclave Inc — Black Dragon Merch Store

**Organization:** E5 Enclave Inc (501c3 Nonprofit)
**Brand:** Black Dragon
**Design Theme:** Photorealistic black dragons with gold accents
**Last Updated:** April 2, 2026

---

## Table of Contents

1. [Account Creation & Business Setup](#1-account-creation--business-setup)
2. [Connecting the Printful API](#2-connecting-the-printful-api)
3. [Uploading Designs](#3-uploading-designs)
4. [Configuring Products](#4-configuring-products)
5. [Ordering Samples](#5-ordering-samples)
6. [Going Live](#6-going-live)

---

## 1. Account Creation & Business Setup

### 1.1 Create Your Printful Account

1. Go to [printful.com](https://www.printful.com) and click **Sign Up**
2. Register using the E5 Enclave Inc organizational email
3. Select **Business account** during registration
4. Complete email verification

### 1.2 Configure Business Profile

1. Navigate to **Settings → Business Info**
2. Enter the following:
   - **Business Name:** E5 Enclave Inc
   - **Business Type:** Nonprofit Organization (501c3)
   - **EIN:** [Enter your EIN]
   - **Address:** [Enter registered business address]
3. Upload your 501c3 determination letter (may qualify for tax exemptions on supplies)

### 1.3 Set Up Billing

1. Go to **Settings → Billing**
2. Add a payment method (credit card or PayPal)
3. Printful charges per order when fulfilled — no monthly fees
4. Enable **Printful Wallet** and pre-load $50-100 for faster order processing
5. Set up auto-refill at $25 threshold to avoid fulfillment delays

### 1.4 Configure Return Address

1. Go to **Settings → Return Address**
2. Set the return address to E5 Enclave Inc's physical address
3. This appears on shipping labels for any customer returns

---

## 2. Connecting the Printful API

### 2.1 Generate API Key

1. Go to **Settings → API** in your Printful dashboard
2. Click **Enable API Access**
3. Click **Create New Token** and name it `bdi-store-production`
4. Copy the API key immediately — it won't be shown again
5. Store the key securely in your environment variables:

```
PRINTFUL_API_KEY=your_api_key_here
```

### 2.2 Webhook Configuration

1. In **Settings → API → Webhooks**, configure these webhook endpoints:

| Event | URL |
|-------|-----|
| `package_shipped` | `https://yourdomain.com/api/webhooks/printful/shipped` |
| `package_returned` | `https://yourdomain.com/api/webhooks/printful/returned` |
| `order_failed` | `https://yourdomain.com/api/webhooks/printful/failed` |
| `order_canceled` | `https://yourdomain.com/api/webhooks/printful/canceled` |
| `product_synced` | `https://yourdomain.com/api/webhooks/printful/synced` |

2. Set a **Webhook Secret** for signature verification
3. Store in environment:

```
PRINTFUL_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2.3 Test API Connection

Run this test call to verify your connection:

```bash
curl -X GET "https://api.printful.com/store" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Expected response: JSON with your store information and status 200.

### 2.4 Snipcart ↔ Printful Integration

Since Snipcart doesn't have a native Printful plugin, you'll use a custom webhook handler:

1. Set up a serverless function (Cloudflare Worker, Netlify Function, or Vercel Function)
2. Listen for Snipcart `order.completed` webhook events
3. Parse the order items, matching `snipcart_id` to `printful_sync_variant_id` from your product catalog
4. Submit the order to Printful via their API `POST /orders` endpoint
5. Store the Printful order ID in your database for tracking

---

## 3. Uploading Designs

### 3.1 Design File Requirements

| Product | File Format | Min Resolution | Dimensions | Color Profile |
|---------|-------------|---------------|------------|---------------|
| Tee (Bella+Canvas 3001) | PNG (transparent bg) | 300 DPI | 4500 x 5400 px | sRGB |
| Hoodie (Bella+Canvas 3719) | PNG (transparent bg) | 300 DPI | 4500 x 5400 px | sRGB |
| Dad Hat (Yupoong 6245CM) | PNG (transparent bg) | 300 DPI | Embroidery: DST/PES format | sRGB |
| Poster 18x24 | PNG or PDF | 300 DPI | 5400 x 7200 px | sRGB |
| Mug 11oz | PNG (transparent bg) | 300 DPI | 4500 x 1890 px (wraparound) | sRGB |
| Phone Case | PNG (transparent bg) | 300 DPI | Per device template | sRGB |
| Sticker | PNG (transparent bg) | 300 DPI | 1800 x 1800 px (min) | sRGB |
| Tote Bag | PNG (transparent bg) | 300 DPI | 4500 x 4800 px | sRGB |

### 3.2 Design Naming Convention

Use this naming pattern for all design files:

```
bdi-{product}-{design-name}-{version}.{ext}
```

Examples:
- `bdi-tee-black-dragon-gold-v1.png`
- `bdi-hoodie-black-dragon-gold-v1.png`
- `bdi-hat-dragon-emblem-v1.dst`
- `bdi-mug-wraparound-dragon-v1.png`

### 3.3 Upload to Printful File Library

1. Go to **File Library** in your Printful dashboard
2. Click **Upload Files**
3. Upload all design files organized by product type
4. Wait for processing — Printful will verify resolution and dimensions
5. Create folders for each product category: `apparel/`, `accessories/`, `art-prints/`

### 3.4 Key Design Notes for Black Dragon Theme

- **Gold accents:** Ensure metallic gold renders well in CMYK print — use hex #D4AF37 or #FFD700 for gold
- **Black on black:** For black tees/hoodies, add a subtle outline or gradient so the dragon is visible against the dark fabric
- **Embroidery (hat):** Simplify the dragon design for embroidery — max 12 colors, clean lines, no photo-realism in embroidered version
- **Test dark backgrounds:** Preview all designs on dark mockup backgrounds before uploading

---

## 4. Configuring Products

### 4.1 Product Setup Workflow

For each physical product, follow this sequence:

#### Step 1: Create Product in Printful

1. Go to **Product Templates** → **Add Product**
2. Select the blank (e.g., Bella+Canvas 3001 for tees)
3. Upload/select your design from File Library
4. Position the design using Printful's mockup editor

#### Step 2: Configure Variants

For each product, set up the correct variants:

| Product | Variants |
|---------|----------|
| Black Dragon Tee | Black: S, M, L, XL, 2XL |
| Premium Hoodie | Black: S, M, L, XL, 2XL |
| Dad Hat | Black: One Size |
| Poster 18x24 | 18"x24" |
| Ceramic Mug 11oz | 11oz |
| Phone Case | iPhone 15, iPhone 16, Samsung S24 |
| Sticker Pack | Standard |
| Tote Bag | Standard |

#### Step 3: Set Retail Pricing

Apply these retail prices in Printful (must match Snipcart prices):

| Product | Retail Price | Printful Cost | Profit Before Fees |
|---------|-------------|---------------|-------------------|
| Black Dragon Tee | $35.00 | $12.95 | $22.05 |
| Premium Hoodie | $65.00 | $29.50 | $35.50 |
| Dad Hat | $32.00 | $17.50 | $14.50 |
| Poster 18x24 | $25.00 | $8.50 | $16.50 |
| Ceramic Mug 11oz | $18.00 | $7.00 | $11.00 |
| Phone Case | $25.00 | $13.00 | $12.00 |
| Sticker Pack | $5.00 | $2.00 | $3.00 |
| Tote Bag | $25.00 | $12.00 | $13.00 |

#### Step 4: Generate Mockups

1. Use Printful's built-in mockup generator for each product
2. Download mockups in WebP format for web performance
3. Save to your project's `/assets/images/products/` directory
4. Generate lifestyle mockups where available (flat lay, on-model, in-context)

#### Step 5: Record Sync Variant IDs

After creating each product in Printful:

1. Note the **Sync Product ID** and **Sync Variant IDs** from the API or dashboard
2. Update `product-catalog.json` — replace all `PRINTFUL_SYNC_ID_XXX` and `PRINTFUL_VARIANT_XXX` placeholders with actual IDs
3. These IDs are critical for the Snipcart → Printful order automation

### 4.2 Shipping Configuration

1. Go to **Settings → Shipping**
2. Printful calculates shipping automatically based on:
   - Product weight and dimensions
   - Customer shipping address
   - Shipping method selected
3. Configure Snipcart to fetch live shipping rates from Printful API at checkout
4. Recommended: Offer free shipping on orders over $75 as a promotional incentive

### 4.3 Branding & Packaging

1. Go to **Settings → Branding**
2. Upload custom packing slip design with:
   - E5 Enclave Inc logo
   - Black Dragon brand mark
   - "Thank you for supporting our mission" message
   - 501c3 nonprofit disclosure
3. Consider custom pack-ins (business cards, stickers) — available at additional cost

---

## 5. Ordering Samples

### 5.1 Why Order Samples

- Verify print quality, especially gold accent reproduction
- Check color accuracy on dark garments (black-on-black visibility)
- Confirm sizing and fit for apparel items
- Create content for product photography and social media
- Identify any quality issues before customers receive products

### 5.2 Sample Discount

- Printful offers **20% off + free shipping** on sample orders (up to 3 samples per product)
- Access via **Orders → New Order → Mark as Sample**

### 5.3 Recommended Sample Order (Phase 1)

Order these samples first (highest-margin and hero products):

| Priority | Product | Variant | Est. Sample Cost |
|----------|---------|---------|-----------------|
| 1 | Black Dragon Tee | Black, L | ~$10.36 |
| 2 | Premium Hoodie | Black, L | ~$23.60 |
| 3 | Dad Hat | Black, OS | ~$14.00 |
| 4 | Poster 18x24 | 18x24 | ~$6.80 |
| 5 | Ceramic Mug 11oz | 11oz | ~$5.60 |

**Estimated Phase 1 sample cost: ~$60.36** (with 20% discount, before free shipping)

### 5.4 Sample Evaluation Checklist

For each sample received, evaluate:

- [ ] Print quality — sharp lines, no bleeding
- [ ] Color accuracy — gold accents match design intent
- [ ] Material quality — fabric weight, softness, construction
- [ ] Print placement — centered, correct position
- [ ] Sizing accuracy — matches size chart expectations
- [ ] Packaging — arrives undamaged, professional presentation
- [ ] Wash test (apparel) — wash 3x, check for fading/cracking
- [ ] Photography — shoot product photos under consistent lighting

### 5.5 Sample Order (Phase 2)

After Phase 1 approval, order remaining products:

| Product | Variant | Est. Sample Cost |
|---------|---------|-----------------|
| Phone Case | iPhone 15 | ~$10.40 |
| Sticker Pack | Standard | ~$1.60 |
| Tote Bag | Standard | ~$9.60 |

**Estimated Phase 2 sample cost: ~$21.60**

---

## 6. Going Live

### 6.1 Pre-Launch Checklist

#### Product Configuration
- [ ] All Printful Sync Variant IDs recorded in `product-catalog.json`
- [ ] All retail prices match between Snipcart and Printful
- [ ] Product mockup images uploaded to website
- [ ] Product descriptions written and reviewed
- [ ] SEO metadata populated for all products

#### Technical Integration
- [ ] Snipcart → Printful webhook handler deployed and tested
- [ ] Test order placed through full pipeline (Snipcart → webhook → Printful)
- [ ] Shipping rate calculation working at checkout
- [ ] Order confirmation emails configured
- [ ] Tracking number forwarding working (Printful → customer)
- [ ] Webhook signature verification enabled for security

#### Digital Products
- [ ] eBook PDF uploaded to secure delivery endpoint
- [ ] Art Print Pack ZIP uploaded to secure delivery endpoint
- [ ] Download links expire after 72 hours / 3 downloads
- [ ] Snipcart digital product delivery configured

#### Financial
- [ ] Stripe account verified and connected to Snipcart
- [ ] Nonprofit rate (2.2% + $0.30) confirmed with Stripe
- [ ] Tax collection configured (if applicable by state)
- [ ] Printful Wallet pre-loaded with $100+
- [ ] Accounting system ready to track revenue/COGS

### 6.2 Soft Launch Strategy

1. **Week 1 — Friends & Family:**
   - Share store link with board members, volunteers, and close supporters
   - Monitor first 10-20 orders for any issues
   - Gather feedback on ordering experience

2. **Week 2 — Community Launch:**
   - Announce on social media, newsletter, and website
   - Consider a launch promotion (10% off first order with code `DRAGONLAUNCH`)
   - Set up Snipcart discount code: `DRAGONLAUNCH` = 10% off, limit 100 uses

3. **Week 3+ — Full Marketing:**
   - Run targeted social media campaigns
   - Feature products in email newsletter
   - Create bundle deals (Tee + Hat combo, etc.)

### 6.3 Ongoing Operations

#### Order Monitoring
- Check Printful dashboard daily for order status
- Monitor webhook logs for failed order submissions
- Respond to customer shipping inquiries within 24 hours

#### Inventory Management
- Printful is print-on-demand — no inventory to manage
- Monitor Printful for blank availability issues
- Have backup blank options identified (in case Bella+Canvas stock issues)

#### Financial Tracking
- Monthly: Reconcile Printful costs with Stripe revenue
- Track per-product performance (revenue, units sold, margin)
- Quarterly: Review pricing strategy based on actual data

#### Product Expansion
- Gather customer feedback on desired new products
- Test new designs as limited editions
- Consider seasonal/holiday-themed dragon designs
- Evaluate adding more color options based on demand

---

## Appendix A: API Endpoints Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| List products | GET | `/store/products` |
| Get product | GET | `/store/products/{id}` |
| Create order | POST | `/orders` |
| Get order | GET | `/orders/{id}` |
| Cancel order | DELETE | `/orders/{id}` |
| Estimate costs | POST | `/orders/estimate-costs` |
| Shipping rates | POST | `/shipping/rates` |
| Get countries | GET | `/countries` |
| Mockup generation | POST | `/mockup-generator/create-task/{id}` |

## Appendix B: Support Contacts

- **Printful Support:** support@printful.com | Live chat on dashboard
- **Snipcart Support:** support@snipcart.com
- **Stripe Support:** support.stripe.com (use nonprofit portal)

---

*This guide is maintained by the E5 Enclave Inc development team. Update all placeholder IDs after initial Printful product sync.*

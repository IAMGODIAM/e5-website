# Forensic Checklist

## 1. Discovery and crawl

- [ ] Resolve canonical domain and alternate hostnames.
- [ ] Capture homepage HTML, metadata, headers, redirects, and status codes.
- [ ] Parse all internal links.
- [ ] Check sitemap.xml, robots.txt, humans.txt, manifest, RSS/feed, and security.txt.
- [ ] Enumerate public routes from repo source.
- [ ] Compare live routes with repo routes.
- [ ] Log all 3xx, 4xx, 5xx, mixed-content, and blocked resources.

## 2. Content and credibility

- [ ] Validate every major claim.
- [ ] Identify placeholder stats, vague proof, unsubstantiated superlatives, and missing dates.
- [ ] Check executive/team/board references for consistency.
- [ ] Check partner, coalition, sponsor, and donor language for clarity and legal sensitivity.
- [ ] Check whether the site explains what E5 does in plain language within five seconds.
- [ ] Flag jargon that hides the actual offer or mission.

## 3. Donation, payment, and trust

- [ ] Inspect donation pages and scripts.
- [ ] Confirm payment provider messaging is clear.
- [ ] Check nonprofit status, tax receipt expectations, EIN presentation, refund language, and designation handling.
- [ ] Review privacy, terms, donor data handling, and analytics consent posture.
- [ ] Verify no secrets or keys are exposed client-side beyond publishable keys.

## 4. Accessibility

- [ ] Keyboard navigation.
- [ ] Focus states.
- [ ] Heading hierarchy.
- [ ] Alt text.
- [ ] Color contrast.
- [ ] Form labels and error states.
- [ ] Reduced motion and animation behavior.
- [ ] Landmark structure.

## 5. SEO and social metadata

- [ ] Unique titles and descriptions.
- [ ] Canonical tags.
- [ ] Open Graph and Twitter cards.
- [ ] Structured data where appropriate.
- [ ] Sitemap accuracy.
- [ ] Robots directives.
- [ ] Internal linking and orphan routes.

## 6. Technical implementation

- [ ] Framework and build tooling.
- [ ] Dependency hygiene and lockfiles.
- [ ] CI/deploy configuration.
- [ ] Redirect rules.
- [ ] Asset size and compression.
- [ ] JavaScript errors.
- [ ] Dead code and duplicate content.
- [ ] Environment variable handling.

## 7. Security and privacy

- [ ] Security headers.
- [ ] CSP posture.
- [ ] Referrer policy.
- [ ] Permissions policy.
- [ ] Form/action endpoints.
- [ ] Third-party scripts.
- [ ] Exposed tokens, keys, secrets, test endpoints, and internal comments.
- [ ] Public repo leakage risk.

## 8. Remediation plan

- [ ] Sort findings by P0/P1/P2/P3.
- [ ] Separate same-day fixes from structural fixes.
- [ ] Identify dependencies and owner lanes.
- [ ] Recommend release sequence.

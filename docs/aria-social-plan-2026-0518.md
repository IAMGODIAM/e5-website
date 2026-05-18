# ARIA Social Pipeline Activation Plan
## TikTok @e5blackdragons + Twitter @wearegodweare
## DAG: aria-social-activation-2026-0518

---

## PLATFORM POSTURE

### TikTok @e5blackdragons
**Format:** 45–90 second vertical video
**Schedule:** Tuesday + Thursday + Saturday · 7 PM ET
**Hook rule:** First 1.5 seconds must answer "why should I watch this"
**Content types:**
1. Data drops (BDI stats — visual, direct, no filler)
2. Doctrine clips (Enclave Economy concepts — explained in 60 seconds)
3. Program stories (Lineage Farms, McCartney Academy, Coalition)
4. Response content (reply to viral moments about Black economic power)

### Twitter @wearegodweare
**Format:** 5-8 tweet threads + single-tweet data drops
**Schedule:** Monday + Wednesday + Friday · 9 AM ET
**Voice:** Du Bois standard — empirical, direct, sovereign. No apologizing for the numbers.
**Content types:**
1. Thread: expand each blog post into 6-tweet thread
2. Data drop: single stat + context + one CTA
3. Ceremony: quote RT every NFT mint and major board milestone
4. Response: engage with Black economic power discourse

---

## WEEK 1 CONTENT CALENDAR (ARIA to execute)

### Monday (Twitter)
**Thread: "What is an Enclave Economy?"**
Tweet 1: The racial wealth gap is $240,000. Most solutions try to close it through income. That's wrong. It's an asset gap. Thread on what an enclave economy is and why it matters. 🧵
Tweet 2: An enclave economy keeps dollars circulating inside the community. Every dollar at a locally owned business recirculates 2-3x before it exits. In extractive economies, the dollar leaves immediately.
Tweet 3: The building blocks: Community land trusts. Worker cooperatives. CDFIs (community-owned banks). Food sovereignty infrastructure. Local exchange systems.
Tweet 4: E5 Enclave is building all of this in Liberty City, Miami. Lineage Farms (food). McCartney Academy (education). Block to Boardroom (business). Coalition of the Willing (people).
Tweet 5: This is not socialism. Cooperative ownership is distributed private ownership — every member is an owner. It's capitalism that distributes ownership broadly.
Tweet 6: Does it work? Mondragon Corporation: 80,000 worker-owners, €12B annual revenue. US cooperatives: 2M+ employees, $650B+ annual revenue. It works. Black communities need access to the tools.
Tweet 7: We're building that access. Free BDI dataset. Free tools. Coalition membership. e5enclave.com

### Tuesday (TikTok)
**"The Dollar Leaves" — 60-second explainer**
Hook (0-1.5s): "Every dollar that enters a Black neighborhood — where does it go?"
Content: Walk through the extraction chain. Rent → out-of-community landlord. Groceries → chain store. Gas → outside owner. Visual: dollar bill walking out the door.
Turn: "An enclave economy reverses this."
CTA: "Join the Coalition at e5enclave.com"

### Wednesday (Twitter)
**Data drop: BDI stat series**
"19.8% of Black Americans face food insecurity. The white rate is 7%. That's not a cultural difference. That's a policy consequence — 90 years of redlining, USDA discrimination, and land loss. Lineage Farms is building the structural response in Miami. @e5blackdragons"

### Thursday (TikTok)
**"What is Lineage Farms?" — 75 seconds**
Hook: "We're building a co-op farm in one of Miami's biggest food deserts"
Walk: What is Lineage Farms, why it exists, what community ownership means for food
CTA: Apply to join the Lineage Farms network

### Friday (Twitter)
**Thread: "What is an Agentic Nonprofit?"**
Tweet 1: E5 Enclave is the world's first agentic-first staffed nonprofit. Here's what that means and why it matters for Black-led organizations. 🧵
[Continue 6 more tweets from the blog post]

### Saturday (TikTok)
**"The $240K Gap" — 90 seconds**
Hook: "The racial wealth gap is $240,000. Where did it come from?"
Walk through: SFO No. 15, Freedman's Bank collapse, GI Bill exclusion, FHA redlining
Turn: "E5 Enclave is building the institutional infrastructure to close it"
CTA: Download the BDI at e5enclave.com

---

## ARIA EXECUTION PROTOCOL

**Content sourcing:** ARIA pulls from WikiEntry, BlogPost, InnovationReport entities for source material
**Script draft:** ARIA writes script → LOGOS reviews for Black-first language → Miranda edits for platform voice
**Quality gate:** LOGOS must pass before any post. No deficit framing. No apologizing for the data.
**Scheduling:** ARIA creates scheduled post drafts in entity (SocialQueue — to be created) → Chairman reviews weekly batch → publishes
**Performance tracking:** ARIA logs impressions/engagement weekly to EventLog

---

## ENTITY NEEDED: SocialQueue

Fields needed:
- platform (TikTok / Twitter)
- content_type (thread / data_drop / video_concept / response)
- status (draft / logos_review / approved / scheduled / published)
- scheduled_at
- content_text
- hashtags
- cta_link
- performance_notes
- logos_approved (boolean)
- dag_stamp

**Next step:** Create SocialQueue entity → ARIA populates weekly → Chairman approves batch → publish


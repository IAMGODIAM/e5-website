# E5 Enclave Email Welcome Sequence
## 3-Email Drip: Mission → BDI Dataset → Coalition Apply
### Architecture: Zeffy new subscriber trigger → 3 emails over 7 days

---

## EMAIL 1 — DAY 0 (Immediate on signup)
**Subject:** You just joined something real.
**From:** Israel Armstead <israel@e5enclave.com>
**Preview:** Welcome to E5 Enclave. Here is what we're building.

---

You just signed up. I want to tell you directly what that means.

E5 Enclave Incorporated is a 501(c)(3) nonprofit headquartered in Liberty City, Miami. We're not a service organization. We build institutional infrastructure for Black communities — the land systems, financial systems, data systems, and educational systems that make economic sovereignty possible.

What that looks like in practice:

**Lineage Farms** — cooperative urban farms and food sovereignty programs in Miami's food deserts.

**McCartney Academy** — a Black-centered K-12 school being built in Liberty City, named for Ralph McCartney, an elder and community figure who shaped this neighborhood.

**The Black Distress Index** — a free 50-city dataset tracking where Black communities are under the most economic stress, built for advocates, researchers, and coalition members.

**The Coalition of the Willing** — the network of organizations, advocates, and community members who are building this with us.

We operate differently than most nonprofits. Our operations are coordinated by a board of AI agents working under human board governance — the world's first agentic-first staffed nonprofit. This lets us do the coordination work of a 15-person staff and route every dollar saved into mission.

Over the next few days, I'll share two things with you:
- Our free dataset (the Black Distress Index)
- How to get involved with the Coalition

Thank you for being here.

**Israel Lee Armstead**
Chairman, E5 Enclave Incorporated
liberty City, Miami, Florida

---
*E5 Enclave Incorporated · 820 NW 64th St, Miami, FL 33150 · EIN 99-3822441*
*You're receiving this because you signed up at e5enclave.com.*
*[Unsubscribe](#)*

---

## EMAIL 2 — DAY 3
**Subject:** Your free dataset: The Black Distress Index
**From:** Israel Armstead <israel@e5enclave.com>
**Preview:** 50 cities. Real data. Free to use.

---

Three days ago you joined the E5 Enclave list. I promised you a free dataset.

Here it is.

**[Download the Black Distress Index →](https://www.e5enclave.com/black-dragons-initiative/)**

The Black Distress Index is a 50-city data platform that tracks economic stress in Black communities across the United States. It measures:

- Housing instability and displacement risk
- Food insecurity rates
- Income inequality relative to local median
- Health disparities
- Civic disenfranchisement indicators

It was built because most community development tools were built for grant-writers explaining problems to funders — not for community members and advocates who already know the problems and need the data to build solutions.

Use it for:
- Grant applications and foundation reports
- Local advocacy and policy testimony
- Coalition organizing and community presentations
- Research and journalism

It's free. No email gate. No paid tier. Share it.

---

One more thing.

Black communities in America are facing a $240,000 median wealth gap — a gap that traces directly to specific federal decisions: redlining, the reversal of Reconstruction-era land transfers, USDA discrimination, and the systematic exclusion of Black workers from the New Deal and GI Bill.

E5 Enclave is building the institutional infrastructure to close that gap from the inside. The BDI is the measurement layer. Lineage Farms is the land layer. McCartney Academy is the education layer. The Coalition is the people layer.

You're part of this now.

**Israel**

---
*[Unsubscribe](#) · E5 Enclave Incorporated · EIN 99-3822441*

---

## EMAIL 3 — DAY 7
**Subject:** One thing we need from you.
**From:** Israel Armstead <israel@e5enclave.com>
**Preview:** Join the Coalition of the Willing. It takes five minutes.

---

You've been on the list for a week. You've read the mission. You have the dataset.

Now I want to ask you something directly.

**[Apply to the Coalition of the Willing →](https://www.e5enclave.com/coalition/apply/)**

The Coalition of the Willing is how E5 Enclave gets things done in communities beyond Miami. It's a network of organizations, researchers, advocates, farmers, educators, designers, and community organizers who are building Enclave Economy infrastructure in their own cities.

Coalition members get:
- Access to E5 Enclave's free research and program tools
- Connection to the national network of Black community builders
- The ability to co-apply for grants and federal contracts with E5 as a named partner (we have federal contractor credentials: UEI H8NGXEYE2HH8, CAGE 07E88)
- Direct involvement in the programs we're building

The application takes five minutes. We review every one and match you to what's needed most.

If you're not ready to join yet — that's fine. Stay on the list. Read the dispatches. We publish new research, doctrine, and program updates every week.

But if you're ready: the Coalition is how you go from subscriber to builder.

**[Apply now →](https://www.e5enclave.com/coalition/apply/)**

**Israel**

---
*[Unsubscribe](#) · E5 Enclave Incorporated · EIN 99-3822441*

---

## IMPLEMENTATION NOTES

**Trigger:** New email subscriber via Zeffy or newsletter form
**Platform:** Integrate via Outlook/Microsoft → use existing automation infrastructure
**Delay:** Email 1 = immediate, Email 2 = Day 3 (72 hrs), Email 3 = Day 7 (168 hrs)
**Tracking:** UTM parameters on all links: utm_source=email&utm_campaign=welcome_sequence&utm_content=email1/2/3
**Conversion goal:** Coalition application submission
**Secondary goal:** BDI dataset download


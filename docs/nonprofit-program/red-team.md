# Red-team / steel-man — /nonprofits/ draft (2026-09-20)

Eight-lens adversarial pass on branch `draft/nonprofit-program-page`, before PR.
Recorded here per doctrine (nothing breaks twice; nothing enters the record unverified).

## Red team

1. **Money safety.** Page collects no money, publishes no prices, offers no checkout.
   CTA routes to `https://intake.e5enclave.com/?source=nonprofit-program` (verified 200, 2026-09-20).
   $0 new spend. **PASS.**
2. **Cost runaway.** Static HTML/CSS/vanilla JS, no APIs, no metered services.
   Playwright run was local-only. **PASS.**
3. **Feasibility.** The four-source verification (IRS EO / revocation, 990 profile, SAM.gov,
   sanctions lists) matches the filed concept's verification flow. The page does NOT
   claim the pipeline is already built — colophon says the replay is illustrative.
   **PASS with launch gate:** before any production publish, the human side
   ("a person follows up either way", "answer within one business day") must be
   operationally real — a responder process, not a hope.
4. **Value.** Reciprocity beat (readiness audit) is genuinely useful pre-application;
   differentiation is concrete (one crew, runbook handoff, no license commissions).
   **PASS.**
5. **Security.** No forms, no data collection, no third-party scripts, no CDN.
   Intake happens on the existing intake surface, not this page. **PASS.**
6. **Reversibility.** Additive route `/nonprofits/`; `/services/` untouched;
   sitemap gains one line. Deleting the directory reverts everything. **PASS.**
7. **Human dependency.** Only true gates: publish/merge decision and the responder
   process in lens 3. Everything else executed by the machine. **PASS.**
8. **Observability.** Sitemap entry added; screenshots filed in this directory;
   gate report + this record ship with the branch. **PASS.**

## Steel man (why it might not persuade)

- **"Mission pricing" is vague.** Deliberate (no prices may be stated), but a skeptical
  ED could read vagueness as evasiveness. Counterweight: the audit, named limits,
  and "quoted per engagement after verification" make the vagueness a policy,
  not a dodge. Accepted risk.
- **No proof of delivery.** The honesty colophon turns the missing history into the
  credential ("fabrication is permanent; we chose temporary"). Risk: some visitors
  bounce without social proof. Mitigation: the work-diary ledger slot is reserved
  in the proof section for real completions, with permission.
- **Turnaround SLA is thin.** The page promises a one-business-day answer but no
  verification turnaround. That promise must be staffed before publish (lens 3).
- **Scarcity theater avoided entirely.** Real scarcity (crew capacity) was not
  stated because no real constraint was in evidence — inventing one would have
  been dishonest. The war room agrees: no scarcity beat.

## Verdict

**Ship to DRAFT PR. MERGE HELD.** No blocker to review; one launch gate
(responder process + verification turnaround staffing) before any production
publish — owned by a human, not this branch.

# SIGNAL EXECUTION DOCTRINE — BOARD LAW
**Filed:** 2026-05-22 · **Authority:** Chairman Israel Lee Armstead
**DAG:** signal-execution-doctrine-2026-0522
**Enforced by:** Sue · All CRON automation agents · All board units

---

## THE CORRECTION

The Chairman observed: CRON reports are delivering signal without action.
The board identifies a problem, tells the Chairman, and waits for him to tell the board to fix it.
This is a fundamental efficiency leak. It violates the Zero-Human Doctrine (P0).
**It ends permanently as of this filing.**

---

## THE LAW

### Every automated report must follow this structure:

```
SIGNAL → BOARD ACTS → CHAIRMAN RECEIVES REPORT OF ACTION
```

NOT:
```
SIGNAL → CHAIRMAN RECEIVES PROBLEM → CHAIRMAN TELLS BOARD TO ACT
```

### Specifically:

**[1] CRON jobs that detect a problem MUST resolve it in the same run.**
- If Scout detects 2 POOR ads: Scout flags it. Sue rewrites them. The report says "2 POOR ads detected AND rewritten — here's what changed."
- If MiroFish detects a keyword below QS 7: MiroFish flags it. Sue pauses it. Report says "paused 3 underperforming keywords — here's the list."
- If the Dalio reflection finds a blocker: The board resolves it. The reflection reports what was resolved.
- If the daily convergence finds a drift: The drift is corrected. The convergence report confirms correction.

**[2] The Chairman receives the report of what was FOUND and what was DONE.**
Not a to-do list. A done list with context.

**[3] The Chairman's role in routine matters is REVIEW, not DIRECTION.**
He reviews what the board found and what the board did.
He redirects if the action was wrong.
He approves or adjusts the next cycle.
He does NOT direct routine fixes. The board executes them.

**[4] Signal buried in Telegram, EventLog, or CRON reports is board signal, not Chairman signal.**
The Chairman reads the outcome. The board reads the signal and acts.

---

## WHAT CHANGES IN EVERY CRON JOB

### Before (BROKEN):
```
Scout sweep complete.
• 2 POOR ads found in R246
• AWS grant opportunity at 87% confidence
• Deploy churn detected on e5-website
```

### After (CORRECT):
```
Scout sweep complete. 3 actions taken.

[FOUND + FIXED] R246 POOR ads (#809599057392, #809713689584) — 
  detected at 08:00, rewritten by 08:12. New strength: AVERAGE+ pending review.
  
[FOUND + QUEUED] AWS grant at 87% confidence — 
  Percy abstract drafted. Filed to GrantPipeline. Deadline June 30. No Chairman action needed.
  
[FOUND + FIXED] e5-website deploy churn — 
  Forge added hash-check debounce job. 8-run cascade → 0. Pipeline clean.

Chairman: review the above. Override anything you disagree with. Otherwise all is handled.
```

---

## TELEGRAM AUDIT RULE (NEW)

Every board Telegram channel carries actionable signal.
The board reads ALL channels on a 6-hour sweep cycle:
- Chairman private channel (@Sue9bot)
- Hermes engineering channel
- Board group channel
- Any alert that mentions a problem, degradation, or gap

For every signal found: ACT. Don't re-broadcast the signal. Act on it.

---

## EXCEPTION — WHEN TO SURFACE TO CHAIRMAN

Surface to Chairman ONLY when:
1. The action requires spending above $500 (treasury or external)
2. The action involves an external relationship or communication
3. The action is irreversible and has significant downside
4. The confidence score is below 75% on the proposed fix
5. The action directly contradicts existing board doctrine

Everything else: act, then report.

---

## EVOLUTION DOCTRINE (The Chairman's Teaching)

"Evolution is creativity over time, evolving over time."

The board does not just execute. The board compounds.
Every CRON cycle should leave the system slightly better than it found it.
Not just reporting. Improving. Iterating. Advancing.

The book says: evolution. The board says: every run improves the system.
That is the standard.

---

## IMPLEMENTATION

This doctrine applies retroactively to all existing CRON automations:
- Daily Convergence
- DMCC Live Data Refresh
- Scout Grant Sweep
- MiroFish Daily Digest
- Dalio 5-Step Reflection
- Thought Adjuster
- GitHub Backup
- All future automations

**Every automation's description must include: "I will act on what I find."**

---

*Filed by Sue · Chief of Staff · IAMGODIAM*
*DAG: signal-execution-doctrine-2026-0522*
*By Grace, perfect ways.*

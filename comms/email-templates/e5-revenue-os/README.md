# E5 Revenue OS email templates — backup

Backup copy of the E5 outreach email design. Not wired into the site build.

| File | Provenance | Date | Made by |
|---|---|---|---|
| template.html | IAMGODIAM/e5-revenue-os `email/template.html` at commit `d91a54f` | 2026-09-02 | "E5 Revenue OS (Cowork)" session; Comms Steward authorship not confirmed |
| template.txt | IAMGODIAM/e5-revenue-os `email/template.txt` at `d91a54f` | 2026-09-02 | same |
| template_preview.html | IAMGODIAM/e5-revenue-os `email/render/template_preview.html` at `d91a54f` (sample render) | 2026-09-02 | same |
| register/e5-design-registers-SKILL.md | IAMGODIAM/prometheus-os `skills/e5/e5-design-registers/SKILL.md` | exported 2026-08-12 | e5 skill export |

## Changes from source
- `template_preview.html`: the sample salutation "Ms. Alvarez" and organization "Overtown Youth Kitchen" were replaced with `[Recipient Name]` / `[Sample Organization]`. They appear only as sample content in `email/render/test_render.py` and are not in the prospect lists, so they are most likely fictional, but that could not be confirmed. They were replaced to be safe.

## Excluded on purpose
`prospect_preview.html` (names a real prospect), `prospects.csv` / `prospects.json`, `build_prospects.py`, `candidates.py`, `render_prospect_email.py`, `scrape_contacts.py`. These hold real prospect names and contacts.

## Missing: Comms Steward templates 01–04
Comms Steward's templates 01–04 were lost in the box rebuild on 2026-10-16 at 12:36 PM ET. They will be added later as **labeled reconstructions**, not originals.

## Review
Storm Scout and Integrity Sentinel should review this before merge. Someone other than Eli merges.

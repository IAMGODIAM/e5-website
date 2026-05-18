# Evidence Ledger

Use this ledger to record inspected sources before converting observations into findings.

| ID | Date | Source Type | URL / Repo Path / Command | What Was Inspected | Evidence Summary | Follow-up |
|---|---|---|---|---|---|---|
| E-000 | 2026-05-18 | Repo | `IAMGODIAM/e5-website` | Repository identity and recent commit activity | Repo identified as likely active E5 website repository. Workstation branch created from latest visible `main` commit `5e495e77c91e36c7d1b97ada7fb32aa9863bcc94`. | Continue full repo inventory. |
| E-001 | 2026-05-18 | Web | `https://e5enclave.com` | Live public target assumption | Live site target identified for crawl and public forensic review. | Crawl sitemap, routes, redirects, external links, forms, assets, headers. |

## Evidence conventions

- Use `E-###` IDs.
- Keep raw observations separate from conclusions.
- Link each material finding in `FINDINGS-REGISTER.md` back to one or more evidence IDs.
- For screenshots or exported crawl data, commit only safe public artifacts. Do not commit secrets, credentials, donor data, or private analytics exports.

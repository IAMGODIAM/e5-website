# Consultant Forensic Workstation

This directory is the shared working area for the E5 website forensic review.

## Purpose

Create a clean, auditable place for outside consultants to review the live E5 website and its repository without burying evidence in chat threads, personal notes, or temporary scratch files.

## Operating rule

Nothing in this folder is production website content. It is an audit workspace. Findings should be specific, evidenced, reproducible, and blunt.

## Consultants

- Consultant A: ChatGPT / outside AI consultant
- Consultant B: second outside reviewer / human or agentic consultant

## Review scope

The review should cover:

1. Live public website crawl
2. Repository file inventory
3. Content, claims, and credibility
4. UX, conversion, accessibility, and information architecture
5. Technical implementation, build/deploy surface, dependencies, redirects, and assets
6. Security, privacy, compliance, donor/payment flows, and data handling
7. SEO, social metadata, structured data, performance, and observability
8. Brand coherence and institutional trustworthiness
9. Dead links, broken pages, stale copy, placeholder numbers, missing proof, and contradictory dates

## Workspace files

- `HANDOFF.md` — current handoff state and next actions
- `EVIDENCE-LEDGER.md` — source-of-truth log for inspected pages, files, commands, and artifacts
- `FINDINGS-REGISTER.md` — issue register with severity, evidence, owner, and recommendation
- `FORENSIC-CHECKLIST.md` — checklist for page-level, repo-level, and operational review

## Severity scale

- `P0` — legal, security, payment, donor trust, or reputational emergency
- `P1` — materially harms launch readiness, conversion, credibility, or accessibility
- `P2` — important quality, maintainability, SEO, performance, or consistency defect
- `P3` — polish, style, documentation, or low-risk cleanup

## Evidence standard

Every serious finding should include:

- URL or repo path
- Exact observed behavior or content
- Why it matters
- Reproduction steps or inspection method
- Recommended correction
- Open question, if any

## Non-goals

Do not use this folder for secrets, credentials, donor data, private analytics exports, or production configuration values.

# DentalFlow 2 — Implementation Roadmap (Phase 2)

Version: 2026-10-30. Execution order optimized by value/risk; each item names verification evidence required to consider it done. Phase numbering follows the master plan (Phases 1–9), with the Phase-1 audit and Phase-2 research already delivered.

## Current position

- **Phase 1 done:** `PROJECT_AUDIT.md` (verdict: upgrade). Baseline gates green.
- **Phase 2 (this document):** `COMPETITIVE_RESEARCH.md`, `PRODUCT_REQUIREMENTS.md`, and the R4 booking-integrity migration (`supabase/migrations/202608030008_booking_conflict_integrity.sql`).
- In-flight user work preserved and completed where cheap (Reports→analytics engine wiring, task-queue truth fix, payments repository surface).

## Track A — Correctness & data integrity (continues into Phase 5)

| # | Item | Status | Gate evidence |
| --- | --- | --- | --- |
| A1 | Booking exclusion constraints + race-safe RPC (R4) | **Migration written**; static SQL gate PASS | Runtime: `supabase db reset` + concurrency check on a machine with Docker (as documented in the migration footer). Not yet runtime-verified — no Docker here |
| A2 | Signed-record immutability negative test (R8) | Not started | New domain/SQL test proving signed notes/consents reject UPDATEs through the client path |
| A3 | Retire `any` at the Supabase row boundary (audit finding §3.2) | Not started | `grep`-driven replacement with typed row shapes; typecheck + zero regressions |
| A4 | Gate polling by focus/visibility (audit finding §3.3) | Not started | Dashboard 60s + comms 45s polls only while app focused; battery claim verified by code review notes |
| A5 | GST correctness (R5) | Not started | HSN/SAC + CGST/SGST fields on procedure/invoice; domain rule computing tax splits; UI renders breakdown; receipt text updated |
| A6 | Duplicate-patient UX (R4 research finding) | Not started | Intake screens RPC error → friendly resolution path |

## Track B — Screens & workflows (Phase 4)

| # | Item | Depends on | Gate |
| --- | --- | --- | --- |
| B1 | Booking flow polish: show which resource conflicted (doctor vs chair), preserve form on error | A1 | Screen walkthrough on demo + Supabase modes |
| B2 | Patient profile: surface recall status + balances + alerts consistently (data exists) | — route-by-route checklist passes |
| B3 | Waiting room / chair transitions against real statuses | — transition matrix tests extended |
| B4 | Treatment plan → invoice linkage (proposed vs performed) | A5 | Playwright-free manual + domain tests |
| B5 | Refund flow with idempotency display | — refund audit rows visible |
| B6 | Inventory movement correctness on consumption links | — stock math tests |

## Track C — Engagement & communications (Phase 6)

| # | Item | Notes |
| — | --- | --- |
| C1 | WhatsApp adapter truthfulness: configured vs demo band in composer; opt-out blocks send | DLT template categories mapped; negative test R7 |
| C2 | Recall automation on completion (follow-up task + template queue) | Uses existing outbox_events |
| C3 | Patient portal link lifecycle (expire/rotate) | Already hashed; verify expiry negative path |
| C4 | Tamil patient-facing copy for top ten messages | Copy pass, no schema change |

## Track D — AI (Phase 7)

| # | Item | Notes |
| D1 | History assistant provenance UI already returns sources [V in audit] — verify runtime with configured OpenRouter + de-identification flags | Never enabled without configured key; unconfigured state honest |
| D2 | Note-draft assistant (SOAP) with mandatory review — ship only after D1 verified | No diagnostic output, no autonomous posting; consent recorded for AI review |
| D3 | Imaging AI partner hooks (research §Part 3.7) | Post-India; integration contract only |

## Track E — Performance & QA (Phases 8–9)

| # | Item | Gate |
| E1 | Realistic synthetic dataset (500 patients / 5k appointments) + report timings | Perf audit updated with numbers |
| E2 | Route-by-route quality checklist (master prompt §15) — every route ranked | QUALITY_REPORT.md rows |
| E3 | expo-doctor alignment + lint warning reduction (49 → <30) | Full `npm run verify` |
| E4 | RELEASE_READINESS.md: env/template, deploy steps, rollback | Setup on a fresh clone; demo + Supabase paths documented as untested until runtime-verified |

## Sequencing rationale

1. A-track first: data truth before UI polish (a pretty screen on wrong data is the failure mode we're avoiding).
2. B-track second: the five-tab core is the daily surface; polish beats breadth.
3. C-track next: WhatsApp/recall is the highest-value India differentiator per research.
4. D-track last among features: honest provenance UI exists; no clinical AI claims until runtime-verified.
5. E-track runs continuously after each track lands.

Everything here maps to an existing verified architectural seam (repository, RPC, outbox, roles) — no rewrite rows exist by design.

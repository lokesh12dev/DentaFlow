# DentalFlow 2 — Product Requirements (Phase 2)

Version: 2026-10-30. Derived from `PROJECT_AUDIT.md` (verified feature surface) and `COMPETITIVE_RESEARCH.md` (market evidence). Requirements are numbered; "Verified surface" rows reference what already exists in the codebase so scope is grounded, not aspirational.

## 1. Product vision

A calm, fast, mobile-first practice platform for real dental clinics — starting in Tamil Nadu, later India-wide and international — where **every number on screen is true** (documented formulas, audit trail, role-scoped data) and **every workflow completes end-to-end** (intake → chair → chart → estimate → invoice → payment → recall), at a price a 1–3-chair clinic can pay without a sales call.

## 2. Personas & primary jobs

| Persona | Role / clinic reality | Top jobs (job-to-be-done phrasing) | How often |
| --- | --- | --- | --- |
| Dr. Owner (developer-dentist) | Owner-dentist, 1–3 chairs, sometimes 2nd branch | "Before the day: show me who is coming, who owes what, which recall slipped." "When chairside: get the chart right in seconds, on my phone." | Daily, high-frequency |
| Receptionist / front desk | Walk-ins + WhatsApp bookings; mixed Tamil/English names | "Fill the calendar, take the booking, take the money, keep the day readable." | All-day |
| Dental assistant | Sees/in-waits/pauses patients | "Keep the chair moving; record what the doctor did without hunting through screens." | Per appointment |
| Branch owner/manager | Multi-branch roll-up | "Compare chairs, branches, doctors. Which recall backlog is leaking revenue?" | Weekly |
| Patient | Mobile/WhatsApp-first, skeptical about data misuse | "Remind me, confirm me, show me what I owe and what treatment costs — and only the clinic should see my photos." | Per appointment |
| Billing staff | GST + partial payments + refunds | "Collect, track outstanding, never lose a rupee after a refund." | Daily |

**Excluded personas for v1:** DSO enterprise admins, hygienist-led US practices, orthodontic monitoring patients (no DM-style remote monitoring — unmet niche, regulated, hardware-tied per research message in `COMPETITIVE_RESEARCH.md`).

## 3. MVP scope (scoped to existing verified surfaces)

### 3.1 Keep and harden (already built, verified in audit)
- Auth + clinic onboarding (sign-in, create-clinic, membership, roles) — `app/(auth)`, `clinic_members` + RLS.
- Five-tab shell (Today / Patients / Calendar / Inbox / More) + five role-gated modules.
- Appointments lifecycle with draft→booked→listed→in-chair→completed transitions, conflict checks and reminders to care for deposits (`Appointments RPCs`, calendar, waiting-room flow).
- Patients: intake, flags, medical alerts, timeline, tooth chart, clinical notes, media, consents, prescriptions.
- Treatment plans + line items, invoices + items, payments with refunds and idempotency keys, inventory movements, lab cases, family accounts, booking requests, audit logs.
- Edge functions with the authenticated-JWT + membership gate; provider adapters with unconfigured-state honesty (`integrationHealth`).
- Patient portal public booking with hashed expiring tokens.

### 3.2 Finish (in-flight, from this session + pending work)
| ID | Requirement | Acceptance criteria | Reason |
| --- | --- | --- | --- |
| R1 | Reports from tested analytics engine | Reports screen renders only values from `buildClinicAnalytics`; range selector 7d/30d/90d/All; definitions visible; tests pass; **done in working tree** | Was mid-flight |
| R2 | Task queue truth | 'done' filter shows completed tasks against Supabase (fixed by including all statuses bounded 300) | Component truth bug |
| R3 | Payment history access | `listPayments` exists in both repositories with bounded query; invalidation on record/refund | Engine dependency |
| R4 | Booking race safety | DB-level exclusion constraint prevents double-booking doctor/chair on ever-green statuses; friendly message unchanged; migration added; runtime verification pending (no Docker) | Data integrity |
| R5 | GST invoice correctness | Invoice line items carry GST rate税务 breakdown (CGST/SGST for intrastate default Tamil Nadu), HSN code optional per procedure; totals arithmetic verified in domain rules; UIill apply math from schema not screen | India compliance |
| R6 | UPI receipt path | Payments accept UPI method with reference; receipt text includes amount/method/receipt number; sharing flow appears only when provider configured (existing integration health) | India compliance |
| R7 | DLT-ready messaging | Message templates carry variable list; sending requires template category mapped to DLT class; unconfigured providers render "provider not configured" state (already implemented) — add regression test asserting the unconfigured path | Communication trust |
| R8 | Versioning & immutables | Signed notes and signed consents mutate only through versioned amendments; audit trigger proves immutability (existing trigger `protect_signed_clinical_note`) — add negative test | Clinical record integrity |
| R9 | Insight into every number | Every report/dashboard metric shows its definition on demand (done for Reports; rotate to Today) | Trust positioning ("no invented numbers") |

### 3.3 Explicit non-goals (v1)
- No first-party AI radiograph reports (partner path only, e.g. integration hooks — see research §3.7).
- No US insurance/RCM modules (eligibility, claims, clearinghouses).
- No orthodontic remote monitoring, no ScanBox-like hardware.
- No ABHA/ABDM write-side integration before clinics opt in and we validate the ABDM consent-artifact flow, but the schema must never block it (patient identifiers & consent tables remain extensible).
- No AI auto-diagnosis, auto-prescription, or auto-payment decisions — human-in-loop is mandatory (product principle, aligned to regulatory stance in research Part 2).

## 4. Functional requirements by workflow (definition of done per flow)

**Intake:** duplicates detected by normalized phone+name (existing RPC); intake form validates on device and server; medical alerts render everywhere the patient appears; consent links pre-recorded.

**Booking:** patient + doctor + chair + procedure + time; conflict error states identify what was double-booked (doctor vs chair); WhatsApp confirm optional with consent; changes persist and calendar updates optimistically then reconciles with server truth.

**Chairside:** check-in → waiting → in-chair → pause/resume; doctor views tooth chart + note drafts; signed notes immutable, amend via new version; media uploaded to private clinical-media bucket with signed URLs only.

**Treatment & billing:** plan items proposed→approved→started→completed; each completed item can generate billables; invoices edit tax/discount; payments partial with balance math from DB sum (never screen arithmetic); refunds require idempotency key and record reason; receipt text.

**Recalls:** due/due-soon/overdue tracked on patient; recall task created in task list; completion feeds `followUpCompletion`; recall completion metric currently point-in-time — state that label in UI (already in definitions).

**Comms:** unified history per patient and clinic; WhatsApp/SMS/email adapters exist but both configured and unconfigured states must be truthful in UI; opt-out honored — messaging blocked when `whatsapp_consent=false` (enforce at compose time; server enforces at send via template rules).

**Admin:** team roles owner/manager/dentist/receptionist/assistant/billing with permission matrix (existing 16 access tests); branch pricing per procedure; audit timeline; settings guarded.

## 5. Non-functional requirements (from §17–§15 of the master plan)

- **Performance:** mobile interaction ≤100ms optimistic feedback; lists virtualized (FlashList used in 4 core lists); no unbounded client queries (all repository reads bounded ≤300 rows / patient-scoped).
- **Accessibility:** every control ≥44px touch; focus rings (done for Button/Field); screen-reader roles/labels; reduce-motion respected (done for Skeleton); contrast ≥4.5:1 (textMuted bump in pending work).
- **Data protection:** RLS everywhere (verified); SQLCipher local DB with PHI rejection (verified); signed notes/consents immutable (triggered); audit logs write-on-deed; DPDPA consent fields (`whatsapp_consent`, `photo_consent`, `marketing_consent`) respected in every messaging path.
- **Reliability:** no silent failures — every mutation surfaces success/failure with recovery (pattern exists; verified in screens we inspected); payment/refund/messaging idempotent or safely re-runnable.
- **Trustfulness:** no marketing-only metrics; every number carries formula or provenance; unconfigured integrations look unconfigured.
- **Localization:** Tamil-first copy for patient-facing messages (template system already text-variable-based; translation is-copy work, not schema work).

## 6. Success metrics (each maps to a metric we already compute)

- Activation: clinic reaches 10 intakes + 10 booked appointments within 14 days of signup.
- Booking friction: % of appointment creations that succeed from the booking flow without a conflict error.
- Collection hygiene: % of invoices at 0 balance within 30 days of issue (existing outstanding/outdated math extended with DSO-style aging later).
- Recall execution: `recallCompletion` (point-in-time, defined in product) improving across cohort.
- DAU per staff member and `followUpCompletion` as operational health signals.
- Trust signals: zero unauthorized cross-clinic data events in audit; zero secret-leak audit findings.

## 7. Risks & mitigations (top 5)

1. **DB runtime unverified here (no Docker)** — mitigate with static SQL gates + migration review; runtime check before any production claim (documented in audit §6).
2. **AI-held competitor perception** — our differentiators are honest provenance + India-fit billing; don't fight the radiograph-AI marketing war.
3. **Single-dentist market price sensitivity** — keep unlimited-staff seats (scanO pattern) and self-serve pricing; validate willingness-to-pay in interviews (research Part 4).
4. **Offline expectations** — competency boundary stated explicitly; PHI never leaves device unencrypted; non-PHI queue only.
5. **Regulatory creep** — no clinical AI claims beyond review-support; CDSCO guidance tracked; consent records keep provenance for every AI-reviewed artifact.

## 8. Acceptance gates to declare "MVP ready for internal pilot"

1. All Phase gates from the master plan executed with evidence (quality, security, release docs exist and are honest).
2. Every listed R1–R9 acceptance criterion met or explicitly deferred with reason.
3. Fresh-clone setup: exactly the commands documented; demo mode works without credentials; Supabase mode works with credentials (runtime-verified on a real project).
4. Zero critical/high audit findings; lint errors 0; test suites green incl. new R4/R8 regression tests.
5. A pilot clinic (Tamil Nadu) can run 14 days on the platform with only these modules.

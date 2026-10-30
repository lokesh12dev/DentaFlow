# DentaFlow 2 — Known Issues

**Last updated:** 2026-10-30
**Source:** Derived from `PROJECT_AUDIT.md` §6 findings + `quality-reports/*.json`.

---

## Track A — Correctness & data integrity

### A1. R4: Booking double-booking race condition (runtime unverified)
- **Severity:** Medium (low probability at single-clinic loads; high value for correctness claims)
- **Status:** Migration `202608030008_booking_conflict_integrity.sql` written; static SQL gate PASS.
- **Issue:** The booking RPC performs a check-then-act SELECT, not a database `EXCLUDE` constraint. Under two concurrent booking calls both can pass the SELECT simultaneously. The migration adds bounded partial exclusion constraints on `(clinic_id, doctor_member_id, starts_at, ends_at)` and chair.
- **Blocker:** Cannot runtime-verify without Docker (`supabase db reset` not available in this environment).
- **Mitigation:** Static SQL gate passes; migration reviewed; document Docker requirement for production verification.

### A2. R8: Signed-record immutability negative test
- **Severity:** Medium (clinical record integrity)
- **Status:** Not started.
- **Issue:** `protect_signed_clinical_note` audit trigger exists in SQL, but no negative test proves signed notes/consents reject UPDATEs through the client path.
- **Plan:** Add domain test asserting `updateClinicalNote`/`updateConsent` throws for signed records.

### A3: `any` at Supabase row boundary
- **Severity:** Low
- **Status:** Not started.
- **Issue:** `supabaseRepository.ts:274` uses `Record<string, any>` casts at the DB boundary (`normalizeAppointment`, `normalizeTask`, etc.). One defensible boundary cast but violates the project's zero-`any` law.
- **Plan:** Replace with typed row shapes or zod parsing.

### A4: Unfocused polling drains battery
- **Severity:** Low
- **Status:** Not started.
- **Issue:** Dashboard refetches every 60s and communications every 45s regardless of app focus/visibility. On mobile this costs battery.
- **Plan:** Gate `refetchInterval` on `AppState`/focus; resume with refetch on foreground.

### A5. R5: GST invoice correctness
- **Severity:** Medium (India compliance)
- **Status:** Not started.
- **Issue:** Invoice line items have `tax` field but no CGST/SGST/HSN breakdown. Indian clinics need proper GST invoicing (CGST/SGST for intrastate, HSN codes).
- **Plan:** Add `tax_rate_cgst`, `tax_rate_sgst`, `hsn_code` to invoice_items; domain rule `computeGstSplit()`; UI renders breakdown.

---

## Phase 2+ — Remaining items from audit

### Env template duplication
- **Severity:** Low
- **Issue:** `.env.example` and `env.example` differ in content; `patient-portal/config.js` committed with placeholders.
- **Plan:** Consolidate templates; gitignore `patient-portal/config.js`; runtime fallback for placeholders.

### SDK version drift
- **Severity:** Low
- **Issue:** 22 SDK-57 packages behind expected patch versions (`expo-sqlite` check fails: `~57.0.1` vs `~57.0.4`). App builds fine today.
- **Plan:** `npx expo install --check --fix` as part of E3.

### Lint warnings
- **Severity:** Low
- **Issue:** 54 style-tier warnings (unused vars, array-type notation, one `require()` in Badge.tsx).
- **Plan:** Reduce to <30 as part of E3.

---

## Phase 3+ — UI/design gaps

### Destructive confirmations
- **Status:** Operational concern, not UI-layer work. Workflow-level confirmation dialogs not yet implemented for destructive actions (refunds, deletions, cancellations).

### Offline/sync states
- **Status:** Data-layer concern. Local SQLite queues permitted non-PHI mutations, but UI lacks explicit offline/sync state indicators.

### Route guard + permission feedback in all screens
- **Status:** RoleGuard wired + AccessDeniedState exists, but not every screen goes through RoleGuard. Some direct links may bypass permission checks.

---

## Environment limitations (affecting verification)

| Item | Status |
| --- | --- |
| Docker / Supabase runtime | Not available; R4 cannot be runtime-verified |
| Supabase service credentials | Not available; no live-backend testing |
| EAS builds (Android/iOS) | Not available; no native build verification |
| Browser automation (screenshots) | Use `expo export --platform web` + manual review |
| git bash commands | Environment permissions block git/ls; file inspection via read/glob/grep tools |

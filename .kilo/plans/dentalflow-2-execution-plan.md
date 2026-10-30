# DentaFlow 2 — Implementation Plan

## 0. Situation (verified facts)

**Stack:** Expo SDK 57 · RN 0.86.2 · React 19.2.3 · Expo Router · TS ~6.0.3 strict · Supabase (8 migrations, 13 Edge Functions, RLS everywhere) · TanStack Query 5.85 · Zustand 5 · react-hook-form + zod 4 · flash-list · react-native-reanimated 4.5.1 · lucide-react-native · expo-sqlite (SQLCipher).

**Quality gates (all PASS):** `tsc --noEmit`, `eslint` (0 errors, 54 warnings), `npm test` (14 domain + 16 access + 2 AST guards), `npm run audit` (8 Python audits, 0 findings except 1 low on types.ts line count), `expo export --platform web`.

**Phase 1-3 already complete:** `PROJECT_AUDIT.md`, `COMPETITIVE_RESEARCH.md`, `PRODUCT_REQUIREMENTS.md`, `IMPLEMENTATION_ROADMAP.md`, full `design-system/` tokens, `docs/ui-redesign/` design docs, 65 routes, 32 feature screens, repository pattern (supabase + demo).

**In-flight user work preserved (audit §5):**
- `buildClinicAnalytics()` in `src/domain/rules.ts` — implemented + tested; **ReportsScreen.tsx already consumes it** (R1 done).
- `RoleGuard.AccessDeniedState` in `src/navigation/RoleGuard.tsx` — wired + typechecks.
- `app.json` web output `single`, `tokens.ts` textMuted contrast bump — pending, intentional.

**Environment constraints (verified):**
- Docker unavailable → **R4 runtime verification cannot be performed here**; static SQL gate + migration review only.
- No Supabase service credentials → no live-backend runtime verification; demo mode (`EXPO_PUBLIC_ENABLE_DEMO_MODE=true`) is the test surface.
- `bash` git/ls invocations are blocked by environment permissions; file inspection uses `read`/`glob`/`grep` tools.

---

## 1. Remaining work — ordered by risk/value (per `IMPLEMENTATION_ROADMAP.md` sequencing)

### Track A — Correctness & data integrity (first)

#### A1. R4: Booking exclusion constraint runtime verification
**Status:** Migration `supabase/migrations/202608030008_booking_conflict_integrity.sql` written, static SQL gate PASS.
**Action:** Document runtime verification steps in R4's acceptance criteria. Mark as **requires Docker + live Supabase project** — cannot run in this environment.
**Acceptance:** `supabase db reset` applies cleanly; concurrent booking returns friendly 23P01 error; cancelled overlap still allowed. **Blocker: no Docker.**
**Files:** `supabase/migrations/202608030008_booking_conflict_integrity.sql`

#### A2. R8: Signed-record immutability negative test
**Status:** Not started.
**Action:** Add domain test proving signed notes/consents reject UPDATEs through the client path.
**Files:** `scripts/run-domain-tests.mjs`, `src/domain/rules.ts` (add helper), `src/repositories/supabaseRepository.ts`.
**Acceptance:** New test asserts `updateClinicalNote`/`updateConsent` throws for signed records; `npm run test:domain` passes.

#### A3: Retire `any` at Supabase row boundary
**Status:** Not started.
**Action:** Replace `Record<string, any>` casts in `supabaseRepository.ts:274` with typed row shapes or zod-parsed outputs.
**Files:** `src/repositories/supabaseRepository.ts` (lines ~274, `normalizeAppointment`, `normalizeTask`, etc.), `src/domain/types.ts`.
**Acceptance:** `grep -n "any" src/repositories/supabaseRepository.ts` returns 0; `tsc --noEmit` passes; existing domain tests pass.

#### A4: Gate polling by focus/visibility
**Status:** Not started.
**Action:** Use `AppState`/focus to gate `refetchInterval` on dashboard (60s) and communications (45s).
**Files:** `src/hooks/useClinicQueries.ts` (lines 47, 52).
**Acceptance:** Polls pause when app is backgrounded; resume on foreground; no behavior regression in demo mode.

#### A5. R5: GST correctness
**Status:** Not started. Schema has `payment_method='upi'` but no CGST/SGST/HSN fields.
**Action:** 
1. Add `tax_rate_cgst`, `tax_rate_sgst`, `hsn_code` fields to invoice_items and invoices in next migration.
2. Add domain rule `computeGstSplit(subtotal, discount, taxRate)` in `src/domain/rules.ts`.
3. Update UI in `BillingScreen.tsx` and `PatientProfileScreen.tsx` finance tab to render breakdown.
**Files:** `supabase/migrations/202608030009_gst_tax_breakdown.sql` (new), `src/domain/rules.ts`, `src/features/operations/BillingScreen.tsx`, `src/features/patient/PatientProfileScreen.tsx`.
**Acceptance:** Domain test asserts CGST+SGST sum = total tax; UI renders breakdown from schema not screen arithmetic.

#### A6: Duplicate-patient UX
**Status:** Not started.
**Action:** Map `create_patient_intake` RPC error code → friendly resolution path in `PatientIntakeScreen.tsx`.
**Files:** `src/features/patients/PatientIntakeScreen.tsx`, `src/repositories/supabaseRepository.ts`.
**Acceptance:** Duplicate error shows "Possible existing patient" with search/linking options; no data loss.

### Track B — Screens & workflows (Phase 4)

#### B1. Booking flow polish
**Depends on:** A1.
**Action:** `AppointmentBookingScreen.tsx` should surface which resource conflicted (doctor vs chair).
**Files:** `src/features/appointments/AppointmentBookingScreen.tsx`.
**Acceptance:** Conflict error message distinguishes doctor vs chair conflict.

#### B2. Patient profile — recall + balances + alerts
**Action:** Ensure `PatientProfileScreen.tsx` summary tab surfaces recall status, balance, and medical alerts consistently.
**Files:** `src/features/patient/PatientProfileScreen.tsx`.
**Acceptance:** All three data points visible in summary; data already exists in `PatientRecord` type.

#### B3. Waiting room / chair transitions
**Action:** Verify chair state transitions match `APPOINTMENT_TRANSITIONS` matrix.
**Files:** `src/features/operations/WaitingRoomScreen.tsx`, `src/domain/rules.ts`.
**Acceptance:** Transition matrix tests extended; invalid transitions blocked at UI + RPC level.

#### B4. Treatment plan → invoice linkage
**Depends on:** A5.
**Action:** Wire completed treatment plan items to invoice creation.
**Files:** `src/features/operations/TreatmentPipelineScreen.tsx`, `src/features/operations/BillingScreen.tsx`.
**Acceptance:** Completed plan items appear as billable line items on invoice.

#### B5. Refund flow with idempotency display
**Action:** Show idempotency key + audit row in refund UI.
**Files:** `src/features/billing/PaymentScreen.tsx` (implied), `app/payment/refund.tsx`.
**Acceptance:** Refund captures reason + idempotency key; audit row visible.

#### B6. Inventory movement correctness
**Action:** Verify consumption links decrement stock correctly.
**Files:** `src/features/operations/InventoryScreen.tsx`, `src/repositories/supabaseRepository.ts`.
**Acceptance:** Stock math domain test passes; movement history accurate.

### Track C — Engagement & communications (Phase 6)

#### C1. WhatsApp adapter truthfulness
**Action:** Composer shows configured vs unconfigured state; opt-out blocks send.
**Files:** `src/features/communications/CommunicationComposerScreen.tsx`, `src/services/integrationHealth.ts`.
**Acceptance:** Unconfigured provider shows "provider not configured" state; consent=false blocks send.

#### C2. Recall automation on completion
**Action:** Appointment completion triggers recall task + template queue.
**Files:** `src/features/appointments/AppointmentDetailScreen.tsx`, `src/repositories/supabaseRepository.ts` (uses outbox_events).
**Acceptance:** Completing appointment creates recall task with template; outbox event queued.

#### C3. Patient portal link lifecycle
**Action:** Verify expiry + rotate path for portal links.
**Files:** `src/services/patientPortal.ts`, `supabase/functions/patient-link-create/`.
**Acceptance:** Expired links redirect to renewal; no permanent tokens.

#### C4. Tamil patient-facing copy
**Action:** Top 10 patient message templates in Tamil.
**Files:** `src/data/demo.ts` (template data), `supabase/functions/whatsapp-send/`.
**Acceptance:** Template copy in Tamil; no schema change required.

### Track D — AI (Phase 7)

#### D1. History assistant provenance UI verification
**Status:** Provenance UI exists in `src/features/patient/HistoryAssistant.tsx`.
**Action:** Verify with configured OpenRouter + de-identification flags.
**Files:** `src/features/patient/HistoryAssistant.tsx`, `supabase/functions/openrouter-clinical-assist/`.
**Acceptance:** Sources shown for every AI response; never enabled without configured key.

#### D2. Note-draft assistant (SOAP) with mandatory review
**Action:** Implement note drafting with mandatory human review.
**Files:** `src/features/clinical/ClinicalNoteScreen.tsx`, `supabase/functions/openrouter-clinical-assist/`.
**Acceptance:** No autonomous posting; review flag recorded per AI-reviewed artifact.

#### D3. Imaging AI partner hooks
**Action:** Integration contract for future AI partner.
**Files:** Schema must remain extensible (already designed).
**Acceptance:** Contract defined; no implementation.

### Track E — Performance & QA (Phases 8-9)

#### E1. Synthetic dataset + report timings
**Action:** Generate 500 patients / 5k appointments; measure report render times.
**Files:** `scripts/`, `docs/PERFORMANCE_REPORT.md`.
**Acceptance:** Timings documented; report renders <1s with synthetic data.

#### E2. Route-by-route quality checklist
**Action:** Checklist every route across 360/390/430/768/1280 viewports.
**Files:** `docs/PIXEL_PRECISION_AUDIT.md`, `quality-reports/QUALITY_REPORT.md`.
**Acceptance:** All 65 routes ranked; no overlaps/overflow/console errors.

#### E3. expo-doctor alignment + lint reduction
**Action:** Run `npx expo install --check --fix`; reduce 54 lint warnings to <30.
**Files:** `package.json`, `.gitignore` (consolidate env templates).
**Acceptance:** `npx expo-doctor` passes all checks; `npm run lint` warnings <30.

#### E4. RELEASE_READINESS.md
**Action:** Document env setup, deploy steps, rollback.
**Files:** `docs/RELEASE_READINESS.md`.
**Acceptance:** Fresh-clone setup documented; demo + Supabase paths documented as runtime-untested.

---

## 2. Documentation gap-fill (parallel)

The following docs from the master prompt PART 22 are **already present** and should not be duplicated:
- `PROJECT_AUDIT.md` ✓ / `PRODUCT_REQUIREMENTS.md` ✓ / `COMPETITIVE_RESEARCH.md` ✓ / `IMPLEMENTATION_ROADMAP.md` ✓ / `quality-reports/QUALITY_REPORT.md` ✓ / `design-system/MASTER.md` ✓ / `docs/ui-redesign/DESIGN_CONTRACT.md` ✓ / `docs/product/ROLE_MATRIX.md` ✓ / `docs/product/PATIENT_INFORMATION_ARCHITECTURE.md` ✓ / `docs/product/STAFF_INFORMATION_ARCHITECTURE.md` ✓ / `docs/design/PROJECT_UI_AUDIT.md` ✓

The following are **missing** and must be created:

| Doc | Priority | Notes |
|---|---|---|
| `docs/PROGRESS.md` | P0 | Current phase, completed work, open decisions, next action |
| `docs/KNOWN_ISSUES.md` | P0 | From audit §6 findings (double-booking race, `any` boundary, polling, env duplication) |
| `docs/USER_JOURNEYS.md` | P1 | Map intake→chair→chart→estimate→invoice→payment→recall workflows |
| `docs/PRODUCT_INFORMATION_ARCHITECTURE.md` | P1 | Consolidate STAFF_IA + PATIENT_IA into one IA doc |
| `docs/MODULE_SPECIFICATIONS.md` | P1 | Per-module spec: problem, users, data model, permissions, states |
| `docs/DESIGN_SYSTEM.md` | P1 | Consolidate MASTER.md + DESIGN_CONTRACT.md into single source |
| `docs/TYPOGRAPHY_SYSTEM.md` | P2 | From `design-system/typography.ts` + DESIGN_CONTRACT.md §Typography |
| `docs/MOTION_DESIGN_SYSTEM.md` | P2 | From `design-system/motion.ts` + MASTER.md §Motion |
| `docs/SCROLLING_GUIDELINES.md` | P2 | From `src/ui/components/Screen.tsx` shell geometry |
| `docs/PIXEL_PRECISION_AUDIT.md` | P2 | Route-by-route visual audit (E2 deliverable) |
| `docs/VISUAL_ASSET_GUIDELINES.md` | P2 | Asset inventory: icons (lucide only), images, illustrations |
| `docs/DEPENDENCY_DECISIONS.md` | P1 | Per-dependency: reason, compatibility, trade-offs |
| `docs/SECURITY_REVIEW.md` | P1 | From audit §15 + quality-reports/security.json + RLS review |
| `docs/PERFORMANCE_REPORT.md` | P1 | Baseline + post-change measurements (E1 deliverable) |
| `docs/RELEASE_READINESS.md` | P0 | Env setup, deploy steps, rollback (E4) |

---

## 3. Execution order

1. **Documentation scaffolding** (parallel, low-risk): PROGRESS.md, KNOWN_ISSUES.md, DEPENDENCY_DECISIONS.md, SECURITY_REVIEW.md. These ground decisions.
2. **Track A** (correctness before polish): A3 (retire `any`) → A4 (poll gating) → A2 (immutability test) → A5 (GST) → A6 (duplicate-patient UX) → A1 (runtime verify R4 if Docker becomes available).
3. **Track B** (screen polish): B2, B3, B4, B5, B6, B1 (after A1).
4. **Track C** (engagement): C4 (copy) → C1 (WhatsApp truth) → C2 (recall automation) → C3 (portal lifecycle).
5. **Track D** (AI): D1 (verify) → D2 (note drafting) → D3 (contract).
6. **Track E** (QA): E3 (lint + expo-doctor) → E1 (synthetic data) → E2 (route QA) → E4 (release readiness).
7. **Remaining docs**: USER_JOURNEYS.md, MODULE_SPECIFICATIONS.md, DESIGN_SYSTEM.md, TYPOGRAPHY_SYSTEM.md, MOTION_DESIGN_SYSTEM.md, SCROLLING_GUIDELINES.md, PIXEL_PRECISION_AUDIT.md, VISUAL_ASSET_GUIDELINES.md, PERFORMANCE_REPORT.md, PRODUCT_INFORMATION_ARCHITECTURE.md, RELEASE_READINESS.md.

After each milestone: run `npm run verify` (tsc + lint + test + audit + web export), update `docs/PROGRESS.md`, commit if safe.

---

## 4. Validation commands

```bash
npm ci                      # restore deps if node_modules incomplete
npx tsc --noEmit            # typecheck (strict, noUncheckedIndexedAccess)
npm run lint                # 0 errors expected; track warning count
npm test                    # 14 domain + 16 access + 2 AST guards
npm run audit               # 8 Python static-analysis audits
npx expo export --platform web   # web bundle verification
```

**Cannot run in this environment:** `supabase db reset` (no Docker), `eas build` (no credentials), live Supabase queries (no service-role key). All must be documented as runtime-untested in deliverables.

---

## 5. Risks & mitigations

| Risk | Mitigation |
|---|---|
| R4 cannot be runtime-verified (no Docker) | Static SQL gate + migration review pass; document Docker requirement clearly |
| GST changes modify DB schema | Use additive migration with `NOT NULL` defaults; demo mode must still work without re-migration |
| Retiring `any` may surface type errors | Use zod parsing at boundary; typecheck gates every step |
| A4 poll gating may break data freshness | Only gate on non-foreground state; resume with refetch on focus |
| AI features risk clinical misrepresentation | Enforce "review-required, source-links, no autonomous diagnosis" per COMPETITIVE_RESEARCH.md Part 2 |
| Lint warning reduction may introduce churn | Scope to style-tier warnings (unused vars, array-type notation); no runtime changes |

---

## 6. Open questions (resolved by existing docs, not re-asked)

- **Demo vs Supabase mode:** `src/repositories/index.ts` auto-selects `demoRepository` when `env.demoMode`. Tests run against demo. No question needed.
- **Font choice:** `design-system/typography.ts` uses native system face with `Platform.select`. Geist is the reference face but not bundled. No question needed.
- **5-tab navigation:** Locked: Today, Patients, Calendar, Inbox, More. No question needed.
- **Dark mode:** Light as default; dark remaps accents via `darkDerivatives`. No question needed.
- **Gradients:** Forbidden by DESIGN_CONTRACT.md. No question needed.

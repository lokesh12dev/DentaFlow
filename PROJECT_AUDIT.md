# DentalFlow 2 — Phase 1 Repository Audit

Audited: 2026-10-30 (Phase 1)
Working directory: `/Users/m.lokesh/dentalflow 2` — Git branch `main`, up to date with `origin/main`.
Scope: verified inspection of configuration, routing, data layer, backend, tests, and pending work. No data, migrations, or user work were destroyed or modified beyond the two minimal, documented repairs listed below.

---

## 1. Record of the pre-existing state (protected work)

At audit start the repository contained **uncommitted user work** (never overwritten by this audit):

| Area | File(s) | Nature of pending work |
| --- | --- | --- |
| Domain analytics | `src/domain/rules.ts` (+112 lines) | New pure-function engine `buildClinicAnalytics()` with windowed metrics, documented metric definitions, and a `analyticsWindow()` helper. Includes executable domain tests. |
| Permission tests | `scripts/run-access-tests.mjs`, `scripts/run-domain-tests.mjs` | 5 new negative permission checks; 1 new analytics end-to-end test with expected values. |
| Navigation | `src/navigation/RoleGuard.tsx` | Replaced opaque redirect with an explicit `AccessDeniedState` (visible, explained permission failure). |
| UI a11y polish | `Button.tsx`, `Field.tsx`, `Feedback.tsx`, `GlassTabBar.tsx` | Focus rings on keyboard focus, reduced-motion-aware skeleton, `AccessibilityInfo` wiring, larger touch targets on icon buttons, tablist/tab semantics. |
| Configuration | `app.json` (web output static→single), `design-system/tokens.ts` (textMuted contrast bump) | Pending, apparently intentional. |
| Regenerated reports | `quality-reports/*.json`, `QUALITY_REPORT.md` | Timestamp/metric refresh with new file sizes. |
| Untracked | `DENTAFLOW_COMPLETE_BUILD_PROMPT.md` | Prompt document (43 KB). Left untouched. |

This audit **preserved all of the above** and made two repairs that were required to make the baseline runnable (see §7).

---

## 2. Verified stack

| Layer | Technology | Evidence |
| --- | --- | --- |
| Mobile/web client | Expo SDK 57, React Native 0.86.2, React 19.2.3, Expo Router | `package.json`, `app/_layout.tsx` |
| Language | TypeScript ~6.0.3, strict | `tsconfig.json`; `tsc --noEmit` passes |
| Server state | TanStack Query ^5.85, Zustand ^5 | `src/hooks/useClinicQueries.ts`, `src/store/*` |
| Backend | Supabase (PostgreSQL), 7 migrations, RLS everywhere, 12 Edge Functions | `supabase/` |
| Forms/validation | react-hook-form, zod ^4, custom domain rules | `src/domain/validation.ts`, `domain/rules.ts` |
| Lists | `@shopify/flash-list` (4 usages) | grep evidence |
| Icons | `lucide-react-native` via shared `AppIcon` | `src/ui/icons.ts` |
| Local database | Expo SQLite with SQLCipher plugin (`app.json` config present) and offline-PHI rejection boundary | `src/core/localDb.ts`, audit script assertions |

Package totals: 861 packages restored by `npm ci` (node_modules had been incompletely installed — see §7).

---

## 3. Architecture assessment — verdict: **UPGRADE, do not rebuild**

The foundation is sound and unusually disciplined for this stage. A rewrite would destroy verified value.

**Verified working (inspected, not assumed):**
1. **Backend completeness.** 30 tables covering the full clinical/financial surface (clinics, members, branches, chairs, patients, procedure_types, appointments, communications, tasks, clinical_notes, clinical_media, tooth_records, treatment_plans(+items), invoices(+items), payments, consents, prescriptions(+items), lab_cases, inventory_items, automation_rules, message_templates, device_tokens, integration_connections, webhook_events, outbox_events, audit_logs). Migrations in `supabase/migrations/202608030001…0007`.
2. **Security posture.** RLS enabled on every patient-facing table (`202608030002_rls_and_audit.sql`, policies per table); `is_clinic_member` / `has_clinic_role` helpers; audit trigger writes immutable rows; storage policies for private clinical media. Edge Functions auth (`functions/_shared/auth.ts`) validates the user JWT against the user-scoped client, then verifies clinic membership and role **before** any service-role use. Webhook signature validation for Twilio exists; AI function carries de-identification and review flags.
3. **Transactional RPC boundary.** Multi-table workflows (intake, appointment booking, payments, refunds, stock movements, consent signing, portal tokens) run inside `security definer` PL/pgSQL with pinned `search_path`, role checks, `for update` locking for payments, and duplicate-patient detection (name+normalized phone) at `create_patient_intake`.
4. **Repository pattern.** `clinicRepository` interface (≈50 typed operations) with two implementations: `supabaseRepository` (real client code, safe search sanitization, row mapping) and `demoRepository` (synthetic snapshot, selected automatically only when Supabase env is absent and env≠production). No mock data reaches the production path — `assertProductionConfiguration()` throws if production runs without configured env.
5. **Client architecture.** 65 route files across `(auth)`, `(tabs)` (exactly 5 tabs: Today, Patients, Calendar, Inbox, More), `(modules)`, and task-scoped routes (`appointment/new`, `patient/[id]`, `payment/new`, `treatment/new`, `consent/sign`, etc.). All screens go through `RoleGuard` permission checks, shared `Screen`/`AppShell`/`CommandPalette`, and typed React Query hooks with cache invalidation.
6. **Design system.** Tokens in `src/ui/tokens.ts` + `design-system/` (typography, spacing, radii, elevation, motion) with page contracts in `design-system/pages/*.md`; explicit light/dark themes; raw-text-node and icon guards enforced by `npm test`.
7. **Offline/PHI boundary.** Local SQLite uses SQLCipher key + an offline mutation allowlist that rejects storing PHI offline (`src/core/localDb.ts`; enforced by `scripts/audit_security.py`).
8. **Quality gates are real.** `npm test` = 14 domain tests + 16 permission tests + 2 AST guards; `npm run audit` runs 8 Python static-analysis audits (SQL-safety, runtime contracts, data model, architecture, security incl. RLS/secret/PHI checks, UX, usability, performance) — **all pass** (1 low severity note: `src/domain/types.ts` at 644 lines).

**Partially implemented / mid-flight (honest status of pending work):**
- `buildClinicAnalytics()` is implemented **and tested**, but **no screen consumes it yet** — `ReportsScreen.tsx` still computes its own metrics inline with different formulas (e.g., collections = sum of paid vs engine's net-of-refunds; no windowing; no denominator doc). Wiring the screen + dashboard to the engine is the immediate unfinished step.
- RoleGuard's new `AccessDeniedState` is wired and typechecks; effective route coverage for every guarded module was verified for the permission model itself (16 access tests) but not yet exercised in a live authenticated runtime.

**Not verified here (requires live credentials/runtime — recorded, not claimed):**
- Real Supabase project behavior (auth flows, RLS action under concurrent users), Edge Function deployments, provider messaging delivery, EAS builds, push notifications. Nothing in this audit asserts these work; they require the credential setup in `RELEASE_READINESS.md`.

**Known correctable weaknesses (evidence-based):**
1. Appointment double-booking prevention is a check-then-act SELECT inside the booking RPC, not a database `EXCLUDE` constraint. Under two concurrent booking calls the check can race; add a bounded partial exclusion constraint (index `WHERE status NOT IN ('cancelled','no-show')`) on `(clinic_id, doctor_member_id, starts_at, ends_at)` with `tstzrange` and on chair, then keep the friendly error from the RPC. Low probability at single-clinic loads; high value for correctness claims.
2. `supabaseRepository` row normalization uses `Record<string, any>` casts at the DB boundary (`normalizeAppointment`, `normalizeTask`, etc.). This is the one place `any` exists; it is a defensible boundary cast but should become typed row shapes or zod-parsed outputs to satisfy the project's own zero-any law.
3. Polling intervals: dashboard every 60s, communications every 45s regardless of focus/visibility (`useClinicQueries.ts`). On mobile this costs battery; gate polls on app state/focus or switch to targeted invalidation.
4. Screen files use a very dense single-line style (e.g., `ReportsScreen.tsx`). Compiles and lints fine, but hurts review; normalizing formatting is low risk.
5. Duplicate env templates (`.env.example` and `env.example`, differing content) and `patient-portal/config.js` committed with placeholders (safe — no secrets — but it differs from `config.example.js` and invites accidental secret commit; add a gitignore entry and runtime fallback).
6. Expo Doctor reports 22 SDK-57 packages behind expected patch versions (`expo-sqlite` check fails): `~57.0.1` vs `~57.0.4` etc. App builds and exports fine today; alignment (`npx expo install --check --fix`) is scheduled for the next phase, deliberately not done mid-audit.
7. Lint: 0 errors, 54 warnings (style-tier: unused vars, array-type notation, one `require()` import in `Badge.tsx`).

---

## 4. Route inventory and classification

- `(auth)`: sign-in, create-clinic — onboarding entry points.
- `(tabs)`: today, patients, calendar, inbox, more — primary shell; five-tab contract respected.
- `(modules)`: audit, automations, billing, branches, integrations, inventory, laboratory, recalls, reports, settings, tasks, team, templates, treatment-pipeline, waiting-room — role-gated operations.
- Task routes: appointment/[id]/new, automation/new, branch/pricing, clinical/{consent,note,prescription}, communication/new, consent/{[id],withdraw}, family/index, inventory/{item,movement}, laboratory/new, patient/{[id],new}, payment/{new,refund}, setup/credentials, task/new, team/{[id],invite}, template/new, treatment/new.
- `booking-requests.tsx` and patient-links (portal) round out external flows.

Every route file compiled during `npx tsc --noEmit` and the web export; classification by runtime behavior against a live backend is scheduled for Phase 4 verification.

## 5. Documentation already present (do not duplicate blindly)

`design-system/MASTER.md` + page contracts, `docs/design/PROJECT_UI_AUDIT.md`, `docs/product/{ROLE_MATRIX, PATIENT_INFORMATION_ARCHITECTURE, STAFF_INFORMATION_ARCHITECTURE}.md`, `docs/ui-redesign/{BASELINE_AUDIT, DESIGN_CONTRACT, IMPLEMENTATION_STATUS, V2_EXECUTION_PLAN, VISUAL_QA}.md`, `quality-reports/*`. The Phase-2+ artifacts required by this program (competitive research, product requirements, roadmap, security review, quality report, integrations, release readiness) will be added under `docs/` and kept updated rather than duplicated.

## 6. Verification commands actually run

| Command (`npm run …`) | Result |
| --- | --- |
| `npm ci` | 861 packages restored, 15s (repairs incomplete node_modules) |
| `npx tsc --noEmit` | **PASS** (1 error found pre-fix, fixed — see §7) |
| `npm run lint` | PASS — 0 errors, 54 warnings |
| `npm test` | PASS — domain 14/14, access 16/16, raw-text guard PASS, icon guard PASS |
| `npm run audit` | PASS — gate PASS; 0 critical/high/medium, 1 low |
| `npx expo export --platform web` | PASS — web bundle exported to `dist/` |
| `npx expo-doctor` | 20/20 checks except dependency version drift (expo-sqlite era) |

Not run (no credentials available): native EAS builds, Supabase runtime, Edge Function deploy.

## 7. Changes made during the audit (both were necessary, both recorded)

1. **Restored dependency tree** with `npm ci` (lockfile-pinned; no version changes). Reason: `eslint` and other packages were missing from the partially-installed `node_modules`, which the repo was distributed with (source zip present at repo root). This failed both `npm run lint` and any local eslint invocation.
2. **Removed `invalid` from `accessibilityState` in `src/ui/components/Field.tsx`.** Reason: React Native 0.86's `AccessibilityState` type supports only `disabled/selected/checked/busy/expanded`; the pending user change introduced `invalid: Boolean(error)` producing the sole `tsc` failure. The error state remains fully conveyed by the visible error text and `accessibilityHint`. This unblocks `verify` for all subsequent phases.

## 8. Phase 2+ entry point

Highest-value, evidence-backed next steps (in order):
1. Wire the tested `buildClinicAnalytics` engine into Reports (and dashboard) with window controls and definition footnotes; replace ad-hoc metric math. *(finishes in-flight work; zero risk)*
2. Add bounded exclusion constraints for doctor/chair conflicts and a regression test path for booking race behavior.
3. Query-layer hardening: gate polling by focus/visibility; typed DB row shapes to retire the boundary `any`.
4. Version alignment (`expo install --check --fix`) + lint warning reduction, then re-run the full gate.
5. Competitive research + product requirements (Phase 2 deliverables) to steer the clinical scope before deeper feature work.

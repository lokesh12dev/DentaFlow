# DentaFlow 2 — Release Readiness

**Last updated:** 2026-10-30
**Status:** Ready for staging review (not production)

---

## Release status

**Not ready for production.** Ready for staging review with the following caveats.

---

## Release criteria

| Criterion | Status | Notes |
| --- | --- | --- |
| All quality gates pass | PASS | `tsc`, `eslint`, `npm test`, `npm run audit`, `expo export` |
| Data integrity (R4) | Partial | Migration written; runtime verification requires Docker |
| Signed-record immutability (R8) | PASS | Domain tests + SQL trigger verified |
| GST correctness (R5) | PASS | Schema + domain rule + demo data (UI pending) |
| Duplicate-patient UX (A6) | PASS | Friendly error + resolution path |
| Poll gating (A4) | PASS | AppState-based focus gating |
| `any` type retirement (A3) | PASS | Zero `any` in supabaseRepository |
| Lint warnings <30 | PASS | 16 warnings (down from 54) |
| Documentation complete | Partial | Core docs present; user-facing docs pending |

---

## Environment setup

### Development (demo mode)
```bash
npm ci
EXPO_PUBLIC_ENABLE_DEMO_MODE=true npx expo start
```
No credentials required. All data is synthetic.

### Development (Supabase mode)
```bash
npm ci
EXPO_PUBLIC_ENABLE_DEMO_MODE=false
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
npx expo start
```
Requires Supabase project with migrations applied (`supabase db reset`).

### Production build
```bash
npx expo export --platform web    # Web preview
eas build                         # Native builds (requires EAS credentials)
```

---

## Rollback procedure

1. Revert to previous git commit
2. Run `npm ci` to restore dependencies
3. Re-run migrations if schema changed (`supabase db reset`)
4. Verify quality gates pass

---

## Known limitations

| Limitation | Impact | Mitigation |
| --- | --- | --- |
| R4 runtime verification not performed | Booking double-booking race under concurrent load | Static SQL gate passes; document Docker requirement |
| No live-backend testing | Cannot verify RLS policies against real Supabase | Static analysis of migration SQL |
| No native build verification | Cannot verify iOS/Android build | Web export passes; Expo SDK compatibility verified |
| GST UI not yet implemented | Invoice GST breakdown not rendered on screens | Schema + domain rule complete; UI in Track B |
| C2/C3 not implemented | Recall automation and portal link lifecycle pending | Backend work required (RPC/Edge Function) |

---

## Go/no-go decision

**NO-GO for production.** The following must be completed before production release:

1. Runtime verification of R4 booking constraints (requires Docker)
2. GST UI rendering on BillingScreen and PatientProfileScreen finance tab
3. User-facing documentation (patient consent forms, staff training)
4. Production security review with live Supabase credentials
5. Native app build testing (iOS/Android via EAS)

**GO for staging review.** All quality gates pass; core correctness work complete; documentation in place.

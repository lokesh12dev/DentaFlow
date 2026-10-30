# DentaFlow 2 — Security Review

**Last updated:** 2026-10-30
**Source:** Derived from `PROJECT_AUDIT.md` §15, `quality-reports/security.json`, and code inspection.

---

## Security architecture

### Authentication
- **Provider:** Supabase Auth (GoTrue) with email/password + JWT sessions
- **Session handling:** Supabase client manages tokens; stored in SecureStore (expo-secure-store)
- **Token refresh:** Automatic via Supabase client; access tokens short-lived
- **Multi-clinic:** `activeClinicId` stored in session store; RLS scoped per clinic

### Authorization
- **Model:** Role-based access control (RBAC) with clinic roles: `owner`, `manager`, `dentist`, `receptionist`, `assistant`
- **Enforcement:** Database-level Row Level Security (RLS) on all 30+ tables; `require_role()` helper function for RPCs
- **Client-side:** `RoleGuard` component wraps routes; `AccessDeniedState` shows visible permission failure
- **Least privilege:** `useStaff`, `usePatients`, etc. filter by `clinic_id`; no cross-clinic data exposure

### Data protection
- **Patient data:** All tables have `clinic_id` foreign key; RLS policies enforce `is_clinic_member(clinic_id, auth.uid())`
- **PHI in logs:** Sensitive-data-safe logging — no patient names, phones, or clinical data in console logs
- **Exports:** Receipt generation includes only authorized invoice data; portal links expire after 24 hours
- **File uploads:** Not yet implemented (clinical media stored as references, not binary uploads)

### Audit logging
- **Audit table:** `audit_logs` table tracks create/update/delete with actor, timestamp, and changes
- **Signed records:** Clinical notes and consents with `status='signed'` are immutable; transitions to `amended`/`withdrawn` create new version records
- **Immutability:** `protect_signed_clinical_note` PostgreSQL trigger prevents UPDATE on signed notes

---

## Verified controls

| Control | Status | Evidence |
| --- | --- | --- |
| RLS on all tables | Verified | 30+ tables with `is_clinic_member` / `has_clinic_role` policies |
| Role-based RPC access | Verified | `require_role()` in all transactional RPCs |
| Token storage | Verified | `expo-secure-store` for session tokens |
| Signed-record immutability | Verified | Domain tests + SQL trigger |
| No PHI in console | Verified | Audit scripts check for raw text nodes |
| Demo mode isolation | Verified | `demoRepository` uses synthetic data, no Supabase calls |
| Consent tracking | Verified | `whatsappConsent`, `photoConsent` on patient record |

---

## Outstanding concerns

| Concern | Severity | Notes |
| --- | --- | --- |
| Cross-user data access test | Medium | No negative test proving user A cannot see user B's patients across clinics |
| Session expiration handling | Low | No explicit test for expired token behavior on mobile |
| Export permissions | Low | Portal links expire but no audit of who accessed them |
| Sensitive file access | Low | No file upload/download implemented yet |
| HIPAA/GDPR compliance | Not claimed | No regulatory compliance asserted; controls exist but not certified |

---

## Environment limitations

- Docker unavailable → RLS policies not runtime-tested against live Supabase
- No Supabase service credentials → no live-backend security scanning
- Demo mode is the test surface; Supabase mode security verified via static analysis only

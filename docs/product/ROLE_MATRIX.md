# DentaFlow Clinic role matrix

Status: locked for staff application v1. The database value `manager` is the clinic administrator role in product copy.

## Product boundary

- DentaFlow Clinic is for staff. It never exposes a patient login or asks a signed-in member to choose a role.
- DentaFlow Patient is a separate experience and receives only patient-owned or clinic-approved information.
- Identity, clinic membership, branch scope and role come from the backend. UI permissions improve clarity; database policies remain the security boundary.

## Roles and default workspace

| Role | Today title | First responsibility | Default primary action |
|---|---|---|---|
| Receptionist | Today | Arrivals, waiting room, calls, bookings, intake | New appointment |
| Dentist | Your day | Assigned patients, chair state, warnings, notes, follow-ups | Add clinical note |
| Assistant | Chair prep | Assigned chairs, consent, media, laboratory hand-offs | Open waiting room |
| Billing | Collections | Invoices, payments, overdue balances, receipts, refunds | Record payment |
| Clinic administrator (`manager`) | Clinic pulse | Team, branches, operations, reports, integrations | New appointment |
| Owner | Clinic pulse | Full clinic oversight, governance and configuration | New appointment |

## Capability matrix

Legend: **M** manage, **W** work/update, **R** read, **—** unavailable.

| Capability | Reception | Dentist | Assistant | Billing | Admin | Owner |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Patient directory and demographics | W | R | R | R | M | M |
| Appointment calendar | M | W | W | R | M | M |
| Waiting room and chair flow | M | W | M | R | M | M |
| Communications and booking requests | M | W | W | W | M | M |
| Clinical notes and dental chart | — | M | W | — | R | R |
| Prescriptions | — | M | — | — | R | R |
| Consent and clinical media | W | M | M | — | R | R |
| Treatment plans | R | M | W | R | M | M |
| Billing, payments and receipts | W | R | — | M | M | M |
| Refunds | — | — | — | M | M | M |
| Recall | M | W | W | W | M | M |
| Laboratory | R | M | M | — | M | M |
| Inventory | — | R | M | — | M | M |
| Tasks | W | W | W | W | M | M |
| Reports | — | R | — | M | M | M |
| Team and role administration | — | — | — | — | M | M |
| Branches, procedures and pricing | — | — | — | — | M | M |
| Automations and integrations | — | — | — | — | M | M |
| Audit log | — | — | — | — | R | M |
| Clinic settings | — | — | — | — | M | M |

## Clinical visibility rules

- Reception and billing can see a concise safety flag needed to coordinate care, but not clinical note bodies, dental charting or unapproved media.
- Assistants can read and draft clinical material needed for chairside work; signing notes and prescribing remain dentist-only actions.
- Administrators and owners can inspect clinical records for governance and operations but cannot author a dentist signature or prescription unless they also hold a clinician credential. This v1 role model does not combine roles, so those actions remain unavailable.
- All patient-record reads, exports, edits, signatures, payments and refunds must be audited.
- Hidden controls are not authorization. Repository/RPC/RLS checks must enforce the same matrix.

## Branch scope

- Every membership has an active clinic and may have one or more permitted branches.
- A branch-scoped member sees patients and operational queues for the active branch, with explicit branch switching only when granted.
- Owners and administrators can receive multi-branch access. Reports must state the selected branch or “All branches.”
- Deep links that target an inaccessible clinic, branch or module resolve to an access-denied screen and never leak record existence.

## Route-guard behavior

1. No session: route to sign-in.
2. No clinic membership: route to invitation/create-clinic resolution.
3. No branch access: route to branch selection or access denied.
4. Missing module capability: replace with More and show “You don’t have access to that area.”
5. Missing record capability: show access denied without fetching restricted content.

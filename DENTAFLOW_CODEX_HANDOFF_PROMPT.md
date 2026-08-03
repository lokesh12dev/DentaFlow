# DentaFlow Codex Production Completion Prompt

Open the extracted `dentaflow-production` repository as the working directory. Act as the lead production engineer. Do not return only an audit or plan: inspect, modify, run, test, and finish the application.

## Goal

Complete the React Native + Expo + Supabase dental practice platform so the owner only needs to create a Supabase project, enter public mobile credentials and private provider secrets, apply migrations, deploy Edge Functions, configure webhooks, and run EAS builds.

## Required work

1. Verify every existing implementation claim directly from source and runtime.
2. Install dependencies and repair package, Expo Router, Metro, Babel, TypeScript, EAS, and native configuration failures.
3. Run and pass typecheck, lint, unit tests, integration tests, Expo Doctor, Expo export, Android preview build, and production build where credentials allow.
4. Preserve exactly five primary tabs: Today, Patients, Calendar, Inbox, More.
5. Keep the premium solid-colour clinical design: no decorative gradients, no emoji icons, no generic AI cards, restrained glass only for floating navigation/sheets, Lucide icons, consistent typography/radii/spacing, dark mode, accessibility, loading/empty/error/offline states.
6. Wire all screens to real repository/service/database actions. Remove placeholder buttons, mock IDs, fake delivery states, fake metrics, and silent catches.
7. Complete Supabase Auth, clinic onboarding, staff invitations, branch roles, tenant-safe RLS, secure storage, database functions, audit logs, and production credential validation.
8. Complete patient intake, patient command centre, medical alerts, timeline, tooth chart, clinical notes, signed-note immutability, media/audio/OCR, doctor-reviewed AI, treatments, consent, prescriptions, lab cases, billing, refunds, receipts, family accounts, recalls, inventory, reports, and branches.
9. Complete the four-step booking flow, doctor/chair conflict detection, branch pricing, appointment lifecycle, waiting room, rescheduling, cancellation, no-show, follow-up, reminders, and public booking requests.
10. Complete unified communications for calls, WhatsApp, SMS, email, internal notes, missed calls, callbacks, provider IDs/status webhooks, retries, and truthful native fallback behavior.
11. Keep all provider secrets server-side in Supabase Edge Functions. OpenRouter must use minimum necessary clinical context, deny data collection where supported, preserve sources, and never diagnose, prescribe, or finalize records without clinician approval.
12. Complete the patient portal for public booking, intake, confirmation, cancellation, and reschedule requests using expiring hashed tokens.
13. Use pagination, virtualized lists, server aggregation, stable cache invalidation, compressed thumbnails, bounded queries, and suitable indexes.
14. Add executable tests for appointment transitions, conflicts, role permissions, invoices, refunds, stock movements, consent/note immutability, branch pricing, duplicate patients, source-linked history, authentication, patient intake, booking, clinical visit, payment, communication, recall, lab, inventory, and portal workflows.
15. Run and extend the Python/Node quality scripts. The quality gate must fail for missing RLS, client secrets, unsafe SECURITY DEFINER functions, empty handlers, placeholder actions, gradients, emoji icons, >5 primary tabs, missing route/error states, unbounded queries, missing indexes, mutable signed records, missing idempotency, TypeScript/test/build failures.

## Mandatory validation commands

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run verify
npx expo-doctor
npx expo export
python3 scripts/run_all_audits.py
```

Run EAS Android preview and production builds when the account/project credentials are available. Do not claim a build succeeded unless the command actually succeeded.

## Completion rules

Do not weaken RLS, expose service keys, store PHI in plaintext, broadly use `any`, hide errors, use mock data in production, or treat opening WhatsApp/email as delivered. Signed notes and signed consent must be immutable and amended through versioned records. Payments, refunds, provider sends, stock movements, and public-token operations must be transactional and idempotent.

At the end report: implemented systems, serious fixes, exact commands and results, build output, credentials still required, external account steps, known limitations, and evidence-based readiness scores for UI/UX, wiring, backend, security, performance, accessibility, tests, and deployment.

# DentaFlow Download Index

## Recommended primary download

- `dentaflow-production-source.zip` — Latest production-oriented React Native/Expo application, Supabase backend migrations, Edge Functions, patient portal, environment templates, test scripts, and quality reports.
- `dentaflow-production-source.zip.sha256` — SHA-256 checksum for verifying the production archive after download.

## Visual preview

- `dentaflow-preview.png` — Latest available DentaFlow interface preview.

## Earlier standalone prototype archive

- `dentaflow-react-native-source.zip` — Earlier local-first React Native prototype. Retained for reference; use the production archive for continued development.
- `dentaflow-react-native-source.zip.sha256` — Checksum for the earlier archive.

## Main configuration and guides

- `dentaflow-production/.env.example` — Public mobile environment variables and provider credential names.
- `dentaflow-production/quality-reports/QUALITY_REPORT.md` — Human-readable audit and validation report.
- `dentaflow-production/quality-reports/quality-summary.json` — Machine-readable quality summary.

## Supabase backend

- `dentaflow-production/supabase/migrations/` — Seven ordered SQL migrations for schema, RLS, audits, RPCs, storage, portal, finance, inventory, governance, and provider transactions.
- `dentaflow-production/supabase/functions/` — Edge Functions for OpenRouter, WhatsApp, email, SMS, telephony, public booking, patient links, patient intake, appointment responses, staff invitations, integration health, and provider webhooks.
- `dentaflow-production/supabase/seed.sql` — Development seed data.

## Patient portal

- `dentaflow-production/patient-portal/` — Static patient-facing portal for booking requests, intake, confirmation, cancellation, and rescheduling.

## Quality and performance assets

- `dentaflow-production/scripts/` — Python and Node validation scripts.
- `dentaflow-production/quality-reports/architecture.json`
- `dentaflow-production/quality-reports/security.json`
- `dentaflow-production/quality-reports/sql-safety.json`
- `dentaflow-production/quality-reports/data-model.json`
- `dentaflow-production/quality-reports/ux.json`
- `dentaflow-production/quality-reports/usability.json`
- `dentaflow-production/quality-reports/performance.json`
- `dentaflow-production/quality-reports/runtime-contracts.json`
- `dentaflow-production/quality-reports/synthetic-performance.json`
- `dentaflow-production/quality-reports/synthetic-usability.json`

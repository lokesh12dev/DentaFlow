# DentaFlow — complete product and app build prompt

Copy everything from **BEGIN PROMPT** through **END PROMPT** into the coding agent you want to build or continue this project.

---

## BEGIN PROMPT

Act as the lead product engineer, product designer and application architect for **DentaFlow**. Build a complete, reliable dental-practice operating system for clinic staff, plus a strictly separated patient portal. This is a real product implementation brief, not a request for a mockup or a plan. Inspect the repository first, preserve useful existing code, implement the product end to end, run the available checks, and leave a runnable, reviewable result.

### 1. Product identity and boundaries

**Product:** DentaFlow — a calm, precise operating system for a dental clinic. It connects each patient’s administrative, clinical and financial journey: appointment request, booking, check-in, chairside care, records, treatment, consent, billing, follow-up and recall.

**Staff users:** receptionist/front desk, dentist, dental assistant, billing staff, clinic administrator (`manager` in the database; show “Clinic administrator” in product copy) and owner. The staff app is a shared workspace whose priorities and permitted actions adapt to the signed-in member’s role and branch.

**Patients and caregivers:** use a separate patient experience. The patient portal must never render the staff navigation or expose internal notes, another patient, internal operational data, unapproved documents, hidden treatment margins, staffing/chair details or clinic reports. Sharing data models or brand tokens does not share authorization.

**Product promise:** reduce the scanning and coordination burden in a busy clinic. Keep the next safe action obvious; show safety, clinical and financial state accurately; make the full patient journey traceable.

**Brand and voice:** write `DentaFlow` as one word. Use direct, calm, confident language. Staff copy may use clinical terms and FDI tooth numbers. Patient copy is warm, plain language and explains care without clinical jargon. Use sentence case, no emoji, no gratuitous exclamation marks and no generic “AI dashboard” content. Use an en dash for ranges and a middle dot for related metadata where appropriate. Never claim an external message, payment, booking or upload succeeded until the provider or database confirms it.

### 2. Repository and source-of-truth rules

For an existing repository, begin by reading `DENTAFLOW_CODEX_HANDOFF_PROMPT.md`, `DENTAFLOW_DOWNLOAD_INDEX.md`, `design-system/MASTER.md`, `design-system/pages/`, `docs/product/`, the Expo routes, domain types/rules, repository implementations, Supabase migrations/Edge Functions, patient portal and the quality scripts. Verify every product claim in source before relying on it. Do not trust a stale report or prototype over current code.

The production application is the React Native + Expo + TypeScript app under `app/` and `src/`, with Supabase under `supabase/`. `project-ui/` is a standalone design-system reference and click-through prototype; use it for visual reference, not as the production implementation or source of authorization.

Use **`design-system/tokens.ts` and `design-system/MASTER.md` as the current visual source of truth**, together with the locked role and information-architecture rules in `docs/product/`. Older imported prototype notes and `docs/ui-redesign/DESIGN_CONTRACT.md` contain earlier palette and layout decisions that conflict with the current production tokens. Do not create a second token system or resurrect stale navigation labels. The current five staff destinations are **Today, Patients, Calendar, Inbox, More**. Preserve the active branch, date, filters, searches and navigation state when moving between destinations.

Do not overwrite uncommitted user changes, secrets, project configuration or existing records. Do not add credentials or real patient data to source, prompts, screenshots, logs, tests or generated reports. Keep sample patient content fictional and explicitly demo-only.

### 3. Required platform and architecture

- Staff app: React Native, Expo SDK 57, Expo Router, strict TypeScript, iOS, Android and web. Follow the project’s installed Expo/React Native versions and config rather than upgrading dependencies without a concrete need.
- Existing architecture: route files in `app/`; features in `src/features/`; domain types, access and rules in `src/domain/`; TanStack Query hooks in `src/hooks/`; a `ClinicRepository` interface with demo and Supabase implementations in `src/repositories/`; secure/device services in `src/core/` and `src/services/`; Zustand UI/session stores; Supabase migrations and Edge Functions; separate static portal in `patient-portal/`.
- Validate forms at the boundary with Zod. Keep domain rules independent from UI components. Keep data fetching, cache invalidation and mutations in repository/hooks/services rather than hidden in visual components.
- Production configuration uses only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the app. Demo mode is for development/local QA and must never silently be active in production. Fail clearly when production credentials are missing or invalid.
- Provider secrets (OpenRouter, WhatsApp/Meta, Resend, Twilio and portal signing/rate-limit secrets) live only in Supabase Edge Function secrets. Never place service-role keys, vendor keys or signing secrets in Expo variables, the portal, browser storage or logs.
- The patient portal is a standalone, HTTPS-hosted HTML/CSS/JavaScript client. Configure its Functions base URL, public clinic slug, clinic name and support phone. It invokes protected Edge Functions; it must not access tables with privileged keys.
- Support encrypted, device-scoped secret/session storage; biometric re-entry and privacy settings where supported; encrypted local SQLCipher/SQLite cache; safe deep links and notification routing; truthful native fallback behavior when a provider is unavailable.

### 4. Visual and interaction system

Use the warm clinical-paper production identity and semantic tokens. Core light palette: canvas `#FBF9F6`, surface `#FFFFFF`, secondary surface `#F5F2EC`, tertiary surface `#EDE8DF`, ink `#14161A`, secondary text `#363A42`, readable muted text `#68727D`, border `#E1DCD1`, Enamel Teal `#1F6E66`, deep teal `#124540`, focus `#287E9A`, success `#237A52`, warning `#9A6412`, danger `#B74444`, information `#356C96`. Dark mode uses layered charcoal (`#11171C`, `#192127`, `#212B32`) and its own semantic surfaces. Do not use pure black text, neon state colors, gradients or colored left-edge decoration.

- Visual principle: **calm precision**. Solid content surfaces; restrained material/blur only on floating controls, navigation, sheets and transient overlays. Never stack glass on glass or place translucent material behind clinical text.
- Lucide is the only icon family. No emoji, Unicode symbol icons, decorative tooth art or improvised icon sets. Keep status understandable without color alone.
- Use platform system sans-serif for readable UI; tabular numerals for time, duration, currency, IDs, patient numbers and tooth codes. The design reference uses Geist for UI, Geist Mono for numeric data and rare Instrument Serif display moments; operational headings should remain direct and legible.
- Use the 4-point spacing system: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64. Standard radii: 6 inputs/buttons, 10 bounded content, 14 modals, 20 sheets, 24 floating controls and pill only for semantic capsules.
- Controls and icon buttons have at least 44×44 pt targets; forms are about 52 pt high. Provide visible keyboard focus on web, clear disabled/busy/error states, useful accessibility names/hints, and screen-reader announcements for async errors and success.
- Motion uses 120/180/260/400 ms as appropriate; no bounce or scale-on-press decoration. Respect OS reduced-motion preferences and do not animate skeletons when reduced motion is enabled.
- One primary task and at most one floating primary action per screen. Use dividers and whitespace for ordinary lists. Use cards only for bounded summaries, forms, distinct objects or interactive surfaces. Align headers, actions and content to consistent edges.
- Phone: one main column, 16–20 pt operational inset, floating bottom bar with five labeled destinations, sheet-based filters/quick work and content clearance for safe areas/FAB/navigation. Tablet: list/detail or schedule/resource split where useful. Web: accessible side rail, command search, centered clinical content canvas and persistent detail context where useful. Never stretch a dense phone layout across a desktop viewport.
- Validate at 360×800, 375×812, 390×844, 412×915, 430×932, tablet 768×1024 and 1024×768, and wide web 1280×900. Check safe areas, text scaling, keyboard use, overflow, final-row visibility, focus and dark mode.

### 5. Exact staff navigation and screen content

The five stable top-level tabs are exactly:

1. **Today** — role-specific work that needs attention now.
2. **Patients** — search, recent records and permitted patient actions.
3. **Calendar** — appointments, clinicians, chairs and availability.
4. **Inbox** — calls, messages, booking requests and staff follow-up.
5. **More** — permission-filtered secondary operations.

Keep tabs as destinations, never as actions. Detail pages push from their source list; short, focused tasks use sheets. Keep a single contextual primary action, filtered by role and permission. Hide inaccessible modules from navigation and still guard deep links.

#### Authentication and clinic entry — exact copy

- Sign-in brand eyebrow: `CLINIC WORKSPACE`; title: `Your clinic, in sync.`; supporting text: `Sign in to see today’s patients, priorities, and conversations in one place.`
- Fields: `Work email`, `Password`; recovery action: `Forgot password?`; primary action: `Sign in`; development-only action: `Open demo workspace`.
- Trust copy: `Private workspace for invited clinic staff` and `For dentists, assistants, front desk, billing, managers, and owners. Patients use the separate patient portal.`
- Clinic creation eyebrow: `NEW WORKSPACE`; title: `Set up your clinic.`; supporting text: `Start with the details staff and patients use every day. Branches, roles, pricing, and integrations come later.`
- Fields: `Clinic name`, `Clinic phone`, `Clinic email`, `City`; action: `Create clinic workspace`.
- Owner note: `Your first account becomes the clinic owner. Access can be changed later from Team.`
- Credential setup title: `Credential checklist`; state headline: `Production startup is blocked`; security heading: `Keep private keys on the server`; explanation: `Only the Supabase URL and publishable key belong in the mobile app. All service secrets belong in Supabase Edge Function secrets.`
- While bootstrap is unresolved, announce `Opening your secure clinic workspace…`.

The UI must not ask the user to choose a role. Route unauthenticated users to sign-in, then resolve membership/branch context before entering the workspace. Demo entry is visibly labeled and excluded from production.

#### Today — role-aware operational home

Use role-aware headings and order; do not show a generic KPI grid or generated dashboard narration.

| Role | Exact title | First priorities | Default action |
|---|---|---|---|
| Receptionist | `Today` | Next arrival, live clinic flow, calls and booking requests; then intake gaps, payments due and team hand-offs | `New appointment` |
| Dentist | `Your day` | Next patient, medical warnings and assigned schedule; then draft notes, clinical follow-ups and lab due | `Add clinical note` |
| Dental assistant | `Chair prep` | Next chair, room preparation, consent/media gaps; then lab hand-offs, stock alerts and tasks | `Open waiting room` |
| Billing | `Collections` | Collections, overdue accounts and payments in progress; then receipts/refunds, unbilled visits and billing tasks | `Record payment` |
| Clinic administrator (`manager`) / owner | `Clinic pulse` | Clinic pulse, exceptions and branch flow; then team capacity, reports, integrations and governance | `New appointment` |

Use the section labels `Live clinic flow`, `Needs attention` and `Team handovers`. The clear-state copy is `No urgent exceptions` and `Today’s clinic flow is on plan.`. The no-visit state is `No appointments today` with `Use New appointment to add the first visit.`. Show the next event and chronologically ordered operational appointments; give each visit a status and one valid next transition. Only show tasks relevant to the member or their oversight role. Route urgent exceptions to the exact workflow that resolves them.

#### Patients and patient command centre

Patients screen order: search, recent patients, relevant filters, direct patient directory. Search placeholder: `Search name, phone or patient ID`. Exact filters: `All`, `Medical alerts`, `Intake review`, `Balance due`, `Recall`, `Pending care`. Use section labels `Recently opened`, `Return to active records`, `Search results`, and `Patient directory`. Avoid duplicating recent patients in the main list. Each row prioritizes patient name, patient number/next event, one safety state, and balance only when permitted. Empty copy: `No patients match this view` and `Change the search or filter, or use Add patient.` The contextual action is `Add patient` where permitted.

Patient detail has exactly four primary sections: `Summary`, `Timeline`, `Clinical`, `Finance`. The command centre can contain demographics, preferred language/contact, family link, concise medical safety alerts and verification state, appointments, chronological source-linked timeline, notes, FDI tooth chart, clinical media with unmodified source, treatment plans and approvals, consent, prescriptions, laboratory cases, tasks, invoices, payments/receipts, communication history and permitted financial summary. Do not show clinical note bodies, dental chart, or unapproved media to reception/billing. Audit reads, exports, edits, signatures and financial actions.

Patient intake is a clear multi-step workflow. Keep these headings and instructions:

- `How should the clinic reach them?` — `Communication preference drives reminders, follow-ups, and fallback routing.`
- `Record safety-critical information` — `Reception can collect this information, but a clinician must verify it before treatment.`
- `Communication and media consent` — `Record only the permissions the patient actually grants. Consent can be withdrawn later.`
- Consent labels: `WhatsApp appointment communication` and `Clinical photography`.
- Consent descriptions: `Send booking confirmations, reminders, intake links, receipts, and requested follow-ups.` and `Allow clinical photographs to be stored in the protected patient record.`
- Explain: `This intake is saved as patient-reported information. DentaFlow keeps the verification state visible until a clinician confirms it.`
- `What happens next` — `The app creates a patient number, marks medical history for verification, and opens the patient command centre. Procedure-specific consent remains separate.`
- Actions: `Back`, `Continue`, `Create patient`.

Capture identity, DOB, gender, phone/email, preferred language/contact, emergency contact, allergies, conditions, medications, patient-reported/clinician-verified status, WhatsApp/photo/marketing permissions, address, family/dependent link and timestamps. Validate inputs and preserve consent history. Clinical verification must remain visible until signed off by an authorized clinician.

#### Calendar and booking

Calendar screen order: title/date, view switcher, date strip, resource filter and chronological clinical timeline. Exact views: `Day`, `Week`, `Doctor`, `Chair`. Exact section labels include `Today’s schedule`, `Week schedule`; empty state: `No visits scheduled` and `Use Book appointment to fill this capacity.`; conflict message: `Review overlapping visits before confirmation.` New appointment is always reachable as one primary action.

Booking is a four-step, validated workflow: select patient (or safely create intake), select procedure/reason and duration, choose available date/time/clinician/chair/branch, review fees/deposit/consent/readiness/confirmation preferences and submit. Detect overlapping clinician and chair appointments, branch hours, procedure durations, readiness dependencies and permission violations on the server as well as in the UI. Preserve a request as unconfirmed until clinic acceptance; never label a public request a confirmed booking.

Support appointment states: `Draft`, `Requested`, `Awaiting confirmation`, `Confirmed`, `Checked in`, `Waiting`, `In chair`, `Treatment paused`, `Completed`, `Needs follow-up`, `Cancelled`, `No-show`. Respect the domain transition graph; reject invalid transitions. Include check-in, waiting room, chair start/pause/complete, reschedule, cancel with reason, no-show, follow-up, reminders and notification delivery states. Display readiness dimensions: intake complete, medical history verified, consent ready, lab case ready and payment ready.

#### Inbox and communications

Inbox order: title/unread state, actionable booking requests and missed-call follow-up summary when present, horizontal scopes and conversation list. Exact filters: `All`, `Unread`, `Missed calls`, `WhatsApp`, `Email`, `Follow-up`. Exact section: `Conversations`; summary labels: `Booking requests`, `Callbacks due`. Clear state: `Inbox is clear` and `There are no conversations matching this filter.` Rows contain name, channel, safe message preview, time, unread and follow-up state. A conversation may include call, WhatsApp, SMS, email and internal notes, but patients never see internal notes.

Support inbound/outbound direction, provider ID/status, queued/sent/delivered/read/failed states, missed/completed calls, outcomes, callbacks, assignment, follow-up time and appointment relationship. Never write “sent/delivered” from local optimism. Retry safely/idempotently, preserve provider webhooks, offer explicit native phone/email/WhatsApp fallback if cloud providers are not configured, and label fallback as opened/composed rather than delivered. Respect channel opt-in, templates, quiet hours and contact preferences.

#### More and operations

More is a permission-filtered, Settings-style grouped list, not a card dashboard. Use these exact groups:

- `Clinic operations`: `Waiting room`, `Tasks`, `Recall`, `Treatment pipeline`.
- `Finance`: `Billing`, `Payments`, `Reports`.
- `Clinical support`: `Laboratory`, `Inventory`, `Templates`.
- `Administration`: `Team`, `Branches`, `Automations`, `Integrations`, `Audit log`, `Settings`.

Implement each workflow with loading, empty, error/retry, permission-denied and success states:

- Waiting room: arrival/check-in order, elapsed waiting, room/chair state, priority/readiness and safe hand-off.
- Tasks: clear owner, patient/appointment relation, category, priority, status, due date and completion audit. Categories: callback, payment, clinical, lab, recall, admin and inventory.
- Recall: due-soon/due/overdue/contacted/scheduled/declined/inactive/reactivated states, consent-aware contact and recorded outcome.
- Treatment pipeline: proposed/shared estimates, consent, payment and booking dependencies, start/pause/completion/decline reasons; patient-readable estimates.
- Billing: invoice lifecycle, line items, discounts/tax, paid/balance, insurance/patient contribution, aging, staged payment, reconciliation and receipts. Exact payment methods: Cash, Card, UPI, Bank transfer, Payment link, Insurance, Clinic credit, Installment. Refunds need authorization, reason, transaction, idempotency and audit.
- Reports: branch/time scope stated plainly; appointment performance, confirmed/progressed, completion, attendance/no-show, treatment conversion and receivables. Separate cash collected from outstanding; never reduce clinical quality or consent to revenue targets.
- Laboratory: case type, lab, patient/appointment, teeth, shade/impression, due/trial/received/fitted/delayed/cancelled state, attachments, costs and hand-off actions.
- Inventory: stock levels, low/out/expiring states, lot/batch and expiry, supplier/location, reorder threshold, purchases/consumption/adjustment/waste/return movements with reason, performer and timestamp. Mutations are transactional.
- Templates: approved/active status, channel, category, variable list and provider template ID. Never send an unapproved template when a provider requires approval.
- Team: invitation, least-privilege role, active state and branch membership; no self-selected roles at sign-in.
- Branches/pricing: clinic-wide patient history with branch-scoped staff, chairs, appointment resources, hours and procedure-specific fee/duration. Switching branch is explicit and permission-checked.
- Automations: explicit trigger, condition, action, channel, enabled state, run/failure counts and audit trail. Show a truthful status; support safe retry and idempotency.
- Integrations: configuration/health and last successful check; no secrets shown in UI; explain disabled/missing provider configuration.
- Audit: immutable actor/action/entity/time summary with appropriately restricted details and export audit.
- Settings: clinic identity, privacy/security, biometric re-entry, app-switcher redaction, encrypted offline workspace, operational notifications, quiet hours and Light/Dark/System appearance. Confirm destructive or irreversible actions.

#### Workflow form content inventory

Use these field/content names and preserve their meaning. If the existing route has a different established label, retain the existing exact wording unless it is unsafe or demonstrably unclear:

- **Appointment booking:** patient; procedure; reason for visit; clinician; chair; branch; date; start time; duration; internal note; readiness; whether to send WhatsApp confirmation; whether a deposit is required; deposit amount. The core validated fields include patient ID, procedure ID, doctor ID, chair ID, start time, duration (10–480 minutes), internal note (up to 2,000 characters), send-confirmation flag, deposit flag and deposit amount.
- **Clinical note:** `Chief complaint`, `Medical update`, `Examination`, `Findings`, `Assessment`, `Procedure performed`, `Anaesthetic`, `Materials`, `Medication`, `Advice`, `Follow-up`, `Tooth numbers`, `Status`. Preserve author, appointment, source media and timestamps. Draft, review-required and signed statuses are distinct.
- **Prescription:** medicine, strength, dosage, frequency, duration and instructions; require explicit allergy-warning acknowledgment. Only an authorized dentist can issue.
- **Consent:** template, language/version, patient/authorized guardian, witness if required, attestation, signature, sent/signed/expiry/withdrawal status. Keep procedure-specific consent separate from communication/media consent.
- **Payment:** patient, invoice (optional where allowed), amount, method, reference and whether to send a receipt. Methods are the exact labels in Section 5. Refund records include source payment, amount, reason, actor and idempotency reference.
- **Communication:** patient/recipient, channel, direction, approved template, subject/body, relevant appointment, send/queue action, callback/follow-up owner and due time. Separate `Internal note` from patient-visible messages.
- **Patient intake:** use the exact multi-step labels and explanatory copy above; fields include first/last name, date of birth, gender, primary/alternate phone, email, preferred language/contact, allergies, conditions, medications, emergency contact and consent flags.
- **Staff invitation:** `Full name`, `Email address`, `Phone` (optional), `Clinic role`; explain `Create a least-privilege clinic account`, `The invitation will be delivered by email`, and `Access is enforced by database policy`; action `Send staff invitation`.
- **Task:** title, description, patient, appointment, owner, priority, category, due date and status. Prompt for an explicit reason when cancellation/closure requires it.
- **Treatment:** plan title, procedure, FDI tooth numbers, quantity, unit fee, discount, tax, total, item status, acceptance/decline reason and expiration. Show patient-readable descriptions on patient-facing documents.
- **Laboratory case:** patient, appointment, laboratory, case type, tooth numbers, shade, impression type, due date, trial/received dates, cost, attachments and handoff note.
- **Inventory movement:** item, movement type (purchase, consumption, adjustment, waste, return), quantity, batch/expiry as applicable, appointment/patient relation as applicable, cost, reason, performer and timestamp.
- **Branch/pricing:** branch identity, address/contact, chairs/rooms, active state, procedure-specific fee and duration. Explicitly state active branch context.
- **Message template:** name, channel, category, body, variables, approval, active state and provider template ID. Display variables as `{{variable_name}}` and never substitute untrusted content as markup.

### 6. Separate patient portal — exact content and behavior

Use this patient-facing copy exactly unless a locale has an approved translation. Header: clinic name (fallback `DentaFlow`) and `Secure patient workspace`. Footer: `Your information is sent securely to the clinic. Avoid using a shared device for medical forms.` Success footer text: `You may close this page. Contact [clinic name] at [support phone] for help.`

#### Public appointment request

- Eyebrow: `Request an appointment`
- Heading: `Tell us what you need.`
- Intro: `The clinic will review your request and contact you to confirm a suitable dentist, chair and time.`
- Fields: `Full name`, `Phone`, `Email`, `Preferred date`, `Preferred time window`, `Reason for visit`.
- Preferred-time placeholder: `Morning, after 4 PM…`
- Visit-reason placeholder: `Pain, cleaning, consultation or another concern`
- Consent: `I agree that the clinic may contact me about this appointment request. This is not a confirmed booking.`
- Submit: `Send appointment request`; progress: `Sending your request…`; success heading: `Request received.`; success detail: `The clinic has received your request and will contact you to confirm the appointment.`

#### Patient intake

- Eyebrow: `Patient intake`; heading: `Review your health details.`
- Intro: `Complete this form before your visit. A clinician will still verify medical information with you.`
- Fields: `Phone`, `Alternate phone`, `Email`, `Preferred language` (default `English`), `Preferred contact` (WhatsApp, Phone call, Email, SMS), `Medical conditions and allergies`, `Current medications`, `Emergency contact`.
- Medical placeholder: `One item per line. Include allergies, heart conditions, diabetes, pregnancy or anything your dentist should know.`
- Medication placeholder: `One medication per line, including dose when known.`
- Emergency placeholder: `Name, relationship and phone`
- Consent: `I agree to receive appointment and care coordination messages through WhatsApp.` and `I consent to clinical photography when separately discussed and required for my care.`
- Submit: `Submit intake`; progress: `Submitting securely…`; success heading: `Intake submitted.`; success detail: `Your clinic has received the form. A clinician will verify important medical information before treatment.`

#### Appointment response link

- Eyebrow: `Appointment response`; heading: `What would you like to do?`
- Intro: `Choose one action. For privacy, appointment details are not displayed on this public page.`
- Choices: `Confirm`, `Request another time`, `Cancel`; field `Optional note or reason`; button `Send response`; progress `Sending your response…`.
- Confirm success: `Response recorded.` / `Your appointment is confirmed.`
- Cancellation success: `Response recorded.` / `The clinic has received your cancellation.`
- Reschedule success: `Response recorded.` / `The clinic will contact you with alternative times.`
- Invalid/expired link: eyebrow `Link unavailable`; heading `We could not open this request.`; actions include `Try again`; explain that the link is incomplete or expired.

Use single-purpose, scoped, expiring, hashed tokens and rate-limited Edge Functions for public booking, intake and appointment responses. Public requests create requests; they do not bypass staff approval or mutate protected clinical data. Never display appointment details on the public response page.

### 7. Domain model and exact lifecycle vocabulary

Represent and validate the entities already defined in `src/domain/types.ts`: clinic, branch, chair, family group, staff membership, patient, medical alert, medication, emergency contact, procedure type, appointment/readiness, timeline event, clinical note, clinical media, tooth record, treatment plan/item, invoice/item, payment/refund, communication, task, consent, prescription/item, lab case, inventory item/movement, branch procedure price, booking request, automation rule, message template, audit log, dashboard and patient record.

Important exact state values:

- Roles: `owner`, `dentist`, `receptionist`, `assistant`, `billing`, `manager`.
- Medical-risk severity: `none`, `low`, `moderate`, `high`, `critical`; alert categories: allergy, condition, medication, pregnancy, accessibility, other.
- FDI permanent tooth chart positions: upper right 18–11, upper left 21–28, lower right 48–41, lower left 31–38. Conditions: healthy, caries, filled, crown, missing, implant, root-canal, bridge, mobility, watch. Surfaces: M, O, D, B, L.
- Clinical note status: draft, review-required, signed, amended. Note fields include chief complaint, medical update, examination, findings, assessment, procedure performed, anaesthetic, materials, medication, advice, follow-up and tooth numbers. A signed note is immutable; corrections create a linked amendment/version and retain the original.
- Treatment stage: proposed, estimate-shared, awaiting-consent, awaiting-payment, not-booked, started, paused, completed, declined. Keep item, subtotal, discount, tax, total, acceptance, decline reason and expiry consistent.
- Invoice: draft, issued, partial, paid, overdue, voided, refunded. Recalculate balance from completed/partially-refunded payments, not client-supplied totals.
- Payment status: pending, completed, failed, refunded, partially-refunded. Use server-side transaction/idempotency for payment and refund mutations.
- Communication: queued, sent, delivered, read, failed, completed, missed. Include direction and provider identifiers; do not infer provider success.
- Tasks: open, in-progress, done, cancelled; priority low, normal, high, urgent.
- Consent: draft, sent, signed, declined, withdrawn, expired. Keep version, language, signer/guardian/witness, attestation/signature evidence, expiry and withdrawal time. Signed consent is immutable; withdrawal appends an event.
- Lab: draft, sent, in-progress, trial-ready, received, fitted, delayed, cancelled.
- Recall: due-soon, due, overdue, contacted, scheduled, declined, inactive, reactivated.
- Stock: healthy, low, out, expiring. Record stock movements as ledger events.
- Procedures: Consultation (30m), Scaling and polishing (45m), Composite filling (45m), Root canal treatment (75m), Extraction (45m), Crown preparation (60m), Implant consultation (45m), Orthodontic review (30m), Emergency pain visit (30m). Allow clinic/branch configuration; do not hard-code price assumptions.

Use the real fields, relations, migrations and validation as the detailed contract. The data model is clinic-tenant-scoped and branch-aware. Use database-calculated or transactionally checked financial and appointment truth.

### 8. Role, branch, privacy and clinical safety rules

The authenticated identity, clinic membership, branch scope and role come from the backend. Never add a role picker. UI filtering is clarity only; Supabase RLS, guarded RPCs and Edge Functions are the enforcement boundary.

- Reception can create/manage intake, appointments, waiting room, communications/booking requests, consent workflow and permitted billing coordination. Reception sees only concise safety flags required to coordinate care, not clinical note bodies, dental charts or unapproved media.
- Dentist can access assigned clinical records, draft/sign notes, prescribe, manage treatment/clinical work, clinical media and follow-up. Prescription creation and clinical signature are dentist-only.
- Assistant can manage assigned chair flow, prepare rooms, work on consent/media and draft clinical material needed for chairside care; cannot sign notes or prescribe.
- Billing can manage invoices, payments, receipts, permitted refunds and overdue follow-up; no clinical-note body, dental chart or unapproved media access.
- Clinic administrator/owner can govern team, branch, reports, integrations and settings. Governance visibility never impersonates dentist authorship: admin/owner cannot sign a clinician’s note or prescribe unless the product model explicitly grants a clinician credential (current v1 does not combine roles).
- All roles have only the capabilities granted by the role matrix. Patient directory, appointment and waiting read access may be shared; mutation capabilities differ. Check `src/domain/access.ts` and `docs/product/ROLE_MATRIX.md` before altering grants.
- Every query/mutation includes tenant and permitted-branch scope. Never leak whether an inaccessible record exists. Route guard order: no session → sign-in; missing membership → invitation/create-clinic resolution; missing branch → branch selection/access denied; missing module capability → More with `You don’t have access to that area.`; missing record capability → denied without fetching protected content.
- Audit patient reads, exports, edits, signatures, payments/refunds, staff/role changes, provider sends, branch changes and security-relevant events. Logs must not expose credentials, tokens or unnecessary clinical payloads.
- Treat patient-reported medical data distinctly from clinician-verified data. Highlight severe alerts before treatment. AI output, OCR, transcription and summaries remain source-linked drafts for clinician review; they never diagnose, prescribe, sign or silently rewrite a chart.

### 9. Backend, integrations and security

Use the existing seven ordered Supabase migrations and extend them safely. Current entity families include clinics, branches, chairs, profiles, clinic memberships, patients/family groups, procedures/prices, appointments, clinical notes/media/teeth, treatment plans, invoices/items, payments/refunds, consent, prescriptions/items, communications, tasks, laboratory, inventory/movements, booking requests, patient portal tokens, automation rules, templates, device tokens, integration connections, webhook events, outbox events and audit logs.

- Enable and verify tenant-safe RLS for every table and storage object. Use authenticated membership/branch claims; never rely on client-side checks. Index tenant, branch, patient, status, owner and time filters; avoid unbounded fetches.
- Use transactions and idempotency keys for appointment creation/transitions where needed, payment/refund, stock movement, consent/signature, public-token actions, provider sends and webhook processing. Webhook events must tolerate replay/out-of-order delivery and have verified signatures where available.
- Keep signed clinical notes and signed consent immutable. Use append-only amendments/versioning and ledger/audit records for financial, communication and inventory changes. Do not delete records merely to hide mistakes.
- Never claim a task is complete until the durable database/provider response confirms it. Show queued/retry/failed/unknown states and keep the source record intact.
- Supabase Edge Functions currently cover staff invite, integration health, notification dispatch, OpenRouter clinical assist, appointment response, intake submission, patient-link creation, provider webhooks, public booking, email, SMS, telephony and WhatsApp. Keep all provider secrets server-side; validate identity, permission, body, rate limits and idempotency in every function.
- AI: send only the minimum necessary context, use an approved model configured server-side, disable provider training/data collection where available, preserve source IDs, show that content is generated, and require clinician review before it enters a signed or authoritative record. It must never diagnose or prescribe.
- Patient portal: store only hashed, expiring, purpose-scoped tokens; rate limit public endpoints; verify clinic slug; validate and sanitize inputs; use generic errors that avoid record enumeration.
- Privacy settings: secure storage, optional biometric lock, app-switcher redaction, encrypted offline cache, safe notifications that do not reveal sensitive detail on lock screens, logout/session expiry and safe cache clearing.

### 10. Performance, errors and app states

- Use FlashList/virtualization for long mobile lists; paginate or bound every query; select only required columns; use server aggregates for dashboard metrics; compress thumbnails while retaining immutable originals; avoid duplicate requests and unstable cache keys.
- Keep navigation and input responsive. Use measured skeletons without layout jumps; preserve form state and filters during recoverable errors. Invalidate only affected queries after a mutation.
- Every route must define loading, empty, error with retry, offline/stale, permission-denied, validation, busy/success and destructive-confirmation states appropriate to that route. Explain what happened in plain language and provide the next safe action.
- Do not display raw backend stack traces, tokens or provider responses. Log diagnostic details safely; render a human-safe message. Do not silently catch errors.
- Respect reduced motion, keyboard/screen-reader navigation, Dynamic Type/text scaling, color contrast, high contrast and safe-area geometry. Do not rely on a color-only state.

### 11. Implementation plan

1. Inventory repository guidance, routes, screens, data model, APIs, migrations, existing workflows, demo data and baseline tests. Summarize what is already working and gaps backed by source/runtime evidence.
2. Build or repair shared design tokens, app shell, role/branch guards, navigation, action placement, modal/sheet patterns, form fields, loading/error/empty feedback and accessibility first.
3. Complete staff critical paths in this order: authentication/clinic/branch entry; Today and calendar/booking; patient intake and record; check-in/waiting/chairside/clinical note/consent; treatment/payment/receipt; Inbox/callback/booking request; recall/tasks/lab/inventory; team/branch/permissions/settings/audit/reports/integrations.
4. Complete the separate patient portal flows: request booking, secure intake, appointment response (confirm/reschedule/cancel), approved documents/messages and authorized family/dependent switching. Ensure every public action maps to a scoped, expiring backend flow.
5. Wire all actions to the repository/service/database. Remove placeholder buttons, fake success, mock production IDs, unimplemented event handlers, client-only authorization and optimistic external delivery claims. Keep an explicit demo adapter only for development.
6. Add/extend domain, RLS, Edge Function and workflow tests. Validate the UI by operating real app flows at phone, tablet and web sizes; fix every blocking issue found.

Do not stop after an audit, plan, single polished screen, screenshot or static HTML mockup. Finish the critical paths end to end. Where real credentials/provider accounts are absent, create honest setup instructions and use a clearly labeled development-only adapter; never fabricate production success.

### 12. Acceptance criteria and exact verification

Product and UI:

- Exactly five stable staff destinations: Today, Patients, Calendar, Inbox, More.
- Each role’s initial work and default action match the table above and remain database-authorized.
- Clinic staff can complete an appointment from request/booking through check-in, chair, clinical documentation, consent, payment, receipt and follow-up with an audit trail.
- Patient intake stays unverified until clinician confirmation; alerts are visible in readiness; signed notes/consents are immutable.
- Public booking is explicitly a request until confirmed by staff. Patient actions never bypass clinic policy.
- Every visible control has a real action or is disabled with a clear reason. No demo/simulated result appears as an external provider success.
- No horizontal overflow, obscured final rows, duplicate patient sections, unreachable primary action, invalid tab count, screen-reader dead end or focus loss at validated breakpoints.
- Exact copy in Sections 5 and 6 is used unless an approved localization is supplied.

Security and data:

- RLS/branch rules verified for all tenant tables and storage; no client-side secret; no role escalation; no public record enumeration; no privileged secret in logs.
- Financial math, appointment conflict checks, state transitions, signatures, inventory movements and public token handling are transactional and covered by tests.
- Every bounded query has pagination/limit and relevant index; aggregate metrics are correctly scoped.
- AI/OCR/transcription outputs are source-linked, reviewable drafts and cannot commit diagnosis/prescription/signature.

Run the repository’s available mandatory checks (adapt only where a command is absent, and report the reason):

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

If build credentials are available, also run the Android preview and production EAS builds; otherwise report the exact missing account/project/secret requirements. Do not report a check or build as passed unless it was run and passed. Do not weaken a quality gate to get a green result.

Final response: summarize implemented flows and meaningful UI changes; link changed files; list exact checks and pass/fail output; state whether phone/tablet/web interaction checks were actually performed; identify credential/provider setup remaining; list real limitations; and give evidence-based readiness scores for UI/UX, workflow wiring, backend, security, performance, accessibility, tests and deployment. Never claim “10/10” or production-ready without evidence.

## END PROMPT

---

## Source notes for the prompt author

- Product/navigation/role requirements were consolidated from `docs/product/STAFF_INFORMATION_ARCHITECTURE.md`, `docs/product/PATIENT_INFORMATION_ARCHITECTURE.md`, `docs/product/ROLE_MATRIX.md`, `design-system/MASTER.md`, `design-system/pages/`, `src/domain/`, the Expo routes, Supabase migrations/functions, and the patient portal.
- Palette values are taken from current `design-system/tokens.ts`. Older design notes contain different background and semantic colors; the prompt tells an implementing agent to resolve that conflict in favor of current production tokens.
- No real patient page content or credentials are included. Demo records are not copied into the reusable prompt; implementations should create fictional demo records instead.
- Existing project route families cover Today/Patients/Calendar/Inbox/More, auth/setup, patient and appointment details, booking, clinical notes/consent/prescriptions, payments/refunds, communication, tasks, templates, teams, branches/pricing, laboratory, inventory, operations and administration. Verify the current repository before assuming any workflow is absent or complete.

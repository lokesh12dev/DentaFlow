# DentaFlow Patient information architecture

Status: product boundary for the separate patient experience. It is not a role inside DentaFlow Clinic.

## Audience and promise

Patients and authorized family caregivers can manage their own relationship with a clinic. Language is warm and plain; clinical jargon is translated. A clinic staff navigation shell, internal note, other patient, operational report, laboratory record or team setting is never exposed.

## Entry paths

- Public booking link
- Secure invitation or magic link
- Appointment confirmation/reschedule link
- Intake request
- Payment request
- Consent request
- Returning patient sign-in

## Navigation

```text
Home
├── Next appointment
├── Tasks to complete
├── Messages
└── Family switcher

Appointments
├── Upcoming
├── Request / book
├── Confirm / reschedule / cancel request
└── Visit history

Documents
├── Approved treatment estimates
├── Prescriptions
├── Consents
├── Invoices
└── Receipts

Messages
└── Patient-to-clinic conversations

Profile
├── Contact details
├── Intake and medical history
├── Communication preferences
├── Family members
├── Privacy and sessions
└── Sign out
```

## Data exposure contract

- Show only records owned by the authenticated patient or an explicitly authorized dependent.
- Documents require a patient-visible/approved state from the clinic.
- Appointment data excludes internal chair, staffing and operational notes.
- Messages exclude internal staff notes and channels.
- Estimates show patient-readable treatment descriptions, totals and payment state; they do not expose internal margin, provider notes or clinic reports.
- Family switching is explicit and always shows whose record is active.
- Secure links are scoped, expiring and single-purpose. Their scope does not grant general portal access.

## Separation from staff app

- Separate route namespace/application entry, authentication policy and navigation shell.
- Shared backend entities and brand tokens are allowed; staff UI components and staff permissions are not reused as patient authorization.
- Patient actions create requests or patient-owned changes according to clinic policy; they do not directly mutate protected clinical records.

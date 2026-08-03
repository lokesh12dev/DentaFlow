-- DentaFlow core schema
-- Designed for Supabase PostgreSQL. All patient-facing tables are tenant scoped by clinic_id.
create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.clinic_role as enum ('owner','dentist','receptionist','assistant','billing','manager');
create type public.appointment_status as enum ('draft','requested','awaiting-confirmation','confirmed','checked-in','waiting','in-chair','paused','completed','needs-follow-up','cancelled','no-show');
create type public.communication_channel as enum ('call','whatsapp','email','sms','internal');
create type public.task_status as enum ('open','in-progress','done','cancelled');
create type public.task_priority as enum ('low','normal','high','urgent');
create type public.invoice_status as enum ('draft','issued','partial','paid','overdue','voided','refunded');
create type public.payment_method as enum ('cash','card','upi','bank-transfer','payment-link','insurance','credit','installment');
create type public.treatment_stage as enum ('proposed','estimate-shared','awaiting-consent','awaiting-payment','not-booked','started','paused','completed','declined');
create type public.consent_status as enum ('draft','sent','signed','declined','withdrawn','expired');

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  legal_name text,
  timezone text not null default 'Asia/Kolkata',
  currency char(3) not null default 'INR',
  locale text not null default 'en-IN',
  phone text not null,
  email citext not null,
  address jsonb not null default '{}'::jsonb,
  opening_time time not null default '09:00',
  closing_time time not null default '18:00',
  branch_code text not null default 'MAIN',
  logo_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  phone text,
  avatar_path text,
  locale text not null default 'en-IN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clinic_members (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.clinic_role not null,
  name text not null,
  phone text,
  email citext,
  job_title text,
  initials text not null default '',
  color_token text not null default 'slate',
  availability text not null default 'available' check (availability in ('available','busy','break','off')),
  active boolean not null default true,
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, user_id)
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  code text not null,
  address jsonb not null default '{}'::jsonb,
  phone text,
  email citext,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, code)
);

create table public.chairs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  name text not null,
  room text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (clinic_id, name)
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  branch_id uuid references public.branches(id),
  patient_number text not null,
  first_name text not null,
  last_name text not null default '',
  display_name text generated always as (trim(first_name || ' ' || last_name)) stored,
  date_of_birth date not null,
  gender text not null default 'undisclosed' check (gender in ('female','male','nonbinary','undisclosed')),
  phone text not null,
  alternate_phone text,
  email citext,
  preferred_language text not null default 'English',
  preferred_contact text not null default 'whatsapp' check (preferred_contact in ('whatsapp','call','email','sms')),
  address jsonb,
  emergency_contact jsonb,
  guardian_patient_id uuid references public.patients(id),
  family_group_id uuid,
  photo_path text,
  tags text[] not null default '{}',
  medical_alerts jsonb not null default '[]'::jsonb,
  medications jsonb not null default '[]'::jsonb,
  intake_complete boolean not null default false,
  intake_verified boolean not null default false,
  whatsapp_consent boolean not null default false,
  photo_consent boolean not null default false,
  marketing_consent boolean not null default false,
  balance numeric(12,2) not null default 0,
  lifetime_value numeric(12,2) not null default 0,
  next_appointment_at timestamptz,
  last_visit_at timestamptz,
  recall_due_at date,
  recall_status text check (recall_status is null or recall_status in ('due-soon','due','overdue','contacted','scheduled','declined','inactive','reactivated')),
  active_treatment_stage public.treatment_stage,
  active boolean not null default true,
  archived_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, patient_number)
);
create index patients_clinic_name_idx on public.patients (clinic_id, lower(first_name), lower(last_name));
create index patients_clinic_phone_idx on public.patients (clinic_id, phone);
create index patients_tags_gin_idx on public.patients using gin(tags);

create table public.procedure_types (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  code text not null,
  name text not null,
  category text not null,
  default_duration_minutes integer not null check (default_duration_minutes between 5 and 720),
  default_fee numeric(12,2) not null default 0 check (default_fee >= 0),
  requires_consent boolean not null default false,
  preparation_instructions text,
  follow_up_days integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, code)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  branch_id uuid references public.branches(id),
  patient_id uuid not null references public.patients(id) on delete restrict,
  patient_name text not null,
  doctor_member_id uuid not null references public.clinic_members(id),
  doctor_name text not null,
  chair_id uuid not null references public.chairs(id),
  chair_name text not null,
  procedure_type_id uuid references public.procedure_types(id),
  procedure_name text not null,
  status public.appointment_status not null default 'draft',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 5 and 720),
  reason text,
  internal_note text,
  source text not null default 'staff' check (source in ('staff','online','whatsapp','phone','walk-in')),
  confirmation_status text not null default 'not-sent' check (confirmation_status in ('not-sent','sent','delivered','confirmed','declined')),
  reminder_status text not null default 'not-scheduled' check (reminder_status in ('not-scheduled','scheduled','sent','failed')),
  estimated_fee numeric(12,2),
  deposit_required numeric(12,2) not null default 0,
  deposit_paid numeric(12,2) not null default 0,
  readiness jsonb not null default '{"intakeComplete":false,"medicalHistoryVerified":false,"consentReady":false,"labCaseReady":true,"paymentReady":true}'::jsonb,
  checked_in_at timestamptz,
  chair_started_at timestamptz,
  completed_at timestamptz,
  cancellation_reason text,
  version integer not null default 1,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index appointments_clinic_starts_idx on public.appointments (clinic_id, starts_at);
create index appointments_patient_idx on public.appointments (patient_id, starts_at desc);
create index appointments_doctor_idx on public.appointments (doctor_member_id, starts_at);
create index appointments_chair_idx on public.appointments (chair_id, starts_at);

create table public.communications (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  channel public.communication_channel not null,
  direction text not null check (direction in ('inbound','outbound','internal')),
  status text not null check (status in ('queued','sent','delivered','read','failed','completed','missed')),
  subject text,
  body text,
  phone text,
  email citext,
  provider_message_id text,
  provider_name text,
  call_duration_seconds integer,
  call_outcome text check (call_outcome is null or call_outcome in ('answered','no-answer','busy','voicemail','wrong-number','converted')),
  unread boolean not null default false,
  requires_follow_up boolean not null default false,
  follow_up_at timestamptz,
  assigned_to uuid references public.clinic_members(id),
  related_appointment_id uuid references public.appointments(id) on delete set null,
  created_by uuid references auth.users(id),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index communications_clinic_time_idx on public.communications (clinic_id, occurred_at desc);
create index communications_patient_time_idx on public.communications (patient_id, occurred_at desc);
create unique index communications_provider_id_unique on public.communications(provider_name, provider_message_id) where provider_message_id is not null;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  title text not null,
  description text,
  patient_id uuid references public.patients(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  assigned_to uuid not null references public.clinic_members(id),
  created_by uuid references auth.users(id),
  priority public.task_priority not null default 'normal',
  status public.task_status not null default 'open',
  due_at timestamptz,
  category text not null check (category in ('callback','payment','clinical','lab','recall','admin','inventory')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_clinic_due_idx on public.tasks (clinic_id, status, due_at);

create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,
  author_member_id uuid not null references public.clinic_members(id),
  status text not null check (status in ('draft','review-required','signed','amended')),
  content jsonb not null default '{}'::jsonb,
  tooth_numbers integer[] not null default '{}',
  ai_generated boolean not null default false,
  ai_source_ids uuid[] not null default '{}',
  signed_at timestamptz,
  amended_from_id uuid references public.clinical_notes(id),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status <> 'signed') or signed_at is not null)
);
create index clinical_notes_patient_idx on public.clinical_notes (patient_id, created_at desc);

create table public.clinical_media (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,
  kind text not null check (kind in ('photo','xray','scan','document','audio','receipt','consent')),
  title text not null,
  storage_path text not null,
  thumbnail_path text,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  tooth_numbers integer[] not null default '{}',
  captured_at timestamptz not null default now(),
  captured_by uuid not null references public.clinic_members(id),
  ai_extracted_text text,
  ai_summary text,
  ai_status text check (ai_status is null or ai_status in ('not-requested','queued','ready','failed','reviewed')),
  source_preserved boolean not null default true,
  created_at timestamptz not null default now()
);
create index clinical_media_patient_idx on public.clinical_media (patient_id, captured_at desc);

create table public.tooth_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  tooth_number integer not null check (tooth_number between 11 and 85),
  condition text not null check (condition in ('healthy','caries','filled','crown','missing','implant','root-canal','bridge','mobility','watch')),
  surfaces text[] not null default '{}',
  note text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (patient_id, tooth_number)
);

create table public.treatment_plans (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  title text not null,
  stage public.treatment_stage not null default 'proposed',
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  accepted_at timestamptz,
  declined_reason text,
  expires_at date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.treatment_plan_items (
  id uuid primary key default gen_random_uuid(),
  treatment_plan_id uuid not null references public.treatment_plans(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  procedure_type_id uuid references public.procedure_types(id),
  procedure_name text not null,
  tooth_numbers integer[] not null default '{}',
  quantity numeric(10,2) not null default 1,
  unit_fee numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'proposed' check (status in ('proposed','accepted','scheduled','in-progress','completed','declined')),
  note text
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  invoice_number text not null,
  status public.invoice_status not null default 'draft',
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  paid numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,
  insurance_contribution numeric(12,2) not null default 0,
  patient_contribution numeric(12,2) not null default 0,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, invoice_number)
);
create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  description text not null,
  tooth_numbers integer[] not null default '{}',
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0
);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  invoice_id uuid references public.invoices(id) on delete set null,
  receipt_number text not null,
  amount numeric(12,2) not null check (amount > 0),
  method public.payment_method not null,
  reference text,
  received_at timestamptz not null default now(),
  received_by uuid not null references public.clinic_members(id),
  status text not null default 'completed' check (status in ('pending','completed','failed','refunded','partially-refunded')),
  refund_amount numeric(12,2) not null default 0,
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique (clinic_id, receipt_number),
  unique (clinic_id, idempotency_key)
);

create table public.consents (
  id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict, appointment_id uuid references public.appointments(id),
  template_id uuid, template_name text not null, version integer not null default 1, language text not null default 'English',
  status public.consent_status not null default 'draft', signed_by_name text, guardian_name text, witness_name text,
  signature_path text, content_snapshot jsonb not null default '{}'::jsonb, sent_at timestamptz, signed_at timestamptz,
  withdrawn_at timestamptz, expires_at timestamptz, created_at timestamptz not null default now()
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict, appointment_id uuid references public.appointments(id),
  prescribed_by uuid not null references public.clinic_members(id), allergy_warning_acknowledged boolean not null default false,
  notes text, issued_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table public.prescription_items (
  id uuid primary key default gen_random_uuid(), prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade, medicine text not null, strength text,
  dosage text not null, frequency text not null, duration text not null, instructions text
);

create table public.lab_cases (
  id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict, patient_name text not null, appointment_id uuid references public.appointments(id),
  lab_name text not null, case_type text not null, tooth_numbers integer[] not null default '{}', shade text, impression_type text,
  status text not null check (status in ('draft','sent','in-progress','trial-ready','received','fitted','delayed','cancelled')),
  sent_at timestamptz, trial_at timestamptz, due_at timestamptz, received_at timestamptz, cost numeric(12,2), note text,
  attachment_count integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null, sku text not null, category text not null, supplier text, unit text not null,
  current_quantity numeric(12,3) not null default 0, minimum_quantity numeric(12,3) not null default 0,
  reorder_quantity numeric(12,3) not null default 0, batch_number text, expires_at date,
  status text not null default 'healthy' check (status in ('healthy','low','out','expiring')),
  unit_cost numeric(12,2), location text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (clinic_id, sku, batch_number)
);

create table public.automation_rules (
  id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null, trigger text not null, action text not null, channel public.communication_channel,
  enabled boolean not null default true, conditions jsonb not null default '{}'::jsonb, config jsonb not null default '{}'::jsonb,
  last_run_at timestamptz, run_count bigint not null default 0, failure_count bigint not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.message_templates (
  id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null, channel public.communication_channel not null, category text not null, body text not null,
  variables text[] not null default '{}', provider_template_id text, approved boolean not null default false,
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, expo_push_token text not null,
  platform text not null check (platform in ('ios','android','web')), device_name text, active boolean not null default true,
  last_seen_at timestamptz not null default now(), created_at timestamptz not null default now(), unique(user_id, expo_push_token)
);

create table public.integration_connections (
  id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id) on delete cascade,
  provider text not null, status text not null default 'disconnected' check (status in ('disconnected','connected','degraded','error')),
  public_config jsonb not null default '{}'::jsonb, last_checked_at timestamptz, last_error text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(clinic_id, provider)
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(), provider text not null, provider_event_id text not null,
  clinic_id uuid references public.clinics(id) on delete cascade, event_type text not null, payload jsonb not null,
  signature_verified boolean not null default false, status text not null default 'received' check(status in ('received','processing','processed','failed','ignored')),
  attempts integer not null default 0, error text, received_at timestamptz not null default now(), processed_at timestamptz,
  unique(provider, provider_event_id)
);

create table public.outbox_events (
  id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id) on delete cascade,
  topic text not null, aggregate_type text not null, aggregate_id uuid, payload jsonb not null,
  status text not null default 'pending' check(status in ('pending','processing','sent','failed','dead-letter')),
  attempts integer not null default 0, available_at timestamptz not null default now(), last_error text,
  created_at timestamptz not null default now(), processed_at timestamptz
);
create index outbox_pending_idx on public.outbox_events(status, available_at);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id) on delete cascade,
  actor_id uuid references auth.users(id), actor_name text, action text not null, entity_type text not null, entity_id uuid,
  summary text not null, old_values jsonb, new_values jsonb, request_id text, ip_address inet, user_agent text, device text,
  occurred_at timestamptz not null default now()
);
create index audit_logs_clinic_time_idx on public.audit_logs(clinic_id, occurred_at desc);

create sequence public.patient_number_seq start 10000;
create sequence public.invoice_number_seq start 1000;
create sequence public.receipt_number_seq start 2000;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.assign_patient_number() returns trigger language plpgsql as $$
begin
  if new.patient_number is null or new.patient_number = '' then
    new.patient_number := 'DF-' || to_char(nextval('public.patient_number_seq'), 'FM000000');
  end if;
  return new;
end $$;

create or replace function public.protect_signed_clinical_note() returns trigger language plpgsql as $$
begin
  if old.status = 'signed' then
    raise exception 'Signed clinical notes are immutable. Create an amendment.' using errcode = '42501';
  end if;
  new.version := old.version + 1;
  return new;
end $$;

create trigger patients_number_before_insert before insert on public.patients for each row execute function public.assign_patient_number();
create trigger clinics_updated before update on public.clinics for each row execute function public.set_updated_at();
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger clinic_members_updated before update on public.clinic_members for each row execute function public.set_updated_at();
create trigger patients_updated before update on public.patients for each row execute function public.set_updated_at();
create trigger appointments_updated before update on public.appointments for each row execute function public.set_updated_at();
create trigger tasks_updated before update on public.tasks for each row execute function public.set_updated_at();
create trigger clinical_notes_protect before update or delete on public.clinical_notes for each row execute function public.protect_signed_clinical_note();
create trigger treatment_plans_updated before update on public.treatment_plans for each row execute function public.set_updated_at();
create trigger invoices_updated before update on public.invoices for each row execute function public.set_updated_at();
create trigger lab_cases_updated before update on public.lab_cases for each row execute function public.set_updated_at();
create trigger inventory_updated before update on public.inventory_items for each row execute function public.set_updated_at();
create trigger automation_updated before update on public.automation_rules for each row execute function public.set_updated_at();
create trigger templates_updated before update on public.message_templates for each row execute function public.set_updated_at();
create trigger integrations_updated before update on public.integration_connections for each row execute function public.set_updated_at();

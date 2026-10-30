-- Booking conflict integrity (Phase 2 hardening, requirement R4 in PRODUCT_REQUIREMENTS.md)
-- The booking RPC already performs a friendly check-then-insert. This migration adds a
-- database-level backstop so two concurrent booking transactions can never double-book
-- the same dentist or chair, even if both pass the SELECT check simultaneously.

create extension if not exists btree_gist;

-- Doctor cannot be double-booked. Drafts are excluded: they are placeholders and the
-- RPC path never inserts them overlapping (its own check includes drafts).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'appointments_no_doctor_overlap') then
    alter table public.appointments
      add constraint appointments_no_doctor_overlap
      exclude using gist (
        doctor_member_id with =,
        tstzrange(starts_at, ends_at) with &&
      ) where (status not in ('cancelled', 'no-show', 'draft'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'appointments_no_chair_overlap') then
    alter table public.appointments
      add constraint appointments_no_chair_overlap
      exclude using gist (
        chair_id with =,
        tstzrange(starts_at, ends_at) with &&
      ) where (status not in ('cancelled', 'no-show', 'draft'));
  end if;
end $$;

-- Recreate the booking RPC with a race-safe error handler. Logic is identical to
-- 202608030003 except around the INSERT: if the database exclusion constraint rejects
-- a concurrent booking, the client receives the same friendly message and errcode
-- (23P01) as the routine's own pre-check instead of a raw constraint name.
create or replace function public.create_appointment_with_workflow(p_clinic_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_patient public.patients; v_member public.clinic_members; v_chair public.chairs; v_proc public.procedure_types; v_appt public.appointments; v_start timestamptz; v_end timestamptz; v_send boolean;
begin
  perform public.require_role(p_clinic_id,array['owner','manager','dentist','receptionist','assistant']::public.clinic_role[]);
  select * into strict v_patient from public.patients where id=(p_payload->>'patientId')::uuid and clinic_id=p_clinic_id and archived_at is null;
  select * into strict v_member from public.clinic_members where id=(p_payload->>'doctorId')::uuid and clinic_id=p_clinic_id and active and role in ('owner','dentist');
  select * into strict v_chair from public.chairs where id=(p_payload->>'chairId')::uuid and clinic_id=p_clinic_id and active;
  select * into strict v_proc from public.procedure_types where id=(p_payload->>'procedureTypeId')::uuid and clinic_id=p_clinic_id and active;
  v_start := (p_payload->>'startsAt')::timestamptz; v_end := v_start + make_interval(mins=>coalesce((p_payload->>'durationMinutes')::int,v_proc.default_duration_minutes)); v_send := coalesce((p_payload->>'sendWhatsapp')::boolean,false);
  if exists(select 1 from public.appointments where clinic_id=p_clinic_id and status not in ('cancelled','no-show') and starts_at<v_end and ends_at>v_start and (doctor_member_id=v_member.id or chair_id=v_chair.id)) then
    raise exception 'The selected doctor or chair is already booked during this time' using errcode='23P01';
  end if;
  begin
    insert into public.appointments(clinic_id,branch_id,patient_id,patient_name,doctor_member_id,doctor_name,chair_id,chair_name,procedure_type_id,procedure_name,status,starts_at,ends_at,duration_minutes,internal_note,source,confirmation_status,reminder_status,estimated_fee,deposit_required,readiness,created_by)
    values(p_clinic_id,v_chair.branch_id,v_patient.id,v_patient.display_name,v_member.id,v_member.name,v_chair.id,v_chair.name,v_proc.id,v_proc.name,case when v_send then 'awaiting-confirmation' else 'confirmed' end,v_start,v_end,extract(epoch from(v_end-v_start))/60,nullif(p_payload->>'internalNote',''),'staff',case when v_send then 'sent' else 'confirmed' end,'scheduled',v_proc.default_fee,case when coalesce((p_payload->>'requestDeposit')::boolean,false) then coalesce((p_payload->>'depositAmount')::numeric,0) else 0 end,
    jsonb_build_object('intakeComplete',v_patient.intake_complete,'medicalHistoryVerified',v_patient.intake_verified,'consentReady',not v_proc.requires_consent,'labCaseReady',true,'paymentReady',v_patient.balance<10000),auth.uid()) returning * into v_appt;
  exception when exclusion_violation then
    raise exception 'The selected doctor or chair is already booked during this time' using errcode='23P01';
  end;
  update public.patients set next_appointment_at=v_start where id=v_patient.id;
  if v_send then
    insert into public.communications(clinic_id,patient_id,channel,direction,status,body,phone,unread,requires_follow_up,related_appointment_id,created_by)
    values(p_clinic_id,v_patient.id,'whatsapp','outbound','queued','Appointment confirmation for '||to_char(v_start at time zone (select timezone from public.clinics where id=p_clinic_id),'DD Mon YYYY, HH12:MI AM'),v_patient.phone,false,false,v_appt.id,auth.uid());
    insert into public.outbox_events(clinic_id,topic,aggregate_type,aggregate_id,payload) values(p_clinic_id,'communication.whatsapp','appointment',v_appt.id,jsonb_build_object('appointmentId',v_appt.id,'patientId',v_patient.id));
  end if;
  return to_jsonb(v_appt);
end $$;

grant execute on function public.create_appointment_with_workflow(uuid,jsonb) to authenticated;

-- Runtime verification steps (require a live Postgres; not performed on this machine):
-- 1) supabase db reset (applies all migrations cleanly on an empty database)
-- 2) insert two appointments for the same doctor/chair with overlapping ranges and
--    status 'confirmed' → second insert must fail with errcode 23P01
-- 3) insert with status 'cancelled' overlapping a 'confirmed' row → must succeed
-- 4) call create_appointment_with_workflow twice concurrently with the same time slot →
--    one call returns JSONB, the other fails with the friendly message

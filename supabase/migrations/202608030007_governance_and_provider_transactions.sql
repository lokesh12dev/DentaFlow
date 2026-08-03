-- Governance and provider transaction hardening.

alter table public.communications add column if not exists idempotency_key text;
create unique index if not exists communications_clinic_idempotency_unique
  on public.communications(clinic_id,idempotency_key)
  where idempotency_key is not null;

alter table public.tasks add column if not exists source_key text;
create unique index if not exists tasks_clinic_source_key_unique
  on public.tasks(clinic_id,source_key)
  where source_key is not null;

create or replace function public.update_staff_access(p_clinic_id uuid,p_member_id uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_actor public.clinic_members;
  v_target public.clinic_members;
  v_next_role public.clinic_role;
  v_next_active boolean;
  v_owner_count integer;
begin
  perform public.require_role(p_clinic_id,array['owner','manager']::public.clinic_role[]);
  select * into strict v_actor from public.clinic_members where id=public.current_member_id(p_clinic_id) and clinic_id=p_clinic_id for update;
  select * into strict v_target from public.clinic_members where id=p_member_id and clinic_id=p_clinic_id for update;

  v_next_role:=coalesce(nullif(p_payload->>'role','')::public.clinic_role,v_target.role);
  v_next_active:=coalesce((p_payload->>'active')::boolean,v_target.active);

  if v_actor.role='manager' and (v_target.role='owner' or v_next_role='owner') then
    raise exception 'Managers cannot change owner access' using errcode='42501';
  end if;

  if v_target.id=v_actor.id and (not v_next_active or v_next_role not in ('owner','manager')) then
    raise exception 'You cannot remove your own administrative access' using errcode='23514';
  end if;

  if v_target.role='owner' and (not v_next_active or v_next_role<>'owner') then
    select count(*) into v_owner_count from public.clinic_members where clinic_id=p_clinic_id and role='owner' and active and id<>v_target.id;
    if v_owner_count=0 then raise exception 'A clinic must retain at least one active owner' using errcode='23514'; end if;
  end if;

  update public.clinic_members set
    name=coalesce(nullif(trim(p_payload->>'name'),''),name),
    phone=nullif(trim(p_payload->>'phone'),''),
    role=v_next_role,
    availability=coalesce(nullif(p_payload->>'availability',''),availability),
    active=v_next_active,
    updated_at=now()
  where id=v_target.id
  returning * into v_target;

  return to_jsonb(v_target);
end $$;
revoke all on function public.update_staff_access(uuid,uuid,jsonb) from public;
grant execute on function public.update_staff_access(uuid,uuid,jsonb) to authenticated;

create or replace function public.record_provider_communication(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_communication public.communications;
  v_existing public.communications;
  v_channel public.communication_channel;
  v_clinic_id uuid;
  v_patient_id uuid;
  v_member_id uuid;
  v_follow boolean;
  v_key text;
  v_task_key text;
begin
  v_clinic_id:=(p_payload->>'clinicId')::uuid;
  v_patient_id:=(p_payload->>'patientId')::uuid;
  v_member_id:=nullif(p_payload->>'memberId','')::uuid;
  v_channel:=(p_payload->>'channel')::public.communication_channel;
  v_follow:=coalesce((p_payload->>'requiresFollowUp')::boolean,false);
  v_key:=coalesce(nullif(p_payload->>'idempotencyKey',''),nullif(p_payload->>'providerMessageId',''));

  if not exists(select 1 from public.patients where id=v_patient_id and clinic_id=v_clinic_id) then
    raise exception 'Patient does not belong to clinic' using errcode='23503';
  end if;
  if v_member_id is null or not exists(select 1 from public.clinic_members where id=v_member_id and clinic_id=v_clinic_id and active) then
    raise exception 'Active clinic member is required' using errcode='23503';
  end if;

  if v_key is not null then
    select * into v_existing from public.communications where clinic_id=v_clinic_id and idempotency_key=v_key;
    if found then return to_jsonb(v_existing); end if;
  end if;

  insert into public.communications(
    clinic_id,patient_id,channel,direction,status,subject,body,phone,email,
    provider_message_id,provider_name,unread,requires_follow_up,follow_up_at,
    assigned_to,related_appointment_id,created_by,idempotency_key
  ) values(
    v_clinic_id,v_patient_id,v_channel,'outbound',coalesce(nullif(p_payload->>'status',''),'queued'),
    nullif(p_payload->>'subject',''),nullif(p_payload->>'body',''),nullif(p_payload->>'phone',''),nullif(p_payload->>'email',''),
    nullif(p_payload->>'providerMessageId',''),nullif(p_payload->>'providerName',''),false,v_follow,
    nullif(p_payload->>'followUpAt','')::timestamptz,case when v_follow then v_member_id end,
    nullif(p_payload->>'relatedAppointmentId','')::uuid,nullif(p_payload->>'createdBy','')::uuid,v_key
  ) returning * into v_communication;

  if v_follow then
    v_task_key:='communication-follow-up:'||v_communication.id::text;
    insert into public.tasks(
      clinic_id,title,description,patient_id,appointment_id,assigned_to,created_by,
      priority,category,due_at,source_key
    ) values(
      v_clinic_id,'Follow up '||v_channel::text,coalesce(v_communication.body,v_communication.subject),
      v_patient_id,v_communication.related_appointment_id,v_member_id,nullif(p_payload->>'createdBy','')::uuid,
      'normal','callback',v_communication.follow_up_at,v_task_key
    ) on conflict(clinic_id,source_key) where source_key is not null do nothing;
  end if;

  return to_jsonb(v_communication);
end $$;
revoke all on function public.record_provider_communication(jsonb) from public,anon,authenticated;
grant execute on function public.record_provider_communication(jsonb) to service_role;

alter table public.consents add column if not exists withdrawal_reason text;

create or replace function public.protect_signed_consent()
returns trigger language plpgsql set search_path=public as $$
begin
  if old.status='signed' and current_setting('app.allow_consent_withdrawal',true)<>'true' then
    if new is distinct from old then raise exception 'Signed consent is immutable; use the withdrawal workflow' using errcode='23514'; end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_signed_consent_trigger on public.consents;
create trigger protect_signed_consent_trigger before update or delete on public.consents
for each row execute function public.protect_signed_consent();

create or replace function public.withdraw_consent(p_clinic_id uuid,p_consent_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v public.consents;
begin
  perform public.require_role(p_clinic_id,array['owner','manager','dentist','receptionist']::public.clinic_role[]);
  select * into strict v from public.consents where id=p_consent_id and clinic_id=p_clinic_id for update;
  if v.status not in ('signed','sent','draft') then raise exception 'Consent cannot be withdrawn from its current state'; end if;
  perform set_config('app.allow_consent_withdrawal','true',true);
  update public.consents set status='withdrawn',withdrawn_at=now(),withdrawal_reason=nullif(trim(p_reason),'') where id=v.id returning * into v;
  return to_jsonb(v);
end $$;
revoke all on function public.withdraw_consent(uuid,uuid,text) from public;
grant execute on function public.withdraw_consent(uuid,uuid,text) to authenticated;

-- Extended production workflows: family accounts, transactional care plans, prescriptions and clinic preferences.
create table public.family_groups (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  primary_patient_id uuid references public.patients(id) on delete set null,
  billing_patient_id uuid references public.patients(id) on delete set null,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, name)
);
create index family_groups_clinic_idx on public.family_groups(clinic_id, name);
alter table public.patients add constraint patients_family_group_fk foreign key (family_group_id) references public.family_groups(id) on delete set null;

alter table public.family_groups enable row level security;
create policy family_groups_member_read on public.family_groups for select using (public.is_clinic_member(clinic_id));
create policy family_groups_ops_write on public.family_groups for all using (public.has_clinic_role(clinic_id,array['owner','manager','dentist','receptionist','billing']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id,array['owner','manager','dentist','receptionist','billing']::public.clinic_role[]));
create trigger family_groups_audit after insert or update or delete on public.family_groups for each row execute function public.audit_row_change();

create or replace function public.create_family_group(p_clinic_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_group public.family_groups; v_member_id uuid;
begin
  perform public.require_role(p_clinic_id,array['owner','manager','dentist','receptionist','billing']::public.clinic_role[]);
  if coalesce(jsonb_array_length(coalesce(p_payload->'memberPatientIds','[]'::jsonb)),0)=0 then raise exception 'At least one family member is required'; end if;
  insert into public.family_groups(clinic_id,name,primary_patient_id,billing_patient_id,notes,created_by)
  values(p_clinic_id,trim(p_payload->>'name'),nullif(p_payload->>'primaryPatientId','')::uuid,nullif(p_payload->>'billingPatientId','')::uuid,nullif(p_payload->>'notes',''),auth.uid()) returning * into v_group;
  update public.patients set family_group_id=v_group.id,updated_at=now()
  where clinic_id=p_clinic_id and id in (select value::text::uuid from jsonb_array_elements_text(p_payload->'memberPatientIds'));
  return to_jsonb(v_group);
end $$;
grant execute on function public.create_family_group(uuid,jsonb) to authenticated;

create or replace function public.create_treatment_plan(p_clinic_id uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_plan public.treatment_plans; v_item jsonb; v_subtotal numeric:=0; v_discount numeric:=0; v_tax numeric:=0; v_total numeric:=0;
begin
  perform public.require_role(p_clinic_id,array['owner','manager','dentist']::public.clinic_role[]);
  if not exists(select 1 from public.patients where id=(p_payload->>'patientId')::uuid and clinic_id=p_clinic_id and archived_at is null) then raise exception 'Patient not found'; end if;
  if jsonb_array_length(coalesce(p_payload->'items','[]'::jsonb))=0 then raise exception 'Treatment plan requires at least one item'; end if;
  for v_item in select * from jsonb_array_elements(p_payload->'items') loop
    v_subtotal:=v_subtotal+greatest(0,coalesce((v_item->>'quantity')::numeric,1)*coalesce((v_item->>'unitFee')::numeric,0));
    v_discount:=v_discount+greatest(0,coalesce((v_item->>'discount')::numeric,0));
    v_tax:=v_tax+greatest(0,coalesce((v_item->>'tax')::numeric,0));
  end loop;
  v_total:=greatest(0,v_subtotal-v_discount+v_tax);
  insert into public.treatment_plans(clinic_id,patient_id,title,stage,subtotal,discount,tax,total,expires_at,created_by)
  values(p_clinic_id,(p_payload->>'patientId')::uuid,trim(p_payload->>'title'),'proposed',v_subtotal,v_discount,v_tax,v_total,nullif(p_payload->>'expiresAt','')::date,auth.uid()) returning * into v_plan;
  for v_item in select * from jsonb_array_elements(p_payload->'items') loop
    insert into public.treatment_plan_items(treatment_plan_id,clinic_id,procedure_type_id,procedure_name,tooth_numbers,quantity,unit_fee,discount,tax,total,status,note)
    values(v_plan.id,p_clinic_id,nullif(v_item->>'procedureTypeId','')::uuid,v_item->>'procedureName',coalesce(array(select jsonb_array_elements_text(coalesce(v_item->'toothNumbers','[]'::jsonb))::int),'{}'),coalesce((v_item->>'quantity')::numeric,1),coalesce((v_item->>'unitFee')::numeric,0),coalesce((v_item->>'discount')::numeric,0),coalesce((v_item->>'tax')::numeric,0),greatest(0,coalesce((v_item->>'quantity')::numeric,1)*coalesce((v_item->>'unitFee')::numeric,0)-coalesce((v_item->>'discount')::numeric,0)+coalesce((v_item->>'tax')::numeric,0)),'proposed',nullif(v_item->>'note',''));
  end loop;
  update public.patients set active_treatment_stage='proposed',updated_at=now() where id=v_plan.patient_id;
  return to_jsonb(v_plan)||jsonb_build_object('items',(select coalesce(jsonb_agg(to_jsonb(i)),'[]'::jsonb) from public.treatment_plan_items i where i.treatment_plan_id=v_plan.id));
end $$;
grant execute on function public.create_treatment_plan(uuid,jsonb) to authenticated;

create or replace function public.create_prescription(p_clinic_id uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_rx public.prescriptions; v_item jsonb; v_member public.clinic_members;
begin
  perform public.require_role(p_clinic_id,array['owner','dentist']::public.clinic_role[]);
  select * into strict v_member from public.clinic_members where clinic_id=p_clinic_id and user_id=auth.uid() and active and role in ('owner','dentist');
  if jsonb_array_length(coalesce(p_payload->'items','[]'::jsonb))=0 then raise exception 'Prescription requires at least one medicine'; end if;
  if exists(select 1 from public.patients p,jsonb_array_elements(p.medical_alerts) a where p.id=(p_payload->>'patientId')::uuid and p.clinic_id=p_clinic_id and a->>'category'='allergy') and not coalesce((p_payload->>'allergyWarningAcknowledged')::boolean,false) then raise exception 'Allergy warning must be acknowledged'; end if;
  insert into public.prescriptions(clinic_id,patient_id,appointment_id,prescribed_by,allergy_warning_acknowledged,notes)
  values(p_clinic_id,(p_payload->>'patientId')::uuid,nullif(p_payload->>'appointmentId','')::uuid,v_member.id,coalesce((p_payload->>'allergyWarningAcknowledged')::boolean,false),nullif(p_payload->>'notes','')) returning * into v_rx;
  for v_item in select * from jsonb_array_elements(p_payload->'items') loop
    insert into public.prescription_items(prescription_id,clinic_id,medicine,strength,dosage,frequency,duration,instructions)
    values(v_rx.id,p_clinic_id,trim(v_item->>'medicine'),nullif(v_item->>'strength',''),trim(v_item->>'dosage'),trim(v_item->>'frequency'),trim(v_item->>'duration'),nullif(v_item->>'instructions',''));
  end loop;
  return to_jsonb(v_rx)||jsonb_build_object('prescribed_by_name',v_member.name,'items',(select coalesce(jsonb_agg(to_jsonb(i)),'[]'::jsonb) from public.prescription_items i where i.prescription_id=v_rx.id));
end $$;
grant execute on function public.create_prescription(uuid,jsonb) to authenticated;

create or replace function public.protect_signed_clinical_note()
returns trigger language plpgsql set search_path=public as $$
begin
  if tg_op='DELETE' then
    if old.status='signed' then raise exception 'Signed clinical notes cannot be deleted; create an amendment'; end if;
    return old;
  end if;
  if old.status='signed' and (new.content is distinct from old.content or new.tooth_numbers is distinct from old.tooth_numbers or new.status is distinct from old.status) then
    raise exception 'Signed clinical notes are immutable; create an amendment';
  end if;
  new.version:=old.version+1; new.updated_at:=now(); return new;
end $$;
drop trigger if exists clinical_notes_protect on public.clinical_notes;
create trigger clinical_notes_protect before update or delete on public.clinical_notes for each row execute function public.protect_signed_clinical_note();

create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path=public as $$
declare row_clinic uuid; row_id uuid; action_name text; old_data jsonb; new_data jsonb; request_headers jsonb;
begin
  if tg_op='DELETE' then old_data:=to_jsonb(old);new_data:=null;row_clinic:=old.clinic_id;row_id:=old.id;action_name:='delete';
  elsif tg_op='INSERT' then old_data:=null;new_data:=to_jsonb(new);row_clinic:=new.clinic_id;row_id:=new.id;action_name:='create';
  else old_data:=to_jsonb(old);new_data:=to_jsonb(new);row_clinic:=new.clinic_id;row_id:=new.id;action_name:='update'; end if;
  request_headers:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb,'{}'::jsonb);
  insert into public.audit_logs(clinic_id,actor_id,action,entity_type,entity_id,summary,old_values,new_values,request_id)
  values(row_clinic,auth.uid(),action_name,tg_table_name,row_id,initcap(action_name)||' '||replace(tg_table_name,'_',' '),old_data,new_data,request_headers->>'x-request-id');
  return coalesce(new,old);
end $$;

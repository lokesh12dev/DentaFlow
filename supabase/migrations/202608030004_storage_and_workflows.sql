-- Private storage and operational safety workflows.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
  ('clinical-media','clinical-media',false,26214400,array['image/jpeg','image/png','image/heic','application/pdf','audio/m4a','audio/mp4','audio/mpeg']),
  ('receipts','receipts',false,10485760,array['application/pdf']),
  ('consent-signatures','consent-signatures',false,5242880,array['image/png','image/jpeg','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create or replace function public.storage_clinic_id(object_name text)
returns uuid language plpgsql immutable as $$
begin return split_part(object_name,'/',1)::uuid; exception when others then return null; end $$;

create policy clinical_media_read on storage.objects for select to authenticated
using (bucket_id='clinical-media' and public.has_clinic_role(public.storage_clinic_id(name),array['owner','manager','dentist','assistant']::public.clinic_role[]));
create policy clinical_media_insert on storage.objects for insert to authenticated
with check (bucket_id='clinical-media' and public.has_clinic_role(public.storage_clinic_id(name),array['owner','dentist','assistant']::public.clinic_role[]));
create policy clinical_media_update on storage.objects for update to authenticated
using (bucket_id='clinical-media' and public.has_clinic_role(public.storage_clinic_id(name),array['owner','dentist']::public.clinic_role[]));
create policy clinical_media_delete on storage.objects for delete to authenticated
using (bucket_id='clinical-media' and public.has_clinic_role(public.storage_clinic_id(name),array['owner']::public.clinic_role[]));

create policy receipts_member_read on storage.objects for select to authenticated
using (bucket_id='receipts' and public.is_clinic_member(public.storage_clinic_id(name)));
create policy receipts_billing_insert on storage.objects for insert to authenticated
with check (bucket_id='receipts' and public.has_clinic_role(public.storage_clinic_id(name),array['owner','manager','billing','receptionist']::public.clinic_role[]));
create policy signatures_clinical_read on storage.objects for select to authenticated
using (bucket_id='consent-signatures' and public.has_clinic_role(public.storage_clinic_id(name),array['owner','manager','dentist','assistant']::public.clinic_role[]));
create policy signatures_clinical_insert on storage.objects for insert to authenticated
with check (bucket_id='consent-signatures' and public.has_clinic_role(public.storage_clinic_id(name),array['owner','dentist','assistant']::public.clinic_role[]));

create or replace function public.refresh_inventory_status()
returns trigger language plpgsql as $$
begin
  new.status := case
    when new.current_quantity <= 0 then 'out'
    when new.expires_at is not null and new.expires_at <= current_date + 30 then 'expiring'
    when new.current_quantity <= new.minimum_quantity then 'low'
    else 'healthy' end;
  return new;
end $$;
create trigger inventory_status_before_write before insert or update on public.inventory_items for each row execute function public.refresh_inventory_status();

create or replace function public.refresh_invoice_status()
returns trigger language plpgsql as $$
begin
  new.balance := greatest(0,new.total-new.paid);
  new.status := case
    when new.status in ('voided','refunded') then new.status
    when new.balance=0 and new.total>0 then 'paid'
    when new.paid>0 then 'partial'
    when new.due_at is not null and new.due_at<now() then 'overdue'
    when new.status='draft' then 'draft'
    else 'issued' end;
  return new;
end $$;
create trigger invoice_status_before_write before insert or update on public.invoices for each row execute function public.refresh_invoice_status();

create or replace function public.create_missed_appointment_followup()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status in ('no-show','needs-follow-up') and old.status is distinct from new.status then
    insert into public.tasks(clinic_id,title,description,patient_id,appointment_id,assigned_to,created_by,priority,due_at,category)
    values(new.clinic_id,case when new.status='no-show' then 'Follow up missed appointment' else 'Arrange clinical follow-up' end,new.procedure_name,new.patient_id,new.id,coalesce(public.current_member_id(new.clinic_id),new.doctor_member_id),auth.uid(),case when new.status='needs-follow-up' then 'high' else 'normal' end,now()+case when new.status='needs-follow-up' then interval '2 hours' else interval '1 day' end,case when new.status='needs-follow-up' then 'clinical' else 'callback' end)
    on conflict do nothing;
  end if;
  return new;
end $$;
create trigger appointment_followup_after_status after update of status on public.appointments for each row execute function public.create_missed_appointment_followup();

create or replace function public.prevent_audit_mutation()
returns trigger language plpgsql as $$ begin raise exception 'Audit records are immutable' using errcode='42501'; end $$;
create trigger audit_logs_immutable before update or delete on public.audit_logs for each row execute function public.prevent_audit_mutation();

-- Realtime is limited to operational entities; clinical narrative remains query-only.
alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.communications;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.lab_cases;
alter publication supabase_realtime add table public.inventory_items;

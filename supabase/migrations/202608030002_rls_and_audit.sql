-- Tenant isolation, role authorization and immutable audit records.
create or replace function public.is_clinic_member(target_clinic uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.clinic_members m where m.clinic_id = target_clinic and m.user_id = auth.uid() and m.active);
$$;

create or replace function public.has_clinic_role(target_clinic uuid, allowed public.clinic_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.clinic_members m where m.clinic_id = target_clinic and m.user_id = auth.uid() and m.active and m.role = any(allowed));
$$;

create or replace function public.current_member_id(target_clinic uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select m.id from public.clinic_members m where m.clinic_id = target_clinic and m.user_id = auth.uid() and m.active limit 1;
$$;

create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  row_clinic uuid;
  row_id uuid;
  action_name text;
  old_data jsonb;
  new_data jsonb;
begin
  if tg_op = 'DELETE' then
    old_data := to_jsonb(old); new_data := null; row_clinic := old.clinic_id; row_id := old.id; action_name := 'delete';
  elsif tg_op = 'INSERT' then
    old_data := null; new_data := to_jsonb(new); row_clinic := new.clinic_id; row_id := new.id; action_name := 'create';
  else
    old_data := to_jsonb(old); new_data := to_jsonb(new); row_clinic := new.clinic_id; row_id := new.id; action_name := 'update';
  end if;
  insert into public.audit_logs(clinic_id, actor_id, action, entity_type, entity_id, summary, old_values, new_values, request_id)
  values(row_clinic, auth.uid(), action_name, tg_table_name, row_id, initcap(action_name) || ' ' || replace(tg_table_name,'_',' '), old_data, new_data, current_setting('request.headers', true)::jsonb ->> 'x-request-id');
  return coalesce(new, old);
end $$;

-- Audit the highest-risk mutable entities. Communications and payment writes are also audited.
create trigger patients_audit after insert or update or delete on public.patients for each row execute function public.audit_row_change();
create trigger appointments_audit after insert or update or delete on public.appointments for each row execute function public.audit_row_change();
create trigger communications_audit after insert or update or delete on public.communications for each row execute function public.audit_row_change();
create trigger clinical_notes_audit after insert or update or delete on public.clinical_notes for each row execute function public.audit_row_change();
create trigger clinical_media_audit after insert or update or delete on public.clinical_media for each row execute function public.audit_row_change();
create trigger treatment_plans_audit after insert or update or delete on public.treatment_plans for each row execute function public.audit_row_change();
create trigger invoices_audit after insert or update or delete on public.invoices for each row execute function public.audit_row_change();
create trigger payments_audit after insert or update or delete on public.payments for each row execute function public.audit_row_change();
create trigger consents_audit after insert or update or delete on public.consents for each row execute function public.audit_row_change();
create trigger prescriptions_audit after insert or update or delete on public.prescriptions for each row execute function public.audit_row_change();

alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.clinic_members enable row level security;
alter table public.branches enable row level security;
alter table public.chairs enable row level security;
alter table public.patients enable row level security;
alter table public.procedure_types enable row level security;
alter table public.appointments enable row level security;
alter table public.communications enable row level security;
alter table public.tasks enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.clinical_media enable row level security;
alter table public.tooth_records enable row level security;
alter table public.treatment_plans enable row level security;
alter table public.treatment_plan_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.consents enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.lab_cases enable row level security;
alter table public.inventory_items enable row level security;
alter table public.automation_rules enable row level security;
alter table public.message_templates enable row level security;
alter table public.device_tokens enable row level security;
alter table public.integration_connections enable row level security;
alter table public.webhook_events enable row level security;
alter table public.outbox_events enable row level security;
alter table public.audit_logs enable row level security;

create policy clinics_member_read on public.clinics for select using (public.is_clinic_member(id));
create policy clinics_owner_update on public.clinics for update using (public.has_clinic_role(id, array['owner','manager']::public.clinic_role[])) with check (public.has_clinic_role(id, array['owner','manager']::public.clinic_role[]));
create policy profiles_self_read on public.profiles for select using (id = auth.uid());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_self_insert on public.profiles for insert with check (id = auth.uid());
create policy members_clinic_read on public.clinic_members for select using (public.is_clinic_member(clinic_id));
create policy members_admin_write on public.clinic_members for all using (public.has_clinic_role(clinic_id, array['owner','manager']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager']::public.clinic_role[]));

-- Shared clinic configuration.
create policy branches_member_read on public.branches for select using (public.is_clinic_member(clinic_id));
create policy branches_admin_write on public.branches for all using (public.has_clinic_role(clinic_id, array['owner','manager']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager']::public.clinic_role[]));
create policy chairs_member_read on public.chairs for select using (public.is_clinic_member(clinic_id));
create policy chairs_admin_write on public.chairs for all using (public.has_clinic_role(clinic_id, array['owner','manager']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager']::public.clinic_role[]));
create policy procedures_member_read on public.procedure_types for select using (public.is_clinic_member(clinic_id));
create policy procedures_admin_write on public.procedure_types for all using (public.has_clinic_role(clinic_id, array['owner','manager','dentist']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager','dentist']::public.clinic_role[]));

-- Patient administration can be read by active clinic members; updates are restricted by job need.
create policy patients_member_read on public.patients for select using (public.is_clinic_member(clinic_id));
create policy patients_frontdesk_insert on public.patients for insert with check (public.has_clinic_role(clinic_id, array['owner','manager','dentist','receptionist','assistant']::public.clinic_role[]));
create policy patients_frontdesk_update on public.patients for update using (public.has_clinic_role(clinic_id, array['owner','manager','dentist','receptionist','assistant']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager','dentist','receptionist','assistant']::public.clinic_role[]));
create policy patients_admin_delete on public.patients for delete using (public.has_clinic_role(clinic_id, array['owner']::public.clinic_role[]));

create policy appointments_member_read on public.appointments for select using (public.is_clinic_member(clinic_id));
create policy appointments_ops_insert on public.appointments for insert with check (public.has_clinic_role(clinic_id, array['owner','manager','dentist','receptionist','assistant']::public.clinic_role[]));
create policy appointments_ops_update on public.appointments for update using (public.has_clinic_role(clinic_id, array['owner','manager','dentist','receptionist','assistant']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager','dentist','receptionist','assistant']::public.clinic_role[]));
create policy appointments_admin_delete on public.appointments for delete using (public.has_clinic_role(clinic_id, array['owner','manager']::public.clinic_role[]));

create policy communications_member_read on public.communications for select using (public.is_clinic_member(clinic_id));
create policy communications_member_insert on public.communications for insert with check (public.is_clinic_member(clinic_id));
create policy communications_ops_update on public.communications for update using (public.has_clinic_role(clinic_id, array['owner','manager','dentist','receptionist','assistant','billing']::public.clinic_role[])) with check (public.is_clinic_member(clinic_id));
create policy tasks_member_read on public.tasks for select using (public.is_clinic_member(clinic_id));
create policy tasks_member_insert on public.tasks for insert with check (public.is_clinic_member(clinic_id));
create policy tasks_member_update on public.tasks for update using (public.is_clinic_member(clinic_id)) with check (public.is_clinic_member(clinic_id));

-- Clinical records: reception and billing cannot read or mutate narrative clinical data.
create policy clinical_notes_clinical_read on public.clinical_notes for select using (public.has_clinic_role(clinic_id, array['owner','manager','dentist','assistant']::public.clinic_role[]));
create policy clinical_notes_clinical_insert on public.clinical_notes for insert with check (public.has_clinic_role(clinic_id, array['owner','dentist','assistant']::public.clinic_role[]));
create policy clinical_notes_author_update on public.clinical_notes for update using (public.has_clinic_role(clinic_id, array['owner','dentist']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','dentist']::public.clinic_role[]));
create policy media_clinical_read on public.clinical_media for select using (public.has_clinic_role(clinic_id, array['owner','manager','dentist','assistant']::public.clinic_role[]));
create policy media_clinical_write on public.clinical_media for all using (public.has_clinic_role(clinic_id, array['owner','dentist','assistant']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','dentist','assistant']::public.clinic_role[]));
create policy teeth_clinical_read on public.tooth_records for select using (public.has_clinic_role(clinic_id, array['owner','manager','dentist','assistant']::public.clinic_role[]));
create policy teeth_clinical_write on public.tooth_records for all using (public.has_clinic_role(clinic_id, array['owner','dentist','assistant']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','dentist','assistant']::public.clinic_role[]));

create policy plans_member_read on public.treatment_plans for select using (public.is_clinic_member(clinic_id));
create policy plans_clinical_write on public.treatment_plans for all using (public.has_clinic_role(clinic_id, array['owner','manager','dentist']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager','dentist']::public.clinic_role[]));
create policy plan_items_member_read on public.treatment_plan_items for select using (public.is_clinic_member(clinic_id));
create policy plan_items_clinical_write on public.treatment_plan_items for all using (public.has_clinic_role(clinic_id, array['owner','manager','dentist']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager','dentist']::public.clinic_role[]));

create policy invoices_member_read on public.invoices for select using (public.is_clinic_member(clinic_id));
create policy invoices_billing_write on public.invoices for all using (public.has_clinic_role(clinic_id, array['owner','manager','billing','receptionist']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager','billing','receptionist']::public.clinic_role[]));
create policy invoice_items_member_read on public.invoice_items for select using (public.is_clinic_member(clinic_id));
create policy invoice_items_billing_write on public.invoice_items for all using (public.has_clinic_role(clinic_id, array['owner','manager','billing']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager','billing']::public.clinic_role[]));
create policy payments_member_read on public.payments for select using (public.is_clinic_member(clinic_id));
create policy payments_billing_insert on public.payments for insert with check (public.has_clinic_role(clinic_id, array['owner','manager','billing','receptionist']::public.clinic_role[]));
create policy payments_admin_update on public.payments for update using (public.has_clinic_role(clinic_id, array['owner','manager','billing']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager','billing']::public.clinic_role[]));

create policy consents_member_read on public.consents for select using (public.is_clinic_member(clinic_id));
create policy consents_clinical_write on public.consents for all using (public.has_clinic_role(clinic_id, array['owner','manager','dentist','assistant']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager','dentist','assistant']::public.clinic_role[]));
create policy prescriptions_clinical_read on public.prescriptions for select using (public.has_clinic_role(clinic_id, array['owner','manager','dentist','assistant']::public.clinic_role[]));
create policy prescriptions_dentist_write on public.prescriptions for all using (public.has_clinic_role(clinic_id, array['owner','dentist']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','dentist']::public.clinic_role[]));
create policy prescription_items_clinical_read on public.prescription_items for select using (public.has_clinic_role(clinic_id, array['owner','manager','dentist','assistant']::public.clinic_role[]));
create policy prescription_items_dentist_write on public.prescription_items for all using (public.has_clinic_role(clinic_id, array['owner','dentist']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','dentist']::public.clinic_role[]));

create policy labs_member_read on public.lab_cases for select using (public.is_clinic_member(clinic_id));
create policy labs_ops_write on public.lab_cases for all using (public.has_clinic_role(clinic_id, array['owner','manager','dentist','assistant','receptionist']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager','dentist','assistant','receptionist']::public.clinic_role[]));
create policy inventory_member_read on public.inventory_items for select using (public.is_clinic_member(clinic_id));
create policy inventory_ops_write on public.inventory_items for all using (public.has_clinic_role(clinic_id, array['owner','manager','assistant']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager','assistant']::public.clinic_role[]));
create policy automations_member_read on public.automation_rules for select using (public.is_clinic_member(clinic_id));
create policy automations_admin_write on public.automation_rules for all using (public.has_clinic_role(clinic_id, array['owner','manager']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager']::public.clinic_role[]));
create policy templates_member_read on public.message_templates for select using (public.is_clinic_member(clinic_id));
create policy templates_admin_write on public.message_templates for all using (public.has_clinic_role(clinic_id, array['owner','manager','dentist']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager','dentist']::public.clinic_role[]));

create policy device_tokens_self_read on public.device_tokens for select using (user_id = auth.uid() and public.is_clinic_member(clinic_id));
create policy device_tokens_self_write on public.device_tokens for all using (user_id = auth.uid() and public.is_clinic_member(clinic_id)) with check (user_id = auth.uid() and public.is_clinic_member(clinic_id));
create policy integrations_admin_read on public.integration_connections for select using (public.has_clinic_role(clinic_id, array['owner','manager']::public.clinic_role[]));
create policy integrations_admin_write on public.integration_connections for all using (public.has_clinic_role(clinic_id, array['owner','manager']::public.clinic_role[])) with check (public.has_clinic_role(clinic_id, array['owner','manager']::public.clinic_role[]));
create policy audit_admin_read on public.audit_logs for select using (public.has_clinic_role(clinic_id, array['owner','manager']::public.clinic_role[]));

-- webhook_events and outbox_events deliberately have no authenticated-user policies; service-role edge functions own them.
revoke insert, update, delete on public.audit_logs from authenticated;
revoke all on public.webhook_events, public.outbox_events from authenticated;

-- Patient portal, public booking, branch pricing, signed consent, refunds and stock ledger.
alter table public.clinics add column if not exists public_slug text;
update public.clinics set public_slug = lower(regexp_replace(name,'[^a-zA-Z0-9]+','-','g')) || '-' || substr(replace(id::text,'-',''),1,6) where public_slug is null;
alter table public.clinics alter column public_slug set not null;
create unique index if not exists clinics_public_slug_idx on public.clinics(public_slug);

alter table public.consents add column if not exists signature_data jsonb;
alter table public.consents add column if not exists signed_ip inet;
alter table public.consents add column if not exists signed_user_agent text;
alter table public.consents add column if not exists attestation text;

create table if not exists public.branch_procedure_prices (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  procedure_type_id uuid not null references public.procedure_types(id) on delete cascade,
  fee numeric(12,2) not null check(fee >= 0),
  duration_minutes integer check(duration_minutes between 5 and 720),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(branch_id, procedure_type_id)
);
create index if not exists branch_procedure_prices_clinic_idx on public.branch_procedure_prices(clinic_id,branch_id);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,
  patient_id uuid references public.patients(id) on delete set null,
  type text not null check(type in ('purchase','consumption','adjustment','waste','return')),
  quantity numeric(12,3) not null check(quantity > 0),
  unit_cost numeric(12,2),
  reason text,
  performed_by uuid not null references public.clinic_members(id),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists inventory_movements_item_time_idx on public.inventory_movements(inventory_item_id,occurred_at desc);
create index if not exists inventory_movements_clinic_time_idx on public.inventory_movements(clinic_id,occurred_at desc);

create table if not exists public.payment_refunds (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete restrict,
  amount numeric(12,2) not null check(amount > 0),
  reason text not null check(char_length(reason) between 3 and 500),
  refunded_by uuid not null references public.clinic_members(id),
  provider_refund_id text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique(clinic_id,idempotency_key)
);
create index if not exists payment_refunds_payment_idx on public.payment_refunds(payment_id,created_at desc);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  patient_id uuid references public.patients(id) on delete set null,
  requested_name text not null check(char_length(requested_name) between 2 and 120),
  phone text not null,
  email citext,
  preferred_date date,
  preferred_window text,
  reason text,
  status text not null default 'new' check(status in ('new','contacted','converted','declined','spam')),
  source text not null default 'website' check(source in ('website','whatsapp','qr','referral')),
  consent_to_contact boolean not null default false,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists booking_requests_clinic_status_idx on public.booking_requests(clinic_id,status,created_at desc);
create index if not exists booking_requests_rate_idx on public.booking_requests(ip_hash,created_at desc);

create table if not exists public.patient_portal_tokens (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  token_hash text not null unique,
  scope text not null check(scope in ('intake','appointment-response','payment','consent')),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check(expires_at > created_at)
);
create index if not exists patient_portal_tokens_lookup_idx on public.patient_portal_tokens(token_hash,scope,expires_at) where used_at is null and revoked_at is null;

alter table public.branch_procedure_prices enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.payment_refunds enable row level security;
alter table public.booking_requests enable row level security;
alter table public.patient_portal_tokens enable row level security;

create policy branch_prices_member_read on public.branch_procedure_prices for select using(public.is_clinic_member(clinic_id));
create policy branch_prices_admin_write on public.branch_procedure_prices for all using(public.has_clinic_role(clinic_id,array['owner','manager','dentist']::public.clinic_role[])) with check(public.has_clinic_role(clinic_id,array['owner','manager','dentist']::public.clinic_role[]));
create policy inventory_movements_member_read on public.inventory_movements for select using(public.is_clinic_member(clinic_id));
create policy inventory_movements_ops_insert on public.inventory_movements for insert with check(public.has_clinic_role(clinic_id,array['owner','manager','assistant','dentist']::public.clinic_role[]));
create policy payment_refunds_member_read on public.payment_refunds for select using(public.is_clinic_member(clinic_id));
create policy booking_requests_member_read on public.booking_requests for select using(public.is_clinic_member(clinic_id));
create policy booking_requests_ops_update on public.booking_requests for update using(public.has_clinic_role(clinic_id,array['owner','manager','receptionist']::public.clinic_role[])) with check(public.has_clinic_role(clinic_id,array['owner','manager','receptionist']::public.clinic_role[]));
-- Public inserts and token reads are service-role only through Edge Functions.
revoke all on public.patient_portal_tokens from authenticated;
revoke insert, delete on public.booking_requests from authenticated;

create trigger branch_procedure_prices_updated before update on public.branch_procedure_prices for each row execute function public.set_updated_at();
create trigger booking_requests_updated before update on public.booking_requests for each row execute function public.set_updated_at();
create trigger branch_procedure_prices_audit after insert or update or delete on public.branch_procedure_prices for each row execute function public.audit_row_change();
create trigger inventory_movements_audit after insert or update or delete on public.inventory_movements for each row execute function public.audit_row_change();
create trigger payment_refunds_audit after insert or update or delete on public.payment_refunds for each row execute function public.audit_row_change();
create trigger booking_requests_audit after update or delete on public.booking_requests for each row execute function public.audit_row_change();

create or replace function public.sign_consent(p_clinic_id uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_consent public.consents; v_headers jsonb := coalesce(nullif(current_setting('request.headers',true),'')::jsonb,'{}'::jsonb);
begin
  perform public.require_role(p_clinic_id,array['owner','manager','dentist','assistant','receptionist']::public.clinic_role[]);
  select * into strict v_consent from public.consents where id=(p_payload->>'consentId')::uuid and clinic_id=p_clinic_id for update;
  if v_consent.status not in ('draft','sent') then raise exception 'Consent is not available for signing'; end if;
  if char_length(trim(coalesce(p_payload->>'signedByName',''))) < 2 then raise exception 'Signer name is required'; end if;
  if jsonb_array_length(coalesce(p_payload->'signatureData'->'strokes','[]'::jsonb))=0 then raise exception 'Signature is required'; end if;
  update public.consents set status='signed',signed_by_name=trim(p_payload->>'signedByName'),guardian_name=nullif(p_payload->>'guardianName',''),witness_name=nullif(p_payload->>'witnessName',''),signature_data=p_payload->'signatureData',attestation=left(coalesce(p_payload->>'attestation',''),2000),signed_at=now(),signed_ip=nullif(split_part(v_headers->>'x-forwarded-for',',',1),'')::inet,signed_user_agent=left(v_headers->>'user-agent',500) where id=v_consent.id returning * into v_consent;
  if v_consent.appointment_id is not null then update public.appointments set readiness=jsonb_set(readiness,'{consentReady}','true'::jsonb,true) where id=v_consent.appointment_id; end if;
  return to_jsonb(v_consent);
end $$;
grant execute on function public.sign_consent(uuid,jsonb) to authenticated;

create or replace function public.refund_payment(p_clinic_id uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_payment public.payments; v_invoice public.invoices; v_amount numeric; v_refund public.payment_refunds; v_key text;
begin
  perform public.require_role(p_clinic_id,array['owner','manager','billing']::public.clinic_role[]);
  select * into strict v_payment from public.payments where id=(p_payload->>'paymentId')::uuid and clinic_id=p_clinic_id for update;
  v_amount:=coalesce((p_payload->>'amount')::numeric,0); if v_amount<=0 or v_amount>v_payment.amount-v_payment.refund_amount then raise exception 'Refund exceeds refundable balance'; end if;
  if char_length(trim(coalesce(p_payload->>'reason','')))<3 then raise exception 'Refund reason is required'; end if;
  v_key:=nullif(p_payload->>'idempotencyKey','');
  if v_key is null then raise exception 'Refund idempotency key is required'; end if;
  insert into public.payment_refunds(clinic_id,payment_id,amount,reason,refunded_by,idempotency_key)
  values(p_clinic_id,v_payment.id,v_amount,trim(p_payload->>'reason'),public.current_member_id(p_clinic_id),v_key)
  on conflict(clinic_id,idempotency_key) do nothing returning * into v_refund;
  if v_refund.id is null then return to_jsonb(v_payment); end if;
  update public.payments set refund_amount=refund_amount+v_amount,status=case when refund_amount+v_amount>=amount then 'refunded' else 'partially-refunded' end where id=v_payment.id returning * into v_payment;
  if v_payment.invoice_id is not null then
    select * into v_invoice from public.invoices where id=v_payment.invoice_id for update;
    update public.invoices set paid=greatest(0,paid-v_amount),balance=least(total,balance+v_amount),status=case when paid-v_amount<=0 then 'issued' else 'partial' end where id=v_invoice.id;
  end if;
  update public.patients p set balance=coalesce((select sum(i.balance) from public.invoices i where i.patient_id=p.id and i.status not in ('voided','refunded')),0),lifetime_value=greatest(0,lifetime_value-v_amount) where p.id=v_payment.patient_id;
  insert into public.outbox_events(clinic_id,topic,aggregate_type,aggregate_id,payload) values(p_clinic_id,'payment.refunded','payment',v_payment.id,jsonb_build_object('paymentId',v_payment.id,'refundId',v_refund.id,'amount',v_amount));
  return to_jsonb(v_payment);
end $$;
grant execute on function public.refund_payment(uuid,jsonb) to authenticated;

create or replace function public.record_inventory_movement(p_clinic_id uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_item public.inventory_items; v_quantity numeric; v_delta numeric; v_type text; v_movement public.inventory_movements;
begin
  perform public.require_role(p_clinic_id,array['owner','manager','assistant','dentist']::public.clinic_role[]);
  select * into strict v_item from public.inventory_items where id=(p_payload->>'inventoryItemId')::uuid and clinic_id=p_clinic_id for update;
  v_quantity:=coalesce((p_payload->>'quantity')::numeric,0); v_type:=p_payload->>'type'; if v_quantity<=0 then raise exception 'Quantity must be positive'; end if;
  if v_type not in ('purchase','consumption','adjustment','waste','return') then raise exception 'Invalid inventory movement'; end if;
  v_delta:=case when v_type in ('purchase','return','adjustment') then v_quantity else -v_quantity end;
  if v_item.current_quantity+v_delta<0 then raise exception 'Insufficient stock'; end if;
  insert into public.inventory_movements(clinic_id,inventory_item_id,appointment_id,patient_id,type,quantity,unit_cost,reason,performed_by) values(p_clinic_id,v_item.id,nullif(p_payload->>'appointmentId','')::uuid,nullif(p_payload->>'patientId','')::uuid,v_type,v_quantity,nullif(p_payload->>'unitCost','')::numeric,nullif(p_payload->>'reason',''),public.current_member_id(p_clinic_id)) returning * into v_movement;
  update public.inventory_items set current_quantity=current_quantity+v_delta where id=v_item.id returning * into v_item;
  return to_jsonb(v_item)||jsonb_build_object('movementId',v_movement.id);
end $$;
grant execute on function public.record_inventory_movement(uuid,jsonb) to authenticated;

create or replace function public.withdraw_consent(p_clinic_id uuid,p_consent_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_consent public.consents;
begin
  perform public.require_role(p_clinic_id,array['owner','manager','dentist']::public.clinic_role[]);
  update public.consents set status='withdrawn',withdrawn_at=now() where id=p_consent_id and clinic_id=p_clinic_id and status='signed' returning * into v_consent;
  if v_consent.id is null then raise exception 'Signed consent not found'; end if;
  return to_jsonb(v_consent);
end $$;
grant execute on function public.withdraw_consent(uuid,uuid,text) to authenticated;

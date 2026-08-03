-- Transactional application boundary. Clients use these functions for multi-table workflows.
create or replace function public.require_role(p_clinic_id uuid, p_roles public.clinic_role[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_clinic_role(p_clinic_id, p_roles) then
    raise exception 'Not authorized for this clinic operation' using errcode = '42501';
  end if;
end $$;

create or replace function public.create_clinic(
  p_name text, p_phone text, p_email text, p_city text, p_timezone text default 'Asia/Kolkata', p_currency text default 'INR', p_locale text default 'en-IN'
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_clinic uuid; v_branch uuid; v_member uuid; v_user_name text; v_user_email text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if exists(select 1 from public.clinic_members where user_id=auth.uid() and active) then raise exception 'User already belongs to an active clinic'; end if;
  select coalesce(raw_user_meta_data->>'name', split_part(email,'@',1)), email into v_user_name,v_user_email from auth.users where id=auth.uid();
  insert into public.clinics(name, phone, email, timezone, currency, locale, address)
  values(p_name,p_phone,coalesce(nullif(p_email,''),v_user_email),p_timezone,p_currency,p_locale,jsonb_build_object('city',p_city,'country','India')) returning id into v_clinic;
  insert into public.profiles(id,display_name,phone) values(auth.uid(),v_user_name,p_phone) on conflict(id) do update set display_name=excluded.display_name;
  insert into public.clinic_members(clinic_id,user_id,role,name,phone,email,initials,color_token)
  values(v_clinic,auth.uid(),'owner',v_user_name,p_phone,v_user_email,upper(left(v_user_name,2)),'navy') returning id into v_member;
  insert into public.branches(clinic_id,name,code,address,phone,email) values(v_clinic,p_name || ' Main','MAIN',jsonb_build_object('city',p_city,'country','India'),p_phone,coalesce(nullif(p_email,''),v_user_email)) returning id into v_branch;
  insert into public.chairs(clinic_id,branch_id,name) values(v_clinic,v_branch,'Chair 1'),(v_clinic,v_branch,'Chair 2');
  insert into public.procedure_types(clinic_id,code,name,category,default_duration_minutes,default_fee,requires_consent,follow_up_days) values
    (v_clinic,'CONSULT','Consultation','General',30,500,false,null),(v_clinic,'CLEAN','Scaling and polishing','Preventive',45,1800,false,180),
    (v_clinic,'FILL','Composite filling','Restorative',45,2500,true,7),(v_clinic,'RCT','Root canal treatment','Endodontics',75,8000,true,7),
    (v_clinic,'EXTRACT','Extraction','Oral surgery',45,3500,true,7),(v_clinic,'CROWN','Crown preparation','Prosthodontics',60,12000,true,7),
    (v_clinic,'IMPLANT','Implant consultation','Implantology',45,1000,true,7),(v_clinic,'ORTHO','Orthodontic review','Orthodontics',30,1500,false,30),
    (v_clinic,'EMERGENCY','Emergency pain visit','Emergency',30,800,false,1);
  insert into public.message_templates(clinic_id,name,channel,category,body,variables,approved,active) values
    (v_clinic,'Appointment confirmation','whatsapp','appointment','Hello {{patient_name}}, your appointment is booked for {{appointment_time}} with {{doctor_name}}. Reply CONFIRM or use the secure reschedule link.',array['patient_name','appointment_time','doctor_name'],false,true),
    (v_clinic,'Post-treatment check','whatsapp','clinical-follow-up','Hello {{patient_name}}, how are you feeling after your treatment? Reply with pain, swelling, bleeding or any concern. This is not emergency care.',array['patient_name'],false,true),
    (v_clinic,'Payment receipt','email','billing','Your receipt {{receipt_number}} for {{amount}} is attached. Contact the clinic if any detail needs correction.',array['receipt_number','amount'],true,true);
  return v_clinic;
end $$;

grant execute on function public.create_clinic(text,text,text,text,text,text,text) to authenticated;

create or replace function public.create_patient_intake(p_clinic_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_patient public.patients; v_alerts jsonb := '[]'::jsonb; v_meds jsonb := '[]'::jsonb;
begin
  perform public.require_role(p_clinic_id,array['owner','manager','dentist','receptionist','assistant']::public.clinic_role[]);
  if coalesce(p_payload->>'allergies','') <> '' then v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'label',p_payload->>'allergies','severity','high','category','allergy')); end if;
  if coalesce(p_payload->>'medicalConditions','') <> '' then v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'label',p_payload->>'medicalConditions','severity','moderate','category','condition')); end if;
  if coalesce(p_payload->>'medications','') <> '' then
    select coalesce(jsonb_agg(jsonb_build_object('id',gen_random_uuid(),'name',trim(x))), '[]'::jsonb) into v_meds from unnest(string_to_array(p_payload->>'medications',',')) x where trim(x)<>'';
  end if;
  if exists(select 1 from public.patients where clinic_id=p_clinic_id and archived_at is null and regexp_replace(phone,'\D','','g')=regexp_replace(p_payload->>'phone','\D','','g') and lower(first_name)=lower(p_payload->>'firstName')) then
    raise exception 'A patient with this name and phone may already exist' using errcode='23505';
  end if;
  insert into public.patients(clinic_id,first_name,last_name,date_of_birth,gender,phone,email,preferred_language,preferred_contact,
    emergency_contact,medical_alerts,medications,intake_complete,intake_verified,whatsapp_consent,photo_consent,created_by)
  values(p_clinic_id,p_payload->>'firstName',coalesce(p_payload->>'lastName',''),(p_payload->>'dateOfBirth')::date,coalesce(p_payload->>'gender','undisclosed'),
    p_payload->>'phone',nullif(p_payload->>'email',''),coalesce(p_payload->>'preferredLanguage','English'),coalesce(p_payload->>'preferredContact','whatsapp'),
    case when coalesce(p_payload->>'emergencyName','')<>'' then jsonb_build_object('name',p_payload->>'emergencyName','relationship',coalesce(p_payload->>'emergencyRelationship','Emergency contact'),'phone',p_payload->>'emergencyPhone') end,
    v_alerts,v_meds,true,false,coalesce((p_payload->>'whatsappConsent')::boolean,false),coalesce((p_payload->>'photoConsent')::boolean,false),auth.uid()) returning * into v_patient;
  return to_jsonb(v_patient) || jsonb_build_object('age',extract(year from age(current_date,v_patient.date_of_birth))::int);
end $$;
grant execute on function public.create_patient_intake(uuid,jsonb) to authenticated;

create or replace function public.create_appointment_with_workflow(p_clinic_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
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
  insert into public.appointments(clinic_id,branch_id,patient_id,patient_name,doctor_member_id,doctor_name,chair_id,chair_name,procedure_type_id,procedure_name,status,starts_at,ends_at,duration_minutes,internal_note,source,confirmation_status,reminder_status,estimated_fee,deposit_required,readiness,created_by)
  values(p_clinic_id,v_chair.branch_id,v_patient.id,v_patient.display_name,v_member.id,v_member.name,v_chair.id,v_chair.name,v_proc.id,v_proc.name,case when v_send then 'awaiting-confirmation' else 'confirmed' end,v_start,v_end,extract(epoch from(v_end-v_start))/60,nullif(p_payload->>'internalNote',''),'staff',case when v_send then 'sent' else 'confirmed' end,'scheduled',v_proc.default_fee,case when coalesce((p_payload->>'requestDeposit')::boolean,false) then coalesce((p_payload->>'depositAmount')::numeric,0) else 0 end,
  jsonb_build_object('intakeComplete',v_patient.intake_complete,'medicalHistoryVerified',v_patient.intake_verified,'consentReady',not v_proc.requires_consent,'labCaseReady',true,'paymentReady',v_patient.balance<10000),auth.uid()) returning * into v_appt;
  update public.patients set next_appointment_at=v_start where id=v_patient.id;
  if v_send then
    insert into public.communications(clinic_id,patient_id,channel,direction,status,body,phone,unread,requires_follow_up,related_appointment_id,created_by)
    values(p_clinic_id,v_patient.id,'whatsapp','outbound','queued','Appointment confirmation for '||to_char(v_start at time zone (select timezone from public.clinics where id=p_clinic_id),'DD Mon YYYY, HH12:MI AM'),v_patient.phone,false,false,v_appt.id,auth.uid());
    insert into public.outbox_events(clinic_id,topic,aggregate_type,aggregate_id,payload) values(p_clinic_id,'communication.whatsapp','appointment',v_appt.id,jsonb_build_object('appointmentId',v_appt.id,'patientId',v_patient.id));
  end if;
  return to_jsonb(v_appt);
end $$;
grant execute on function public.create_appointment_with_workflow(uuid,jsonb) to authenticated;

create or replace function public.transition_appointment(p_clinic_id uuid,p_appointment_id uuid,p_next_status public.appointment_status)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v public.appointments; allowed boolean := false;
begin
  perform public.require_role(p_clinic_id,array['owner','manager','dentist','receptionist','assistant']::public.clinic_role[]);
  select * into strict v from public.appointments where id=p_appointment_id and clinic_id=p_clinic_id for update;
  allowed := case v.status
    when 'draft' then p_next_status in ('requested','awaiting-confirmation','confirmed','cancelled')
    when 'requested' then p_next_status in ('awaiting-confirmation','confirmed','cancelled')
    when 'awaiting-confirmation' then p_next_status in ('confirmed','cancelled','no-show')
    when 'confirmed' then p_next_status in ('checked-in','cancelled','no-show')
    when 'checked-in' then p_next_status in ('waiting','in-chair','cancelled')
    when 'waiting' then p_next_status in ('in-chair','cancelled','no-show')
    when 'in-chair' then p_next_status in ('paused','completed','needs-follow-up')
    when 'paused' then p_next_status in ('in-chair','completed','needs-follow-up')
    when 'completed' then p_next_status='needs-follow-up'
    else false end;
  if not allowed then raise exception 'Invalid appointment transition: % to %',v.status,p_next_status; end if;
  update public.appointments set status=p_next_status,version=version+1,
    checked_in_at=case when p_next_status='checked-in' then now() else checked_in_at end,
    chair_started_at=case when p_next_status='in-chair' then now() else chair_started_at end,
    completed_at=case when p_next_status='completed' then now() else completed_at end
    where id=v.id returning * into v;
  if p_next_status='completed' then update public.patients set last_visit_at=now(),next_appointment_at=null where id=v.patient_id; end if;
  insert into public.outbox_events(clinic_id,topic,aggregate_type,aggregate_id,payload) values(p_clinic_id,'appointment.status_changed','appointment',v.id,jsonb_build_object('status',p_next_status,'patientId',v.patient_id));
  return to_jsonb(v);
end $$;
grant execute on function public.transition_appointment(uuid,uuid,public.appointment_status) to authenticated;

create or replace function public.log_communication(p_clinic_id uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v public.communications; v_patient public.patients; v_channel public.communication_channel; v_follow boolean;
begin
  perform public.require_role(p_clinic_id,array['owner','manager','dentist','receptionist','assistant','billing']::public.clinic_role[]);
  if p_payload->>'patientId' is not null then select * into v_patient from public.patients where id=(p_payload->>'patientId')::uuid and clinic_id=p_clinic_id; end if;
  v_channel := (p_payload->>'channel')::public.communication_channel; v_follow:=coalesce((p_payload->>'requiresFollowUp')::boolean,false);
  insert into public.communications(clinic_id,patient_id,channel,direction,status,subject,body,phone,email,unread,requires_follow_up,follow_up_at,assigned_to,related_appointment_id,created_by,call_outcome)
  values(p_clinic_id,v_patient.id,v_channel,case when v_channel='internal' then 'internal' else 'outbound' end,case when v_channel='call' then 'completed' else 'queued' end,p_payload->>'subject',p_payload->>'body',coalesce(p_payload->>'phone',v_patient.phone),coalesce(p_payload->>'email',v_patient.email::text),false,v_follow,nullif(p_payload->>'followUpAt','')::timestamptz,case when v_follow then public.current_member_id(p_clinic_id) end,nullif(p_payload->>'relatedAppointmentId','')::uuid,auth.uid(),case when v_channel='call' then 'answered' end) returning * into v;
  if v_follow then insert into public.tasks(clinic_id,title,description,patient_id,appointment_id,assigned_to,created_by,priority,category,due_at) values(p_clinic_id,'Follow up '||v_channel::text,coalesce(p_payload->>'body',p_payload->>'subject'),v_patient.id,v.related_appointment_id,public.current_member_id(p_clinic_id),auth.uid(),'normal','callback',v.follow_up_at); end if;
  if v_channel in ('whatsapp','email','sms') then insert into public.outbox_events(clinic_id,topic,aggregate_type,aggregate_id,payload) values(p_clinic_id,'communication.'||v_channel::text,'communication',v.id,jsonb_build_object('communicationId',v.id)); end if;
  return to_jsonb(v) || jsonb_build_object('patient_name',v_patient.display_name);
end $$;
grant execute on function public.log_communication(uuid,jsonb) to authenticated;

create or replace function public.record_payment(p_clinic_id uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_payment public.payments; v_invoice public.invoices; v_amount numeric; v_receipt text; v_key text;
begin
  perform public.require_role(p_clinic_id,array['owner','manager','billing','receptionist']::public.clinic_role[]);
  v_amount:=(p_payload->>'amount')::numeric; if v_amount<=0 then raise exception 'Payment amount must be positive'; end if;
  v_key:=coalesce(nullif(p_payload->>'idempotencyKey',''),encode(digest(auth.uid()::text||p_payload::text,'sha256'),'hex'));
  select * into v_payment from public.payments where clinic_id=p_clinic_id and idempotency_key=v_key;
  if found then return to_jsonb(v_payment); end if;
  if nullif(p_payload->>'invoiceId','') is not null then select * into strict v_invoice from public.invoices where id=(p_payload->>'invoiceId')::uuid and clinic_id=p_clinic_id for update; if v_amount>v_invoice.balance then raise exception 'Payment exceeds invoice balance'; end if; end if;
  v_receipt:='RCPT-'||to_char(now(),'YYYY')||'-'||to_char(nextval('public.receipt_number_seq'),'FM000000');
  insert into public.payments(clinic_id,patient_id,invoice_id,receipt_number,amount,method,reference,received_by,status,idempotency_key)
  values(p_clinic_id,(p_payload->>'patientId')::uuid,nullif(p_payload->>'invoiceId','')::uuid,v_receipt,v_amount,(p_payload->>'method')::public.payment_method,nullif(p_payload->>'reference',''),public.current_member_id(p_clinic_id),'completed',v_key) returning * into v_payment;
  if v_invoice.id is not null then update public.invoices set paid=paid+v_amount,balance=greatest(0,balance-v_amount),status=case when balance-v_amount<=0 then 'paid' when paid+v_amount>0 then 'partial' else status end where id=v_invoice.id; end if;
  update public.patients p set balance=coalesce((select sum(i.balance) from public.invoices i where i.patient_id=p.id and i.status not in ('voided','refunded')),0), lifetime_value=p.lifetime_value+v_amount where p.id=v_payment.patient_id;
  if coalesce((p_payload->>'sendReceipt')::boolean,false) then insert into public.outbox_events(clinic_id,topic,aggregate_type,aggregate_id,payload) values(p_clinic_id,'receipt.created','payment',v_payment.id,jsonb_build_object('paymentId',v_payment.id,'patientId',v_payment.patient_id)); end if;
  return to_jsonb(v_payment);
end $$;
grant execute on function public.record_payment(uuid,jsonb) to authenticated;

create or replace function public.get_dashboard_snapshot(p_clinic_id uuid,p_date date)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_start timestamptz; v_end timestamptz; v_clinic public.clinics; v_member public.clinic_members;
begin
  if not public.is_clinic_member(p_clinic_id) then raise exception 'Not authorized' using errcode='42501'; end if;
  select * into strict v_clinic from public.clinics where id=p_clinic_id;
  select * into strict v_member from public.clinic_members where clinic_id=p_clinic_id and user_id=auth.uid() and active;
  v_start := (p_date::text||' 00:00')::timestamp at time zone v_clinic.timezone; v_end:=v_start+interval '1 day';
  return jsonb_build_object(
    'clinic',to_jsonb(v_clinic),'current_staff',to_jsonb(v_member),
    'appointments',coalesce((select jsonb_agg(to_jsonb(a) order by a.starts_at) from public.appointments a where a.clinic_id=p_clinic_id and a.starts_at>=v_start and a.starts_at<v_end),'[]'::jsonb),
    'waiting',coalesce((select jsonb_agg(to_jsonb(a) order by coalesce(a.checked_in_at,a.starts_at)) from public.appointments a where a.clinic_id=p_clinic_id and a.starts_at>=v_start and a.starts_at<v_end and a.status in ('checked-in','waiting','in-chair')),'[]'::jsonb),
    'tasks',coalesce((select jsonb_agg(to_jsonb(t)||jsonb_build_object('assigned_to_name',m.name) order by t.due_at nulls last) from public.tasks t join public.clinic_members m on m.id=t.assigned_to where t.clinic_id=p_clinic_id and t.status not in ('done','cancelled') limit 50),'[]'::jsonb),
    'missed_calls',coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('patient_name',p.display_name) order by c.occurred_at desc) from public.communications c left join public.patients p on p.id=c.patient_id where c.clinic_id=p_clinic_id and c.channel='call' and c.status='missed' and c.requires_follow_up),'[]'::jsonb),
    'lab_due',coalesce((select jsonb_agg(to_jsonb(l)) from public.lab_cases l where l.clinic_id=p_clinic_id and (l.due_at::date=p_date or l.status='delayed')),'[]'::jsonb),
    'overdue_invoices',coalesce((select jsonb_agg(to_jsonb(i)) from public.invoices i where i.clinic_id=p_clinic_id and i.status='overdue'),'[]'::jsonb),
    'follow_ups',coalesce((select jsonb_agg(to_jsonb(t)||jsonb_build_object('assigned_to_name',m.name)) from public.tasks t join public.clinic_members m on m.id=t.assigned_to where t.clinic_id=p_clinic_id and t.status not in ('done','cancelled') and t.category in ('callback','clinical','recall')),'[]'::jsonb),
    'metrics',jsonb_build_object(
      'appointments_today',(select count(*) from public.appointments where clinic_id=p_clinic_id and starts_at>=v_start and starts_at<v_end),
      'confirmed',(select count(*) from public.appointments where clinic_id=p_clinic_id and starts_at>=v_start and starts_at<v_end and status='confirmed'),
      'waiting',(select count(*) from public.appointments where clinic_id=p_clinic_id and starts_at>=v_start and starts_at<v_end and status in ('checked-in','waiting')),
      'in_chair',(select count(*) from public.appointments where clinic_id=p_clinic_id and starts_at>=v_start and starts_at<v_end and status='in-chair'),
      'unconfirmed',(select count(*) from public.appointments where clinic_id=p_clinic_id and starts_at>=v_start and starts_at<v_end and status in ('requested','awaiting-confirmation')),
      'collections_today',coalesce((select sum(amount-refund_amount) from public.payments where clinic_id=p_clinic_id and received_at>=v_start and received_at<v_end and status in ('completed','partially-refunded')),0),
      'outstanding',coalesce((select sum(balance) from public.invoices where clinic_id=p_clinic_id and status not in ('voided','refunded')),0),
      'missed_calls',(select count(*) from public.communications where clinic_id=p_clinic_id and channel='call' and status='missed' and requires_follow_up)
    )
  );
end $$;
grant execute on function public.get_dashboard_snapshot(uuid,date) to authenticated;

create or replace function public.get_patient_record(p_clinic_id uuid,p_patient_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_patient public.patients;
begin
  if not public.is_clinic_member(p_clinic_id) then raise exception 'Not authorized' using errcode='42501'; end if;
  select * into strict v_patient from public.patients where id=p_patient_id and clinic_id=p_clinic_id;
  return jsonb_build_object(
    'patient',to_jsonb(v_patient)||jsonb_build_object('age',extract(year from age(current_date,v_patient.date_of_birth))::int),
    'appointments',coalesce((select jsonb_agg(to_jsonb(a) order by a.starts_at desc) from public.appointments a where a.patient_id=p_patient_id),'[]'::jsonb),
    'timeline',coalesce((select jsonb_agg(x.event order by (x.event->>'occurred_at') desc) from (
      select jsonb_build_object('id',a.id,'clinic_id',a.clinic_id,'patient_id',a.patient_id,'occurred_at',a.starts_at,'type','appointment','title',a.procedure_name,'description',a.status::text,'actor_name',a.doctor_name,'source_id',a.id,'source_type','appointment','icon','calendar','tone',case when a.status='completed' then 'success' when a.status in ('cancelled','no-show') then 'danger' else 'info' end) event from public.appointments a where a.patient_id=p_patient_id
      union all select jsonb_build_object('id',n.id,'clinic_id',n.clinic_id,'patient_id',n.patient_id,'occurred_at',n.created_at,'type','clinical','title',coalesce(n.content->>'procedurePerformed',n.content->>'findings','Clinical note'),'description',n.content->>'chiefComplaint','source_id',n.id,'source_type','clinical_note','icon','file-text','tone',case when n.status='signed' then 'success' else 'warning' end) from public.clinical_notes n where n.patient_id=p_patient_id and public.has_clinic_role(p_clinic_id,array['owner','manager','dentist','assistant']::public.clinic_role[])
      union all select jsonb_build_object('id',c.id,'clinic_id',c.clinic_id,'patient_id',c.patient_id,'occurred_at',c.occurred_at,'type','communication','title',initcap(c.channel::text),'description',coalesce(c.body,c.subject,c.call_outcome),'source_id',c.id,'source_type','communication','icon','message','tone',case when c.status in ('failed','missed') then 'danger' else 'neutral' end) from public.communications c where c.patient_id=p_patient_id
      union all select jsonb_build_object('id',p.id,'clinic_id',p.clinic_id,'patient_id',p.patient_id,'occurred_at',p.received_at,'type','payment','title','Payment received','description',p.receipt_number,'source_id',p.id,'source_type','payment','icon','receipt','tone','success') from public.payments p where p.patient_id=p_patient_id
      union all select jsonb_build_object('id',co.id,'clinic_id',co.clinic_id,'patient_id',co.patient_id,'occurred_at',coalesce(co.signed_at,co.sent_at,co.created_at),'type','consent','title',co.template_name,'description',co.status::text,'source_id',co.id,'source_type','consent','icon','signature','tone',case when co.status='signed' then 'success' else 'warning' end) from public.consents co where co.patient_id=p_patient_id
    ) x),'[]'::jsonb),
    'notes',case when public.has_clinic_role(p_clinic_id,array['owner','manager','dentist','assistant']::public.clinic_role[]) then coalesce((select jsonb_agg(to_jsonb(n)-'content'||n.content||jsonb_build_object('author_name',m.name) order by n.created_at desc) from public.clinical_notes n join public.clinic_members m on m.id=n.author_member_id where n.patient_id=p_patient_id),'[]'::jsonb) else '[]'::jsonb end,
    'media',case when public.has_clinic_role(p_clinic_id,array['owner','manager','dentist','assistant']::public.clinic_role[]) then coalesce((select jsonb_agg(to_jsonb(m) order by m.captured_at desc) from public.clinical_media m where m.patient_id=p_patient_id),'[]'::jsonb) else '[]'::jsonb end,
    'teeth',case when public.has_clinic_role(p_clinic_id,array['owner','manager','dentist','assistant']::public.clinic_role[]) then coalesce((select jsonb_agg(to_jsonb(t)) from public.tooth_records t where t.patient_id=p_patient_id),'[]'::jsonb) else '[]'::jsonb end,
    'treatment_plans',coalesce((select jsonb_agg(to_jsonb(tp)||jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(tpi)) from public.treatment_plan_items tpi where tpi.treatment_plan_id=tp.id),'[]'::jsonb)) order by tp.updated_at desc) from public.treatment_plans tp where tp.patient_id=p_patient_id),'[]'::jsonb),
    'invoices',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(ii)) from public.invoice_items ii where ii.invoice_id=i.id),'[]'::jsonb)) order by i.issued_at desc) from public.invoices i where i.patient_id=p_patient_id),'[]'::jsonb),
    'payments',coalesce((select jsonb_agg(to_jsonb(p) order by p.received_at desc) from public.payments p where p.patient_id=p_patient_id),'[]'::jsonb),
    'communications',coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('patient_name',v_patient.display_name) order by c.occurred_at desc) from public.communications c where c.patient_id=p_patient_id),'[]'::jsonb),
    'consents',coalesce((select jsonb_agg(to_jsonb(c)) from public.consents c where c.patient_id=p_patient_id),'[]'::jsonb),
    'prescriptions',case when public.has_clinic_role(p_clinic_id,array['owner','manager','dentist','assistant']::public.clinic_role[]) then coalesce((select jsonb_agg(to_jsonb(pr)||jsonb_build_object('prescribed_by_name',m.name,'items',coalesce((select jsonb_agg(to_jsonb(pi)) from public.prescription_items pi where pi.prescription_id=pr.id),'[]'::jsonb))) from public.prescriptions pr join public.clinic_members m on m.id=pr.prescribed_by where pr.patient_id=p_patient_id),'[]'::jsonb) else '[]'::jsonb end,
    'lab_cases',coalesce((select jsonb_agg(to_jsonb(l)) from public.lab_cases l where l.patient_id=p_patient_id),'[]'::jsonb),
    'tasks',coalesce((select jsonb_agg(to_jsonb(t)||jsonb_build_object('assigned_to_name',m.name)) from public.tasks t join public.clinic_members m on m.id=t.assigned_to where t.patient_id=p_patient_id),'[]'::jsonb)
  );
end $$;
grant execute on function public.get_patient_record(uuid,uuid) to authenticated;

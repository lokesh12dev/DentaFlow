from audit_common import *
a=Audit('data-model')
sql='\n'.join(p.read_text(errors='ignore') for p in files('supabase/migrations/*.sql'))
tables=['clinics','branches','chairs','profiles','clinic_members','patients','procedure_types','appointments','clinical_notes','clinical_media','tooth_records','treatment_plans','treatment_plan_items','invoices','invoice_items','payments','communications','tasks','consents','prescriptions','prescription_items','lab_cases','inventory_items','automation_rules','message_templates','integration_connections','audit_logs','outbox_events','webhook_events','family_groups']
for table in tables:a.require(re.search(rf'create table(?: if not exists)? public\.{table}\b',sql,re.I) is not None,'table-contract',f'Missing table {table}','supabase/migrations',severity='critical')
for rpc in ['create_clinic','create_patient_intake','create_appointment_with_workflow','transition_appointment','log_communication','record_payment','get_dashboard_snapshot','get_patient_record','create_family_group','create_treatment_plan','create_prescription']:
    a.require(re.search(rf'function public\.{rpc}\b',sql,re.I) is not None,'transactional-rpc',f'Missing RPC {rpc}','supabase/migrations',severity='high')
for index in ['appointments_clinic_starts_idx','patients_clinic_name_idx','communications_clinic_time_idx','audit_logs_clinic_time_idx']:
    a.require(index in sql,'high-growth-index',f'Missing index {index}','supabase/migrations',severity='high')
a.require('idempotency_key' in sql,'idempotency','Payment/provider idempotency field missing','supabase/migrations',severity='critical')
a.metrics={'tables_expected':len(tables),'tables_created':len(re.findall(r'create table(?: if not exists)? public\.',sql,re.I)),'indexes':len(re.findall(r'create index',sql,re.I)),'functions':len(re.findall(r'function public\.',sql,re.I)),'triggers':len(re.findall(r'create trigger',sql,re.I))}
dump(a.report(),'data-model.json')

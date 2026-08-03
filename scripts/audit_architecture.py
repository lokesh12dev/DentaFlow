from audit_common import *
a=Audit('architecture')
required_routes=['app/(tabs)/today.tsx','app/(tabs)/patients.tsx','app/(tabs)/calendar.tsx','app/(tabs)/inbox.tsx','app/(tabs)/more.tsx','app/patient/[id].tsx','app/patient/new.tsx','app/appointment/new.tsx','app/appointment/[id].tsx','app/clinical/note.tsx','app/clinical/consent.tsx','app/clinical/prescription.tsx','app/payment/new.tsx','app/communication/new.tsx','app/(modules)/billing.tsx','app/(modules)/laboratory.tsx','app/(modules)/inventory.tsx','app/(modules)/recalls.tsx','app/(modules)/reports.tsx','app/(modules)/team.tsx','app/(modules)/audit.tsx','app/setup/credentials.tsx']
for route in required_routes:a.require((ROOT/route).exists(),'required-route',f'Missing production route: {route}',route)
repo=text('src/repositories/clinicRepository.ts')
methods=['getDashboard','createPatient','createAppointment','transitionAppointment','createCommunication','createClinicalNote','recordPayment','createTreatmentPlan','createConsent','createPrescription','createLabCase','upsertInventory','createAutomation','createTemplate','inviteStaff','askPatientHistory']
for m in methods:a.require(re.search(rf'\b{m}\s*\(',repo) is not None,'repository-contract',f'Missing repository method {m}','src/repositories/clinicRepository.ts')
for impl in ['src/repositories/demoRepository.ts','src/repositories/supabaseRepository.ts']:
    body=text(impl)
    for m in methods:a.require(re.search(rf'\b{m}\s*\(',body) is not None,'repository-implementation',f'{m} missing from {impl}',impl)
edge={p.parent.name for p in files('supabase/functions/*/index.ts')}
required_edge={'openrouter-clinical-assist','whatsapp-send','email-send','telephony-call','provider-webhook','invite-staff','integration-health','notification-dispatch'}
for name in required_edge:a.require(name in edge,'edge-function',f'Missing Edge Function {name}',f'supabase/functions/{name}/index.ts')
a.require(len(files('supabase/migrations/*.sql'))>=5,'migration-depth','Expected at least five ordered migrations','supabase/migrations',severity='high')
a.metrics={'route_count':len(files('app/**/*.tsx')),'feature_files':len(files('src/features/**/*.tsx')),'repository_methods':len(re.findall(r'\n\s{2}[a-zA-Z]\w*\(',repo)),'edge_functions':len(edge),'migrations':len(files('supabase/migrations/*.sql'))}
dump(a.report(),'architecture.json')

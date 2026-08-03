from audit_common import *
a=Audit('security')
client='\n'.join(p.read_text(errors='ignore') for p in files('src/**/*.ts')+files('src/**/*.tsx')+files('app/**/*.tsx'))
for secret in ['SUPABASE_SERVICE_ROLE_KEY','OPENROUTER_API_KEY','WHATSAPP_ACCESS_TOKEN','RESEND_API_KEY','TWILIO_AUTH_TOKEN']:
    a.require(re.search(rf'(process\.env|Deno\.env)\.?(get\()?[[\"\']?{secret}',client) is None,'client-secret',f'{secret} is read by client code','src',severity='critical')
sql='\n'.join(p.read_text(errors='ignore') for p in files('supabase/migrations/*.sql'))
for table in ['clinics','clinic_members','patients','appointments','clinical_notes','clinical_media','communications','tasks','invoices','payments','audit_logs']:
    a.require(re.search(rf'alter table public\.{table}\s+enable row level security',sql,re.I) is not None,'rls',f'RLS not enabled for {table}','supabase/migrations',severity='critical')
a.require('immutable' in sql.lower() or 'prevent_audit' in sql.lower(),'audit-immutability','No immutable audit protection detected','supabase/migrations',severity='high')
a.require("clinical-media" in sql and "private" in sql.lower(),'private-media','Private clinical media storage policy not detected','supabase/migrations',severity='critical')
a.require('security definer' in sql.lower() and 'set search_path' in sql.lower(),'rpc-hardening','Security-definer RPCs must pin search_path','supabase/migrations',severity='high')
webhook=text('supabase/functions/provider-webhook/index.ts')
a.require('validateTwilioSignature' in webhook,'webhook-signature','Twilio webhook signature validation missing','supabase/functions/provider-webhook/index.ts')
ai=text('supabase/functions/openrouter-clinical-assist/index.ts')
for control in ['data_collection','deidentify','review']:
    a.require(control.lower() in ai.lower(),'ai-privacy',f'Clinical AI control missing: {control}','supabase/functions/openrouter-clinical-assist/index.ts',severity='high')

localdb=text('src/core/localDb.ts')
auth_storage=text('src/core/supabase.ts')+text('src/core/secureStorage.ts')
a.require('supabaseAuthStorage' in auth_storage and 'SecureStore' in auth_storage,'auth-secure-storage','Supabase sessions are not backed by SecureStore','src/core/supabase.ts',severity='critical')
a.require('localStorage' not in text('src/core/supabase.ts'),'auth-localstorage','Supabase auth uses the SQLite localStorage shim','src/core/supabase.ts',severity='high')
a.require('PRAGMA key' in localdb and 'offline-sqlcipher-key' in localdb,'sqlcipher-key','SQLCipher key initialization is missing','src/core/localDb.ts',severity='critical')
a.require('Sensitive data cannot be stored' in localdb and 'OFFLINE_MUTATION_ALLOWLIST' in localdb,'offline-phi-boundary','Offline PHI rejection is missing','src/core/localDb.ts',severity='critical')
app=json.loads(text('app.json'));plugins=str(app.get('expo',{}).get('plugins',[]));a.require('useSQLCipher' in plugins,'sqlcipher-native','Native SQLCipher build configuration is missing','app.json',severity='critical')

a.metrics={'rls_enable_count':len(re.findall(r'enable row level security',sql,re.I)),'policy_count':len(re.findall(r'create policy',sql,re.I)),'security_definer_functions':len(re.findall(r'security definer',sql,re.I)),'client_secret_reads':sum(len(re.findall(rf'process\.env[^\n]*{x}',client)) for x in ['SERVICE_ROLE','OPENROUTER_API_KEY','TWILIO_AUTH_TOKEN'])}
dump(a.report(),'security.json')

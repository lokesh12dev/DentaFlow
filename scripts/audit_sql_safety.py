from audit_common import *

a = Audit('sql-safety')
migrations = sorted(files('supabase/migrations/*.sql'))
sql = '\n'.join(p.read_text(errors='ignore') for p in migrations)

# Ordered, unique migration prefixes.
prefixes = [p.name.split('_',1)[0] for p in migrations]
a.require(prefixes == sorted(prefixes), 'migration-order', 'Migrations are not lexically ordered', 'supabase/migrations', severity='critical')
a.require(len(prefixes) == len(set(prefixes)), 'migration-prefix', 'Duplicate migration prefix detected', 'supabase/migrations', severity='critical')

# All public application tables should explicitly enable RLS, excluding audit trigger internals if any.
tables = set(re.findall(r'create table(?: if not exists)?\s+public\.([a-z_]+)', sql, re.I))
rls = set(re.findall(r'alter table\s+public\.([a-z_]+)\s+enable row level security', sql, re.I))
for table in sorted(tables - rls):
    a.add('critical', 'rls-coverage', f'RLS is not enabled for public table {table}', 'supabase/migrations')

# Security-definer functions must pin search_path.
function_blocks = re.findall(r'(create or replace function\s+public\.[\s\S]*?\$\$;)', sql, re.I)
for block in function_blocks:
    name = re.search(r'function\s+public\.([a-z_]+)', block, re.I)
    if 'security definer' in block.lower() and 'set search_path' not in block.lower():
        a.add('critical','search-path',f'Security-definer function {name.group(1) if name else "unknown"} does not pin search_path','supabase/migrations')

required_guards = {
    'last active owner protection': 'A clinic must retain at least one active owner',
    'signed consent immutability': 'Signed consent is immutable',
    'refund idempotency': 'payment_refunds' and 'idempotency_key',
    'provider idempotency': 'communications_clinic_idempotency_unique',
    'appointment conflict lock': 'create_appointment_with_workflow',
    'audit immutability': 'prevent_audit_mutation'
}
for label, needle in required_guards.items():
    a.require(needle in sql, 'transaction-guard', f'Missing {label}', 'supabase/migrations', severity='critical')

# Known unsafe patterns.
for needle, detail in [('content_snapshot=content_snapshot', 'Consent withdrawal references a non-contract column'), ('grant all on', 'Overbroad GRANT ALL detected')]:
    a.require(needle.lower() not in sql.lower(), 'unsafe-sql-pattern', detail, 'supabase/migrations', severity='critical')

a.require("unique(branch_id, procedure_type_id)" in sql, 'branch-price-uniqueness', 'Branch procedure prices lack a conflict-safe unique key', 'supabase/migrations', severity='high')
a.require('patient_portal_tokens_lookup_idx' in sql and 'token_hash' in sql, 'portal-token-index', 'Expiring patient tokens are not indexed by hash/scope', 'supabase/migrations', severity='high')
a.require('booking_requests_rate_idx' in sql, 'public-rate-index', 'Public booking rate-limit index missing', 'supabase/migrations', severity='high')

a.metrics = {
    'migrations': len(migrations), 'tables': len(tables), 'rls_tables': len(rls),
    'policies': len(re.findall(r'create policy', sql, re.I)),
    'security_definer_functions': len(re.findall(r'security definer', sql, re.I)),
    'unique_indexes': len(re.findall(r'create unique index', sql, re.I))
}
dump(a.report(), 'sql-safety.json')

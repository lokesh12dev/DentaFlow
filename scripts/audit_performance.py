from audit_common import *
a=Audit('performance')
tsfiles=files('src/**/*.ts')+files('src/**/*.tsx')+files('app/**/*.tsx')
line_counts={str(p.relative_to(ROOT)):len(p.read_text(errors='ignore').splitlines()) for p in tsfiles}
for f,n in line_counts.items():
    if n>900:a.add('medium','oversized-module',f'{n} lines; split to reduce review and render risk',f)
    elif n>600:a.add('low','large-module',f'{n} lines; monitor maintainability',f)
repo=text('src/repositories/supabaseRepository.ts')
for m in re.finditer(r'\.select\([^\n]*\)(.*?);',repo,re.S):
    chain=m.group(0)
    if '.limit(' not in chain and any(t in chain for t in ["from('patients')","from('appointments')","from('communications')","from('audit_logs')"]):a.add('medium','unbounded-query','High-growth collection query lacks limit','src/repositories/supabaseRepository.ts')
patient=text('src/features/patients/PatientsScreen.tsx')
a.require('FlashList' in patient,'virtualized-list','Patient directory should use FlashList','src/features/patients/PatientsScreen.tsx',severity='high')
query=text('src/hooks/useClinicQueries.ts');a.require('staleTime' in query,'query-cache','No React Query stale-time policy found','src/hooks/useClinicQueries.ts',severity='high')
a.require((ROOT/'src/core/localDb.ts').exists(),'offline-cache','Offline cache layer missing','src/core/localDb.ts',severity='high')
a.metrics={'typescript_files':len(tsfiles),'total_ts_lines':sum(line_counts.values()),'largest_files':sorted(line_counts.items(),key=lambda x:x[1],reverse=True)[:10],'flashlist_uses':sum(p.read_text(errors='ignore').count('FlashList') for p in tsfiles)}
dump(a.report(),'performance.json')

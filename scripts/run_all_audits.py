from pathlib import Path
import json, subprocess, sys, datetime
ROOT=Path(__file__).resolve().parents[1]
scripts=['audit_architecture.py','audit_ux.py','audit_security.py','audit_performance.py','audit_usability.py','audit_data_model.py','audit_runtime_contracts.py','audit_sql_safety.py']
reports=[]
for script in scripts:
    cp=subprocess.run([sys.executable,str(ROOT/'scripts'/script)],cwd=ROOT,capture_output=True,text=True)
    if cp.returncode!=0:
        print(cp.stdout);print(cp.stderr,file=sys.stderr);raise SystemExit(cp.returncode)
    name_map={'audit_architecture.py':'architecture.json','audit_ux.py':'ux.json','audit_security.py':'security.json','audit_performance.py':'performance.json','audit_usability.py':'usability.json','audit_data_model.py':'data-model.json','audit_runtime_contracts.py':'runtime-contracts.json','audit_sql_safety.py':'sql-safety.json'}
    reports.append(json.loads((ROOT/'quality-reports'/name_map[script]).read_text()))
counts={k:sum(r['counts'][k] for r in reports) for k in ['critical','high','medium','low','info']}
summary={'generated_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'passed':counts['critical']==0 and counts['high']==0,'counts':counts,'audits':reports}
(ROOT/'quality-reports'/'quality-summary.json').write_text(json.dumps(summary,indent=2))
lines=['# DentaFlow automated quality report','',f"Generated: {summary['generated_at']}",'',f"Overall gate: **{'PASS' if summary['passed'] else 'FAIL'}**",'',f"Critical: {counts['critical']} · High: {counts['high']} · Medium: {counts['medium']} · Low: {counts['low']}",'']
for r in reports:
    lines += [f"## {r['audit']}",f"Gate: **{'PASS' if r['passed'] else 'FAIL'}**",'']
    if not r['findings']: lines += ['No findings.','']
    else:
        for f in r['findings']: lines.append(f"- **{f['severity'].upper()} — {f['check']}**: {f['detail']}"+(f" (`{f['file']}`)" if f['file'] else ''))
        lines.append('')
(ROOT/'quality-reports'/'QUALITY_REPORT.md').write_text('\n'.join(lines))
print(json.dumps({'passed':summary['passed'],'counts':counts},indent=2))
if not summary['passed']: raise SystemExit(1)

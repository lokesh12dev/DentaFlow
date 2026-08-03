from __future__ import annotations
from dataclasses import dataclass, asdict
from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[1]

@dataclass
class Finding:
    severity: str
    check: str
    detail: str
    file: str = ''

class Audit:
    def __init__(self, name: str):
        self.name=name; self.findings=[]; self.metrics={}
    def add(self,severity,check,detail,file=''):
        self.findings.append(Finding(severity,check,detail,file))
    def require(self,condition,check,detail,file='',severity='critical'):
        if not condition:self.add(severity,check,detail,file)
    def report(self):
        counts={k:sum(f.severity==k for f in self.findings) for k in ['critical','high','medium','low','info']}
        return {'audit':self.name,'metrics':self.metrics,'counts':counts,'findings':[asdict(f) for f in self.findings],'passed':counts['critical']==0 and counts['high']==0}

def files(pattern): return list(ROOT.glob(pattern))
def text(path): return (ROOT/path).read_text(errors='ignore')
def all_source():
    return [p for p in ROOT.rglob('*') if p.is_file() and p.suffix in {'.ts','.tsx','.sql','.json','.md','.py','.mjs'} and 'node_modules' not in p.parts]
def dump(report, filename):
    out=ROOT/'quality-reports';out.mkdir(exist_ok=True)
    (out/filename).write_text(json.dumps(report,indent=2))
    return report

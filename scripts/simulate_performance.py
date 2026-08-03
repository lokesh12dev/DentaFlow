from __future__ import annotations
from audit_common import ROOT
from bisect import bisect_left
from collections import defaultdict
import json, random, statistics, string, time

random.seed(73057)
N_PATIENTS = 25_000
N_APPOINTMENTS = 100_000
N_EVENTS = 150_000

def percentile(values, p):
    values = sorted(values)
    return values[min(len(values)-1, int((len(values)-1)*p))]

def timed(fn, runs=50):
    values=[]
    for _ in range(runs):
        start=time.perf_counter_ns(); fn(); values.append((time.perf_counter_ns()-start)/1_000_000)
    return {'p50_ms':round(statistics.median(values),3),'p95_ms':round(percentile(values,.95),3),'max_ms':round(max(values),3)}

first=['Anita','Kavya','Meera','Aarav','Rohan','Farah','Vikram','Nisha','Irfan','Sara']
last=['Sharma','Menon','Khan','Das','Rao','Patel','Ali','Banu','Singh','Joseph']
patients=[]
for i in range(N_PATIENTS):
    name=f'{random.choice(first)} {random.choice(last)} {i:05d}'
    phone=f'+91{7000000000+i:010d}'
    patients.append({'id':i,'search':f'{name} {phone} DF-{i:06d}'.lower()})

def search(term='anita'):
    return [p['id'] for p in patients if term in p['search']][:50]

# Interval index by doctor/day. This simulates the server conflict predicate and client slot disabling.
appointments=defaultdict(list)
for i in range(N_APPOINTMENTS):
    doctor=i%24; day=i%120; start=8*60+(i*17)%600; duration=(30,45,60,90)[i%4]
    appointments[(doctor,day)].append((start,start+duration))
for key in appointments: appointments[key].sort()

def conflict_lookup():
    intervals=appointments[(7,47)]; proposed=(665,725); starts=[x[0] for x in intervals]; idx=bisect_left(starts,proposed[1]);
    return any(start < proposed[1] and end > proposed[0] for start,end in intervals[max(0,idx-10):idx+1])

events=[]
for i in range(N_EVENTS): events.append((i%N_PATIENTS, 1_700_000_000 + i, i%9))
def timeline_group():
    target=1242
    return sorted((e for e in events if e[0]==target), key=lambda x:x[1], reverse=True)

benchmarks={
  'patient_search_25k': timed(search, 30),
  'appointment_conflict_100k': timed(conflict_lookup, 500),
  'timeline_filter_150k': timed(timeline_group, 30),
}
thresholds={'patient_search_25k':40,'appointment_conflict_100k':3,'timeline_filter_150k':20}
checks={name:benchmarks[name]['p95_ms']<=limit for name,limit in thresholds.items()}
report={
  'kind':'synthetic host-side algorithm simulation',
  'warning':'This is not an Android/iOS frame-time benchmark and does not replace device profiling, database EXPLAIN ANALYZE, or provider load testing.',
  'dataset':{'patients':N_PATIENTS,'appointments':N_APPOINTMENTS,'timeline_events':N_EVENTS},
  'benchmarks':benchmarks,'thresholds_p95_ms':thresholds,'checks':checks,'passed':all(checks.values())
}
out=ROOT/'quality-reports';out.mkdir(exist_ok=True)
(out/'synthetic-performance.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
raise SystemExit(0 if report['passed'] else 1)

// ChartView.jsx — Patient chart shell

const PATIENT = {
  name: 'Amelia Okoye',
  id: 'A-4021',
  age: 34, sex: 'F', dob: '1991-04-12',
  provider: 'Dr. Nia Adaora',
  nextRecall: '12 Feb 2027',
  balance: 184.00,
  allergies: ['Penicillin'],
  medications: ['Lisinopril 10mg qd'],
  conditions: ['Bruxism'],
  lastVisit: '4 Aug 2026',
};

function ChartView() {
  const [tab, setTab] = React.useState('chart');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--paper-50)', overflow: 'auto' }}>
      <PatientHeader p={PATIENT} />
      <VitalsBar p={PATIENT} />

      <div style={{ display: 'flex', gap: 4, padding: '0 24px', borderBottom: '1px solid var(--border-hair)', background: '#fff' }}>
        {['chart', 'plan', 'notes', 'media', 'billing'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '12px 14px', border: 'none', background: 'transparent',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
            color: tab === t ? 'var(--fg-1)' : 'var(--fg-3)',
            borderBottom: `2px solid ${tab === t ? 'var(--teal-500)' : 'transparent'}`,
            marginBottom: -1,
            cursor: 'pointer', textTransform: 'capitalize',
          }}>{t === 'plan' ? 'Treatment plan' : t}</button>
        ))}
      </div>

      <div style={{ flex: 1, padding: 24, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignContent: 'start' }}>
        {tab === 'chart' && (<>
          <DentalChart />
          <ChartSidebar />
        </>)}
        {tab === 'plan' && <TreatmentPlan />}
        {tab === 'notes' && <NotesPanel />}
        {tab === 'media' && <MediaPanel />}
        {tab === 'billing' && <BillingPanel p={PATIENT} />}
      </div>
    </div>
  );
}

function PatientHeader({ p }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '18px 24px 16px',
      background: '#fff',
      borderBottom: '1px solid var(--border-hair)',
    }}>
      <Avatar name={p.name} size={54} tone="teal" />
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 600, color: 'var(--fg-1)', letterSpacing: '-0.01em' }}>{p.name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)', letterSpacing: 0 }}>#{p.id}</div>
        </div>
        <div style={{ marginTop: 4, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-3)', display: 'flex', gap: 12 }}>
          <span>{p.age}{p.sex} · DOB {p.dob}</span>
          <span>· {p.provider}</span>
          <span>· Last visit {p.lastVisit}</span>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <Button variant="secondary" size="sm" icon="mic">Voice note</Button>
      <Button variant="secondary" size="sm" icon="camera">Add photo</Button>
      <Button variant="primary" size="sm" icon="plus">Add procedure</Button>
    </div>
  );
}

function VitalsBar({ p }) {
  const items = [
    { k: 'Allergies',    v: p.allergies.join(', '),   tone: 'coral' },
    { k: 'Medications',  v: p.medications.join(', '), tone: 'slate' },
    { k: 'Conditions',   v: p.conditions.join(', '),  tone: 'amber' },
    { k: 'Next recall',  v: p.nextRecall,             tone: 'teal', mono: true },
    { k: 'Balance',      v: `$${p.balance.toFixed(2)}`, tone: 'neutral', mono: true },
  ];
  return (
    <div style={{
      display: 'flex', gap: 16,
      padding: '12px 24px',
      background: 'var(--paper-100)',
      borderBottom: '1px solid var(--border-hair)',
    }}>
      {items.map(it => (
        <div key={it.k} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>{it.k}</div>
          <div style={{
            fontFamily: it.mono ? 'var(--font-mono)' : 'var(--font-sans)',
            fontSize: 13, fontWeight: 500, color: 'var(--fg-1)',
            letterSpacing: it.mono ? 0 : 'normal',
            fontVariantNumeric: it.mono ? 'tabular-nums' : 'normal',
          }}>
            {it.tone === 'coral' && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 999, background: 'var(--coral-500)', marginRight: 6, verticalAlign: 'middle' }} />}
            {it.v || '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartSidebar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#fff', border: '1px solid var(--border-1)', borderRadius: 'var(--r-3)', padding: 14, boxShadow: 'var(--shadow-1)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8 }}>Chairside</div>
        {['Voice note · 2:14', 'X-ray · 3 images', 'Photo · 2 intra-oral'].map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border-hair)' }}>
            <Icon name={i === 0 ? 'mic' : i === 1 ? 'activity' : 'image'} size={16} style={{ color: 'var(--fg-3)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)' }}>{t}</span>
            <span style={{ flex: 1 }} />
            <Icon name="chevron" size={14} style={{ color: 'var(--fg-4)' }} />
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border-1)', borderRadius: 'var(--r-3)', padding: 14, boxShadow: 'var(--shadow-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Icon name="sparkle" size={14} style={{ color: 'var(--teal-600)' }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--teal-700)' }}>AI Summary</div>
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>
          Amelia presents for recall. Chart flags <span style={{ color: 'var(--amber-600)', fontWeight: 500 }}>planned #14 MOD composite</span> from Q2. Bruxism noted — consider night-guard consult.
        </div>
      </div>
    </div>
  );
}

function TreatmentPlan() {
  const phases = [
    { name: 'Phase 1 · Restorative', items: [
      { code: 'D2392', desc: 'Composite · #14 MO', fee: 285, status: 'planned' },
      { code: 'D2740', desc: 'Crown · #30 · porcelain', fee: 1240, status: 'planned' },
    ]},
    { name: 'Phase 2 · Preventive', items: [
      { code: 'D1110', desc: 'Prophylaxis · adult', fee: 120, status: 'completed' },
      { code: 'D1206', desc: 'Fluoride varnish', fee: 45, status: 'completed' },
    ]},
    { name: 'Phase 3 · Considered', items: [
      { code: 'D7140', desc: 'Extraction · #18', fee: 210, status: 'proposed' },
    ]},
  ];
  const total = phases.flatMap(p => p.items).reduce((s, i) => s + i.fee, 0);
  const insured = 620;
  const patient = total - insured;

  return (
    <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
      <div style={{ background: '#fff', border: '1px solid var(--border-1)', borderRadius: 'var(--r-3)', boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
        {phases.map((phase, pi) => (
          <div key={phase.name}>
            <div style={{ padding: '12px 16px', background: 'var(--paper-100)', borderBottom: '1px solid var(--border-hair)', borderTop: pi === 0 ? 'none' : '1px solid var(--border-hair)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>{phase.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', letterSpacing: 0 }}>
                ${phase.items.reduce((s, i) => s + i.fee, 0).toLocaleString()}
              </div>
              <div style={{ flex: 1 }} />
              <Icon name="more" size={16} style={{ color: 'var(--fg-3)' }} />
            </div>
            {phase.items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 100px 30px', gap: 12, alignItems: 'center', padding: '11px 16px', borderBottom: i === phase.items.length - 1 ? 'none' : '1px solid var(--border-hair)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)', letterSpacing: 0 }}>{item.code}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)' }}>{item.desc}</div>
                <Badge tone={item.status === 'completed' ? 'mint' : item.status === 'planned' ? 'amber' : 'slate'}>{item.status}</Badge>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: 'var(--fg-1)', textAlign: 'right', letterSpacing: 0, fontVariantNumeric: 'tabular-nums' }}>${item.fee}</div>
                <Icon name="chevron" size={14} style={{ color: 'var(--fg-4)' }} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid var(--border-1)', borderRadius: 'var(--r-3)', padding: 16, boxShadow: 'var(--shadow-1)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Estimate</div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 8, alignItems: 'baseline' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-3)' }}>Total fees</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, letterSpacing: 0, fontVariantNumeric: 'tabular-nums', color: 'var(--fg-1)' }}>${total.toLocaleString()}</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-3)' }}>Insurance est.</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, letterSpacing: 0, fontVariantNumeric: 'tabular-nums', color: 'var(--mint-600)' }}>−${insured}</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--fg-1)', borderTop: '1px solid var(--border-hair)', paddingTop: 10 }}>Patient portion</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, letterSpacing: 0, fontVariantNumeric: 'tabular-nums', color: 'var(--fg-1)', borderTop: '1px solid var(--border-hair)', paddingTop: 10 }}>${patient.toLocaleString()}</div>
          </div>
          <Button variant="primary" size="md" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>Present to patient</Button>
        </div>
      </div>
    </div>
  );
}

function NotesPanel() {
  const notes = [
    { date: '12 Aug 2026', author: 'Dr. Nia Adaora', body: 'Comprehensive exam. PA taken #14. Recommend MO composite. Reviewed home care.' },
    { date: '4 Aug 2026', author: 'Mia Chen, RDH', body: 'Prophy completed. Localized gingival inflammation on lower anterior. Reviewed brushing technique.' },
    { date: '18 May 2026', author: 'Dr. Nia Adaora', body: 'New patient exam. Full mouth series. Bruxism evident on molars — discussed night-guard.' },
  ];
  return (
    <div style={{ gridColumn: 'span 2', background: '#fff', border: '1px solid var(--border-1)', borderRadius: 'var(--r-3)', boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
      {notes.map((n, i) => (
        <div key={i} style={{ padding: '16px 20px', borderBottom: i === notes.length - 1 ? 'none' : '1px solid var(--border-hair)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Avatar name={n.author} size={28} />
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--fg-1)' }}>{n.author}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', letterSpacing: 0 }}>· {n.date}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.5, color: 'var(--fg-2)' }}>{n.body}</div>
        </div>
      ))}
    </div>
  );
}

function MediaPanel() {
  return (
    <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {[0,1,2,3,4,5,6,7].map(i => (
        <div key={i} style={{ background: '#fff', border: '1px solid var(--border-1)', borderRadius: 'var(--r-3)', overflow: 'hidden', boxShadow: 'var(--shadow-1)' }}>
          <div style={{ aspectRatio: '4/3', background: `linear-gradient(135deg, var(--paper-100), var(--paper-300))`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-4)' }}>
            <Icon name={i % 3 === 0 ? 'activity' : 'image'} size={28} />
          </div>
          <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-hair)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--fg-1)' }}>{i % 3 === 0 ? `PA · #${14 + i}` : `Intra-oral · ${i}`}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-4)', marginTop: 2, letterSpacing: 0 }}>12 Aug 2026</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BillingPanel({ p }) {
  const rows = [
    { d: '12 Aug 2026', c: 'D1110', desc: 'Prophylaxis',       ch: 120,  paid: 96, ins: 24, bal: 0 },
    { d: '12 Aug 2026', c: 'D0274', desc: 'Bitewings · 4',     ch: 88,   paid: 70, ins: 18, bal: 0 },
    { d: '4 Aug 2026',  c: 'D2740', desc: 'Crown · #30',       ch: 1240, paid: 0,  ins: 620, bal: 620 },
    { d: '18 May 2026', c: 'D0150', desc: 'Comp. oral exam',   ch: 195,  paid: 0,  ins: 0,   bal: 195 },
  ];
  return (
    <div style={{ gridColumn: 'span 2', background: '#fff', border: '1px solid var(--border-1)', borderRadius: 'var(--r-3)', boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '100px 90px 1fr 90px 90px 90px 90px', padding: '10px 16px', background: 'var(--paper-100)', borderBottom: '1px solid var(--border-hair)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
        <div>Date</div><div>Code</div><div>Description</div><div style={{ textAlign: 'right' }}>Charge</div><div style={{ textAlign: 'right' }}>Paid</div><div style={{ textAlign: 'right' }}>Insurance</div><div style={{ textAlign: 'right' }}>Balance</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 90px 1fr 90px 90px 90px 90px', padding: '11px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border-hair)', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 0, color: 'var(--fg-3)' }}>{r.d}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 0 }}>{r.c}</div>
          <div>{r.desc}</div>
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', letterSpacing: 0 }}>${r.ch}</div>
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', letterSpacing: 0, color: 'var(--fg-3)' }}>${r.paid}</div>
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', letterSpacing: 0, color: 'var(--fg-3)' }}>${r.ins}</div>
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', letterSpacing: 0, color: r.bal > 0 ? 'var(--coral-600)' : 'var(--fg-3)', fontWeight: r.bal > 0 ? 500 : 400 }}>${r.bal}</div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { ChartView });

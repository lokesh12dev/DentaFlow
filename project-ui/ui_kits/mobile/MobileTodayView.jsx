// MobileTodayView.jsx — mobile today screen

const M_APPTS = [
  { t: '09:00', dur: '30', name: 'Amelia Okoye',   type: 'Cleaning',            status: 'confirmed', op: 'Op 1' },
  { t: '09:30', dur: '60', name: 'Priya Menon',    type: 'RCT · #14',           status: 'in-chair',  op: 'Op 2' },
  { t: '10:30', dur: '45', name: 'Sofia Reyes',    type: 'New pt · exam',       status: 'unconfirmed', op: 'Op 1' },
  { t: '11:00', dur: '60', name: 'Marcus Chen',    type: 'Composite · #14 MOD', status: 'confirmed', op: 'Op 3' },
  { t: '12:00', dur: '30', name: 'Rachel Kim',     type: 'Recall',              status: 'confirmed', op: 'Op 3' },
  { t: '13:00', dur: '60', name: 'James Whitaker', type: 'Crown · #30',         status: 'confirmed', op: 'Op 1' },
];

function MobileTodayView({ onSelectPatient }) {
  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Tuesday · 12 Aug</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 30, letterSpacing: '-0.02em', color: 'var(--fg-1)', marginTop: 4 }}>
              Good morning, Nia.
            </div>
          </div>
          <MAvatar name="Nia Adaora" size={40} tone="teal" />
        </div>

        {/* Today summary strip */}
        <div style={{
          marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          background: '#fff', borderRadius: 'var(--r-3)',
          border: '1px solid var(--border-1)', boxShadow: 'var(--shadow-1)',
          overflow: 'hidden',
        }}>
          <StatCell label="Today" value="12" mono />
          <StatCell label="In chair" value="2" mono tone="teal" divider />
          <StatCell label="Recalls due" value="3" mono tone="amber" divider />
        </div>
      </div>

      {/* Section eyebrow */}
      <div style={{ padding: '8px 20px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Next up</div>
        <div style={{ flex: 1, height: 1, background: 'var(--border-hair)' }} />
      </div>

      {/* Appointment cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 16px 20px' }}>
        {M_APPTS.map((a, i) => (
          <MobileApptCard key={i} appt={a} onClick={() => onSelectPatient(a.name)} />
        ))}
      </div>
    </div>
  );
}

function StatCell({ label, value, mono, tone, divider }) {
  const toneColor = tone === 'teal' ? 'var(--teal-600)' : tone === 'amber' ? 'var(--amber-600)' : 'var(--fg-1)';
  return (
    <div style={{ padding: '12px 14px', borderLeft: divider ? '1px solid var(--border-hair)' : 'none' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{label}</div>
      <div style={{ marginTop: 4, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', fontSize: 22, fontWeight: 600, color: toneColor, letterSpacing: 0, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function MobileApptCard({ appt, onClick }) {
  const statusMap = {
    confirmed: { tone: 'mint', label: 'Confirmed' },
    unconfirmed: { tone: 'amber', label: 'Unconfirmed' },
    'in-chair': { tone: 'teal', label: 'In chair' },
    'no-show': { tone: 'coral', label: 'No-show' },
  };
  const s = statusMap[appt.status];
  const isInChair = appt.status === 'in-chair';
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'stretch', gap: 12,
      padding: '12px 14px',
      background: isInChair ? 'var(--teal-50)' : '#fff',
      border: `1px solid ${isInChair ? 'var(--teal-200)' : 'var(--border-1)'}`,
      borderRadius: 'var(--r-3)',
      boxShadow: 'var(--shadow-1)',
      cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{ width: 56, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, borderRight: '1px solid var(--border-hair)', paddingRight: 12 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, color: 'var(--fg-1)', letterSpacing: 0, fontVariantNumeric: 'tabular-nums' }}>{appt.t}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-4)', letterSpacing: 0 }}>{appt.dur}m</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--fg-1)' }}>{appt.name}</div>
          <MBadge tone={s.tone}>{s.label}</MBadge>
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-3)' }}>{appt.type} · <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: 0 }}>{appt.op}</span></div>
      </div>
      <MIcon name="chevron" size={16} style={{ color: 'var(--fg-4)', alignSelf: 'center' }} />
    </button>
  );
}

Object.assign(window, { MobileTodayView });

// DentalChart.jsx — FDI-numbered interactive tooth chart
// Layout: upper right (18-11) upper left (21-28), lower left (38-31) lower right (41-48)

const UPPER = [
  ['18','17','16','15','14','13','12','11'],
  ['21','22','23','24','25','26','27','28'],
];
const LOWER = [
  ['48','47','46','45','44','43','42','41'],
  ['31','32','33','34','35','36','37','38'],
];

const CLIN_STATUS = {
  healthy:    { fill: 'var(--paper-100)',    stroke: 'var(--paper-400)',    label: 'Healthy' },
  restored:   { fill: 'var(--slate-50)',     stroke: 'var(--slate-500)',    label: 'Restored', mark: 'slate' },
  planned:    { fill: 'var(--amber-50)',     stroke: 'var(--amber-500)',    label: 'Planned', mark: 'amber-dash' },
  completed:  { fill: 'var(--mint-50)',      stroke: 'var(--mint-500)',     label: 'Completed', mark: 'mint' },
  caries:     { fill: 'var(--coral-50)',     stroke: 'var(--coral-500)',    label: 'Caries', mark: 'coral-dot' },
  missing:    { fill: 'var(--paper-200)',    stroke: 'var(--paper-400)',    label: 'Missing', mark: 'x' },
  watch:      { fill: '#F3EBFA',             stroke: '#9B7BC9',             label: 'Watch', mark: 'q' },
};

// Some pre-seeded statuses (would come from patient data)
const DEFAULT_STATUSES = {
  '14': 'planned', '30': 'restored', '18': 'missing', '48': 'missing',
  '26': 'caries', '46': 'watch', '11': 'completed',
};

function DentalChart({ compact = false }) {
  const [statuses, setStatuses] = React.useState(DEFAULT_STATUSES);
  const [selected, setSelected] = React.useState('14');

  const cycle = (t) => {
    const keys = Object.keys(CLIN_STATUS);
    const current = statuses[t] || 'healthy';
    const next = keys[(keys.indexOf(current) + 1) % keys.length];
    setStatuses({ ...statuses, [t]: next });
    setSelected(t);
  };

  const sel = statuses[selected] || 'healthy';

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border-1)',
      borderRadius: 'var(--r-3)',
      padding: 18,
      boxShadow: 'var(--shadow-1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--fg-1)' }}>
          Dental chart
        </div>
        <Tag>FDI</Tag>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', letterSpacing: 0 }}>
          Click a tooth to cycle status
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        {/* Upper arch */}
        <ToothRow numbers={UPPER[0]} statuses={statuses} onSelect={cycle} selected={selected} upper />
        <ToothRow numbers={UPPER[1]} statuses={statuses} onSelect={cycle} selected={selected} upper />

        {/* Midline */}
        <div style={{ height: 1, width: '92%', background: 'var(--border-hair)', margin: '6px 0' }} />

        {/* Lower arch */}
        <ToothRow numbers={LOWER[0]} statuses={statuses} onSelect={cycle} selected={selected} />
        <ToothRow numbers={LOWER[1]} statuses={statuses} onSelect={cycle} selected={selected} />
      </div>

      {/* Legend + selected */}
      <div style={{
        marginTop: 16, padding: '12px 14px',
        background: 'var(--paper-50)', borderRadius: 'var(--r-2)',
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Selected</span>
          <span style={{ marginLeft: 6, fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: 'var(--fg-1)', letterSpacing: 0 }}>#{selected}</span>
          <span style={{ marginLeft: 8, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-2)' }}>· {CLIN_STATUS[sel].label}</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(CLIN_STATUS).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, background: v.fill, border: `1.5px solid ${v.stroke}`, borderRadius: 2 }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--fg-3)' }}>{v.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToothRow({ numbers, statuses, onSelect, selected, upper }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${numbers.length}, 1fr)`, gap: 3, width: '100%' }}>
      {numbers.map(n => (
        <Tooth key={n} number={n} status={statuses[n] || 'healthy'} upper={upper} selected={selected === n} onClick={() => onSelect(n)} />
      ))}
    </div>
  );
}

function Tooth({ number, status, upper, selected, onClick }) {
  const s = CLIN_STATUS[status];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      {upper && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-4)', letterSpacing: 0 }}>{number}</div>
      )}
      <button onClick={onClick} style={{
        border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
        width: '100%', maxWidth: 40, aspectRatio: '4/5',
        outline: selected ? '2px solid var(--teal-500)' : 'none',
        outlineOffset: 2, borderRadius: 4,
      }}>
        <svg viewBox="0 0 44 54" width="100%" height="100%">
          <path d={upper
            ? "M22 3 C 31 3, 38 7, 40 15 C 41 22, 39 32, 36 40 C 34 45, 33 51, 31 51 C 29 51, 28 45, 25 41 C 23 44, 22 51, 20 51 C 18 51, 16 45, 13 40 C 9 32, 6 22, 8 15 C 10 7, 17 3, 22 3 Z"
            : "M22 51 C 31 51, 38 47, 40 39 C 41 32, 39 22, 36 14 C 34 9, 33 3, 31 3 C 29 3, 28 9, 25 13 C 23 10, 22 3, 20 3 C 18 3, 16 9, 13 14 C 9 22, 6 32, 8 39 C 10 47, 17 51, 22 51 Z"
          } fill={s.fill} stroke={s.stroke} strokeWidth="1.2"/>
          {status === 'restored' && <rect x="15" y="22" width="14" height="10" fill="var(--slate-500)" rx="1"/>}
          {status === 'completed' && <rect x="15" y="22" width="14" height="10" fill="var(--mint-500)" rx="1"/>}
          {status === 'planned' && <rect x="15" y="22" width="14" height="10" fill="none" stroke="var(--amber-500)" strokeWidth="1.5" strokeDasharray="2 2" rx="1"/>}
          {status === 'caries' && <circle cx={upper ? 30 : 14} cy={upper ? 16 : 38} r="3.5" fill="var(--coral-500)"/>}
          {status === 'missing' && (<><line x1="10" y1="10" x2="34" y2="44" stroke="var(--paper-500)" strokeWidth="1.5"/><line x1="34" y1="10" x2="10" y2="44" stroke="var(--paper-500)" strokeWidth="1.5"/></>)}
          {status === 'watch' && <text x="22" y={upper ? 34 : 30} textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="14" fontWeight="500" fill="#9B7BC9">?</text>}
        </svg>
      </button>
      {!upper && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-4)', letterSpacing: 0 }}>{number}</div>
      )}
    </div>
  );
}

Object.assign(window, { DentalChart });

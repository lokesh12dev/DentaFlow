// ScheduleView.jsx — Chair-by-chair timeline

const OPS = ['Op 1', 'Op 2', 'Op 3', 'Op 4', 'Hyg. 1'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// Appointments: each { op (0-based), start (minutes from 8am), duration (min), patient, type, status, provider }
const APPTS = [
  { op: 0, start: 60,  dur: 30, patient: 'Amelia Okoye',   type: 'Cleaning',              status: 'confirmed', provider: 'Dr. Nia' },
  { op: 0, start: 150, dur: 45, patient: 'Sofia Reyes',    type: 'New pt · exam',         status: 'unconfirmed', provider: 'Dr. Nia' },
  { op: 0, start: 300, dur: 60, patient: 'James Whitaker', type: 'Crown · #30',           status: 'confirmed', provider: 'Dr. Nia' },
  { op: 1, start: 30,  dur: 60, patient: 'Priya Menon',    type: 'RCT · #14',             status: 'in-chair',   provider: 'Dr. Ravi' },
  { op: 1, start: 180, dur: 30, patient: 'Elena Vasquez',  type: 'Recall',                status: 'confirmed', provider: 'Hyg. Mia' },
  { op: 1, start: 240, dur: 45, patient: 'Kenji Watanabe', type: 'Consult',               status: 'confirmed', provider: 'Dr. Ravi' },
  { op: 2, start: 90,  dur: 60, patient: 'Marcus Chen',    type: 'Composite · #14 MOD',   status: 'in-chair',   provider: 'Dr. Ravi' },
  { op: 2, start: 210, dur: 30, patient: 'Rachel Kim',     type: 'Recall',                status: 'confirmed', provider: 'Hyg. Mia' },
  { op: 3, start: 60,  dur: 90, patient: 'David Osei',     type: 'Implant · stage 2',     status: 'confirmed', provider: 'Dr. Ravi' },
  { op: 3, start: 270, dur: 45, patient: 'Nina Alvarez',   type: 'Whitening',             status: 'confirmed', provider: 'Hyg. Mia' },
  { op: 4, start: 0,   dur: 45, patient: 'Thomas Weber',   type: 'Deep cleaning',         status: 'confirmed', provider: 'Hyg. Mia' },
  { op: 4, start: 120, dur: 30, patient: 'Grace Park',     type: 'Recall',                status: 'no-show',    provider: 'Hyg. Mia' },
  { op: 4, start: 210, dur: 60, patient: 'Ayaan Rahman',   type: 'SRP',                   status: 'confirmed', provider: 'Hyg. Mia' },
];

const STATUS_STYLES = {
  confirmed:   { bg: '#fff', border: 'var(--paper-400)', accent: 'var(--mint-500)' },
  unconfirmed: { bg: 'var(--amber-50)', border: 'var(--amber-500)', accent: 'var(--amber-500)' },
  'in-chair':  { bg: 'var(--teal-500)', border: 'var(--teal-600)', accent: '#fff', textColor: '#fff' },
  'no-show':   { bg: 'var(--coral-50)', border: 'var(--coral-500)', accent: 'var(--coral-500)' },
};

const HOUR_HEIGHT = 68;  // px per hour

function ScheduleView({ onSelectPatient }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--paper-50)' }}>
      <ScheduleHeader />
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `60px repeat(${OPS.length}, 1fr)`,
          gap: 0,
          background: '#fff',
          border: '1px solid var(--border-1)',
          borderRadius: 'var(--r-3)',
          boxShadow: 'var(--shadow-1)',
          overflow: 'hidden',
        }}>
          {/* Column headers */}
          <div style={{ borderBottom: '1px solid var(--border-hair)', background: 'var(--paper-100)' }} />
          {OPS.map(op => (
            <div key={op} style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-hair)',
              borderLeft: '1px solid var(--border-hair)',
              background: 'var(--paper-100)',
              fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: 'var(--fg-1)',
            }}>
              {op}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-4)', marginTop: 3, letterSpacing: 0 }}>
                {op.startsWith('Hyg') ? 'Mia Chen, RDH' : op === 'Op 1' ? 'Nia Adaora, DDS' : op === 'Op 2' || op === 'Op 3' ? 'Ravi Patel, DDS' : ''}
              </div>
            </div>
          ))}

          {/* Time gutter + grid rows */}
          <div style={{ position: 'relative', gridColumn: 1, gridRow: '2 / span 1', height: HOURS.length * HOUR_HEIGHT }}>
            {HOURS.map((h, i) => (
              <div key={h} style={{
                position: 'absolute', top: i * HOUR_HEIGHT - 6, right: 8,
                fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-4)', letterSpacing: 0,
                fontVariantNumeric: 'tabular-nums',
              }}>{h}</div>
            ))}
          </div>

          {OPS.map((op, opIdx) => (
            <div key={op} style={{
              position: 'relative',
              gridColumn: opIdx + 2, gridRow: '2 / span 1',
              height: HOURS.length * HOUR_HEIGHT,
              borderLeft: '1px solid var(--border-hair)',
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_HEIGHT - 1}px, var(--border-hair) ${HOUR_HEIGHT - 1}px, var(--border-hair) ${HOUR_HEIGHT}px)`,
            }}>
              {APPTS.filter(a => a.op === opIdx).map((a, i) => (
                <AppointmentBlock key={i} appt={a} onSelect={() => onSelectPatient(a.patient)} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppointmentBlock({ appt, onSelect }) {
  const [hover, setHover] = React.useState(false);
  const s = STATUS_STYLES[appt.status];
  const top = (appt.start / 60) * HOUR_HEIGHT;
  const height = (appt.dur / 60) * HOUR_HEIGHT;
  const textColor = s.textColor || 'var(--fg-1)';
  const subColor = s.textColor || 'var(--fg-3)';

  return (
    <button onClick={onSelect}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute', top: top + 2, left: 4, right: 4,
        height: height - 4, padding: '6px 10px',
        background: s.bg, color: textColor,
        border: `1px solid ${s.border}`, borderLeft: `3px solid ${s.accent}`,
        borderRadius: 'var(--r-2)',
        boxShadow: hover ? 'var(--shadow-2)' : 'var(--shadow-hair)',
        transition: 'box-shadow var(--dur-1) var(--ease-standard)',
        textAlign: 'left', cursor: 'pointer',
        overflow: 'hidden',
      }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 0,
        color: subColor, fontVariantNumeric: 'tabular-nums',
      }}>
        {formatTime(8 * 60 + appt.start)} – {formatTime(8 * 60 + appt.start + appt.dur)}
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, marginTop: 2, lineHeight: 1.2 }}>
        {appt.patient}
      </div>
      {height > 44 && (
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: subColor, marginTop: 3, lineHeight: 1.2 }}>
          {appt.type}
        </div>
      )}
    </button>
  );
}

function formatTime(m) {
  const h = Math.floor(m / 60), mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function ScheduleHeader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '18px 20px 14px',
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
          Tuesday · 12 Aug
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 600, color: 'var(--fg-1)', letterSpacing: '-0.01em', marginTop: 4 }}>
          Today's schedule
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 4, background: 'var(--paper-100)', padding: 3, borderRadius: 'var(--r-2)' }}>
        {['Day', 'Week', 'Month'].map((v, i) => (
          <button key={v} style={{
            height: 26, padding: '0 12px', border: 'none', borderRadius: 4,
            background: i === 0 ? '#fff' : 'transparent',
            boxShadow: i === 0 ? 'var(--shadow-1)' : 'none',
            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
            color: i === 0 ? 'var(--fg-1)' : 'var(--fg-3)', cursor: 'pointer',
          }}>{v}</button>
        ))}
      </div>
      <Button variant="secondary" size="sm" icon="filter">Filter</Button>
      <Button variant="primary" size="sm" icon="plus">New appointment</Button>
    </div>
  );
}

Object.assign(window, { ScheduleView });

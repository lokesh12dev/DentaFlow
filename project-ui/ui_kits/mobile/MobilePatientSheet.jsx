// MobilePatientSheet.jsx — slide-up patient sheet

function MobilePatientSheet({ patient, onClose, onVoice }) {
  if (!patient) return null;
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 44 /* below status bar */, top: 0, bottom: 0, left: 0, right: 0,
      background: 'var(--bg-scrim)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'df-fade 260ms var(--ease-standard)',
      zIndex: 10,
    }}>
      <style>{`@keyframes df-fade { from { opacity: 0 } to { opacity: 1 } } @keyframes df-slide { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxHeight: '86%', overflow: 'auto',
        background: '#fff',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        animation: 'df-slide 320ms var(--ease-standard)',
        paddingBottom: 30,
      }}>
        {/* Grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 38, height: 4, borderRadius: 999, background: 'var(--paper-300)' }} />
        </div>

        <div style={{ padding: '10px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MAvatar name={patient} size={54} tone="teal" />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 600, color: 'var(--fg-1)', letterSpacing: '-0.01em' }}>{patient}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)', marginTop: 3, letterSpacing: 0 }}>#A-4021 · 34F</div>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, background: 'var(--paper-100)', borderRadius: 999, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-2)', cursor: 'pointer' }}>
              <MIcon name="x" size={18} />
            </button>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, margin: '18px 0 22px' }}>
            <QuickAction icon="mic" label="Voice note" onClick={onVoice} primary />
            <QuickAction icon="camera" label="Photo" />
            <QuickAction icon="message" label="Message" />
            <QuickAction icon="phone" label="Call" />
          </div>

          {/* Vitals list */}
          <SectionEyebrow>Alerts</SectionEyebrow>
          <div style={{ background: 'var(--coral-50)', borderRadius: 'var(--r-2)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--coral-500)' }} />
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--coral-600)', fontWeight: 500 }}>Allergy · Penicillin</div>
          </div>

          <SectionEyebrow>Last visit</SectionEyebrow>
          <div style={{ background: 'var(--paper-100)', borderRadius: 'var(--r-2)', padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', letterSpacing: 0 }}>4 Aug 2026</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--fg-3)' }}>· Mia Chen, RDH</div>
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.5, color: 'var(--fg-1)' }}>
              Prophy completed. Localized gingival inflammation on lower anterior. Reviewed brushing technique.
            </div>
          </div>

          <SectionEyebrow>Treatment plan · Active</SectionEyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <PlanRow code="D2392" desc="Composite · #14 MO" fee="$285" status="amber" />
            <PlanRow code="D2740" desc="Crown · #30 · porcelain" fee="$1,240" status="amber" />
            <PlanRow code="D1110" desc="Prophylaxis · adult" fee="$120" status="mint" />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick, primary }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '14px 4px',
      background: primary ? 'var(--teal-500)' : 'var(--paper-100)',
      color: primary ? '#fff' : 'var(--fg-1)',
      border: 'none', borderRadius: 'var(--r-3)',
      cursor: 'pointer',
    }}>
      <MIcon name={icon} size={20} />
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500 }}>{label}</span>
    </button>
  );
}

function SectionEyebrow({ children }) {
  return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', margin: '6px 0 8px' }}>{children}</div>;
}

function PlanRow({ code, desc, fee, status }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fff', border: '1px solid var(--border-1)', borderRadius: 'var(--r-2)' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', letterSpacing: 0, width: 52 }}>{code}</div>
      <div style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)' }}>{desc}</div>
      <MBadge tone={status}>{status === 'mint' ? 'Done' : 'Planned'}</MBadge>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: 'var(--fg-1)', letterSpacing: 0, fontVariantNumeric: 'tabular-nums', width: 60, textAlign: 'right' }}>{fee}</div>
    </div>
  );
}

Object.assign(window, { MobilePatientSheet });

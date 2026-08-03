// MobileTabBar.jsx — bottom tab bar

const TABS = [
  { id: 'today',    label: 'Today',    icon: 'calendar' },
  { id: 'patients', label: 'Patients', icon: 'users' },
  { id: 'action',   label: '',         icon: 'plus', center: true },
  { id: 'messages', label: 'Messages', icon: 'message', badge: 3 },
  { id: 'more',     label: 'More',     icon: 'more' },
];

function MobileTabBar({ current, onChange, onVoice }) {
  return (
    <div style={{
      flexShrink: 0,
      padding: '10px 12px 22px',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--border-hair)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    }}>
      {TABS.map(t => {
        if (t.center) {
          return (
            <button key={t.id} onClick={onVoice} style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--teal-500)', color: '#fff',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(31,110,102,0.35)',
              marginTop: -12,
            }}>
              <MIcon name="mic" size={24} />
            </button>
          );
        }
        const active = current === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: active ? 'var(--teal-600)' : 'var(--fg-3)',
            padding: '4px 10px', position: 'relative',
          }}>
            <MIcon name={t.icon} size={22} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 500 }}>{t.label}</span>
            {t.badge && <span style={{ position: 'absolute', top: 0, right: 4, width: 15, height: 15, borderRadius: 999, background: 'var(--coral-500)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: 0 }}>{t.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { MobileTabBar });

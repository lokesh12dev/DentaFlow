// SideRail.jsx — Primary vertical navigation (240px)

const NAV_ITEMS = [
  { id: 'schedule',   label: 'Schedule',        icon: 'calendar', badge: 3 },
  { id: 'patients',   label: 'Patients',        icon: 'users' },
  { id: 'chart',      label: 'Patient chart',   icon: 'chart' },
  { id: 'messages',   label: 'Messages',        icon: 'message', badge: 7 },
  { id: 'billing',    label: 'Billing',         icon: 'card' },
  { id: 'lab',        label: 'Lab cases',       icon: 'flask' },
  { id: 'inventory',  label: 'Inventory',       icon: 'box' },
  { id: 'automations',label: 'Automations',     icon: 'sparkle' },
];

const SECONDARY = [
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

function SideRail({ current, onChange }) {
  return (
    <div style={{
      width: 224, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--paper-100)',
      borderRight: '1px solid var(--border-hair)',
      padding: '12px 10px',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'var(--fg-4)',
        padding: '4px 8px 8px',
      }}>Practice</div>

      {NAV_ITEMS.map(item => (
        <NavItem key={item.id} item={item} active={current === item.id} onClick={() => onChange(item.id)} />
      ))}

      <div style={{ flex: 1 }} />

      <div style={{
        margin: '10px 6px 12px', padding: '12px 12px 14px',
        background: '#fff',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--teal-600)' }}>
          <Icon name="sparkle" size={12} /> AI Copilot
        </div>
        <div style={{ marginTop: 6, fontFamily: 'var(--font-sans)', fontSize: 12, lineHeight: 1.4, color: 'var(--fg-2)' }}>
          3 recalls due this week. Draft messages?
        </div>
        <button style={{
          marginTop: 10, width: '100%',
          height: 28, border: 'none', borderRadius: 'var(--r-2)',
          background: 'var(--teal-500)', color: '#fff',
          fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
          cursor: 'pointer',
        }}>Review drafts</button>
      </div>

      {SECONDARY.map(item => (
        <NavItem key={item.id} item={item} active={current === item.id} onClick={() => onChange(item.id)} />
      ))}
    </div>
  );
}

function NavItem({ item, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        height: 32, padding: '0 8px', width: '100%',
        border: 'none', borderRadius: 'var(--r-2)',
        background: active ? '#fff' : hover ? 'var(--bg-hover)' : 'transparent',
        boxShadow: active ? 'var(--shadow-1)' : 'none',
        fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active ? 500 : 400,
        color: active ? 'var(--fg-1)' : 'var(--fg-2)',
        cursor: 'pointer', textAlign: 'left', marginBottom: 2,
      }}>
      <Icon name={item.icon} size={16} style={{ color: active ? 'var(--teal-500)' : 'var(--fg-3)' }} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge != null && (
        <span style={{
          minWidth: 18, height: 18, padding: '0 5px',
          borderRadius: 999,
          background: active ? 'var(--teal-50)' : 'var(--paper-200)',
          color: active ? 'var(--teal-700)' : 'var(--fg-3)',
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', letterSpacing: 0,
        }}>{item.badge}</span>
      )}
    </button>
  );
}

Object.assign(window, { SideRail });

// CommandPalette.jsx — ⌘K overlay

function CommandPalette({ open, onClose, onSelectPatient }) {
  const [q, setQ] = React.useState('');
  const inputRef = React.useRef();

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    if (open) setQ('');
  }, [open]);

  const items = [
    { icon: 'user',    section: 'Patients',  label: 'Amelia Okoye',   meta: '#A-4021 · 34F', action: () => { onSelectPatient('Amelia Okoye'); onClose(); }},
    { icon: 'user',    section: 'Patients',  label: 'Marcus Chen',    meta: '#A-4022 · 52M' },
    { icon: 'user',    section: 'Patients',  label: 'Sofia Reyes',    meta: '#A-4023 · 28F' },
    { icon: 'plus',    section: 'Actions',   label: 'New appointment',           kbd: ['N', 'A'] },
    { icon: 'plus',    section: 'Actions',   label: 'New patient',               kbd: ['N', 'P'] },
    { icon: 'mic',     section: 'Actions',   label: 'Start voice note',          kbd: ['V'] },
    { icon: 'calendar',section: 'Navigate',  label: 'Today',                     kbd: ['G', 'T'] },
    { icon: 'card',    section: 'Navigate',  label: 'Billing',                   kbd: ['G', 'B'] },
    { icon: 'flask',   section: 'Navigate',  label: 'Lab cases',                 kbd: ['G', 'L'] },
  ];

  const filtered = q ? items.filter(i => i.label.toLowerCase().includes(q.toLowerCase())) : items;

  if (!open) return null;

  const grouped = {};
  filtered.forEach(i => { (grouped[i.section] ||= []).push(i); });

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-scrim)', backdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      paddingTop: '12vh', zIndex: 50,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 560, maxWidth: '90%',
        background: '#fff', borderRadius: 'var(--r-4)',
        boxShadow: 'var(--shadow-4)',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-hair)' }}>
          <Icon name="search" size={18} style={{ color: 'var(--fg-3)' }} />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search patients, actions, codes…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--fg-1)' }} />
          <Kbd>Esc</Kbd>
        </div>
        <div style={{ maxHeight: 380, overflow: 'auto', padding: 6 }}>
          {Object.entries(grouped).map(([section, its]) => (
            <div key={section}>
              <div style={{ padding: '10px 12px 4px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>{section}</div>
              {its.map((it, i) => (
                <button key={i} onClick={it.action} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '9px 12px', border: 'none', borderRadius: 'var(--r-2)',
                  background: 'transparent', cursor: 'pointer', textAlign: 'left',
                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Icon name={it.icon} size={16} style={{ color: 'var(--fg-3)' }} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)' }}>{it.label}</span>
                  {it.meta && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-4)', letterSpacing: 0 }}>{it.meta}</span>}
                  <span style={{ flex: 1 }} />
                  {it.kbd && <div style={{ display: 'flex', gap: 3 }}>{it.kbd.map(k => <Kbd key={k}>{k}</Kbd>)}</div>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CommandPalette });

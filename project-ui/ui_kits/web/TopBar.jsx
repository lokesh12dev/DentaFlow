// TopBar.jsx — Global top bar (56px)

function TopBar({ onOpenPalette, clinic }) {
  return (
    <div style={{
      height: 56, flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 20px',
      background: '#fff',
      borderBottom: '1px solid var(--border-hair)',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 220 }}>
        <img src="../../assets/logo-mark.svg" alt="" style={{ width: 22, height: 22 }} />
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: 'var(--fg-1)', letterSpacing: '-0.01em' }}>
          DentaFlow
        </div>
      </div>

      {/* Clinic switcher */}
      <button style={{
        display: 'flex', alignItems: 'center', gap: 8,
        height: 32, padding: '0 10px',
        background: 'var(--paper-100)',
        border: '1px solid var(--paper-300)',
        borderRadius: 'var(--r-2)',
        fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)',
        cursor: 'pointer',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--teal-500)' }} />
        {clinic}
        <Icon name="chevronDown" size={14} style={{ color: 'var(--fg-3)' }} />
      </button>

      {/* Search (opens palette) */}
      <button onClick={onOpenPalette} style={{
        flex: 1, maxWidth: 460,
        display: 'flex', alignItems: 'center', gap: 8,
        height: 32, padding: '0 10px',
        background: 'var(--paper-50)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-2)',
        fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-3)',
        cursor: 'pointer', textAlign: 'left',
      }}>
        <Icon name="search" size={14} />
        <span style={{ flex: 1 }}>Search patients, appointments, codes…</span>
        <Kbd>⌘</Kbd><Kbd>K</Kbd>
      </button>

      <div style={{ flex: 1 }} />

      {/* Right actions */}
      <Button variant="ghost" icon="plus" size="sm">New</Button>
      <button style={{ position: 'relative', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 'var(--r-2)', cursor: 'pointer', color: 'var(--fg-2)' }}>
        <Icon name="bell" size={18} />
        <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 999, background: 'var(--coral-500)', border: '1.5px solid #fff' }} />
      </button>
      <Avatar name="Nia Adaora" size={30} />
    </div>
  );
}

Object.assign(window, { TopBar });

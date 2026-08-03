// PhoneFrame.jsx — static iOS-style device shell (390 x 844 screen area)

function PhoneFrame({ children }) {
  const [time, setTime] = React.useState('10:24');
  React.useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{
      width: 420, height: 874,
      background: '#111', borderRadius: 60,
      padding: 14, boxShadow: '0 30px 80px rgba(20,22,26,0.35), 0 0 0 1px rgba(20,22,26,0.4)',
      position: 'relative',
    }}>
      <div style={{
        width: '100%', height: '100%',
        background: 'var(--paper-50)', borderRadius: 46,
        overflow: 'hidden', position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Status bar */}
        <div style={{
          height: 44, flexShrink: 0,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          padding: '0 30px 6px', color: 'var(--fg-1)',
          fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
          position: 'relative',
        }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>
          {/* Dynamic island */}
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 120, height: 32, background: '#0a0a0a', borderRadius: 20 }} />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <svg width="18" height="12" viewBox="0 0 18 12"><path d="M1 9 L 1 11 M4 7 L 4 11 M7 5 L 7 11 M10 3 L 10 11 M13 1 L 13 11 M16 5 L 16 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
            <svg width="16" height="12" viewBox="0 0 16 12"><path d="M2 7 A 6 6 0 0 1 14 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M4.5 8.5 A 3.5 3.5 0 0 1 11.5 8.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="8" cy="10" r="1.2" fill="currentColor"/></svg>
            <div style={{ width: 24, height: 11, border: '1.2px solid currentColor', borderRadius: 3, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 1, left: 1, bottom: 1, width: '78%', background: 'currentColor', borderRadius: 1.5 }} />
              <div style={{ position: 'absolute', right: -3, top: 3, width: 2, height: 5, background: 'currentColor', borderRadius: 1 }} />
            </div>
          </div>
        </div>
        {children}
        {/* Home indicator */}
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 130, height: 4, background: 'var(--ink-900)', borderRadius: 999, opacity: 0.9 }} />
      </div>
    </div>
  );
}

Object.assign(window, { PhoneFrame });

// MobileVoiceNote.jsx — fullscreen voice note capture

function MobileVoiceNote({ onClose }) {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setT(v => v + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');

  return (
    <div style={{
      position: 'absolute', inset: 0, top: 44,
      background: 'var(--ink-900)', color: 'var(--fg-inverse)',
      display: 'flex', flexDirection: 'column',
      zIndex: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 20px 8px' }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <MIcon name="x" size={18} />
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--paper-500)' }}>Voice note</div>
        <div style={{ width: 36 }} />
      </div>

      {/* Patient tag */}
      <div style={{ padding: '10px 20px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
          <MAvatar name="Amelia Okoye" size={22} tone="teal" />
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#fff' }}>Amelia Okoye</div>
          <MIcon name="chevronDown" size={14} style={{ color: 'var(--paper-500)' }} />
        </div>
      </div>

      {/* Waveform + timer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 56, color: '#fff', letterSpacing: 0, fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</div>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 60 }}>
          {Array.from({ length: 42 }).map((_, i) => {
            const seed = (Math.sin((i + t * 3) * 0.7) + 1) / 2;
            const h = 8 + seed * 46;
            return <div key={i} style={{ width: 4, height: h, background: i < 20 + t * 2 ? 'var(--teal-300)' : 'rgba(255,255,255,0.15)', borderRadius: 2, transition: 'height 200ms' }} />;
          })}
        </div>

        {/* Live transcript */}
        <div style={{ padding: '14px 22px', margin: '20px 20px 0', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--r-3)', maxWidth: '80%' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--paper-500)', marginBottom: 6 }}>Live transcript</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.5, color: 'var(--paper-100)' }}>
            Amelia, thirty-four, presents for recall. Reports mild sensitivity on upper left when drinking cold. Reviewed home care<span style={{ opacity: 0.4 }}>…</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '20px 24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 20 }}>
        <button style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontSize: 12 }}>
          Pause
        </button>
        <div style={{ width: 78, height: 78, borderRadius: '50%', background: 'var(--coral-500)', boxShadow: '0 0 0 6px rgba(198,74,46,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 26, height: 26, background: '#fff', borderRadius: 6 }} />
        </div>
        <button onClick={onClose} style={{ padding: '0 18px', height: 56, borderRadius: 999, background: 'var(--teal-500)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500 }}>
          Save
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { MobileVoiceNote });

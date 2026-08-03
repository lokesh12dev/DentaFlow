// MobileApp.jsx — root

function MobileApp() {
  const [tab, setTab] = React.useState('today');
  const [selected, setSelected] = React.useState(null);
  const [voice, setVoice] = React.useState(false);

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {tab === 'today' && <MobileTodayView onSelectPatient={setSelected} />}
      {tab === 'patients' && <MobilePlaceholder title="Patients" body="Directory, quick-view cards, cohort filters." />}
      {tab === 'messages' && <MobilePlaceholder title="Messages" body="Two-way SMS, email, voicemail transcripts." />}
      {tab === 'more' && <MobilePlaceholder title="More" body="Settings, provider tools, help." />}

      <MobileTabBar current={tab} onChange={setTab} onVoice={() => setVoice(true)} />

      {selected && <MobilePatientSheet patient={selected} onClose={() => setSelected(null)} onVoice={() => setVoice(true)} />}
      {voice && <MobileVoiceNote onClose={() => setVoice(false)} />}
    </div>
  );
}

function MobilePlaceholder({ title, body }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30 }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: 'var(--fg-1)', letterSpacing: '-0.02em' }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-3)', textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

Object.assign(window, { MobileApp });

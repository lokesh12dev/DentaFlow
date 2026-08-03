// mobilePrimitives.jsx — Shared mobile atoms
const { useState, useEffect } = React;

const M_ICONS = {
  home:     <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  calendar: <><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></>,
  users:    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  message:  <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  more:     <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  mic:      <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></>,
  chevron:  <polyline points="9 18 15 12 9 6"/>,
  chevronDown: <polyline points="6 9 12 15 18 9"/>,
  x:        <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
  plus:     <><path d="M12 5v14M5 12h14"/></>,
  search:   <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  camera:   <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
  phone:    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>,
  bell:     <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  clock:    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
};
function MIcon({ name, size = 22, style, ...rest }) {
  const paths = M_ICONS[name];
  if (!paths) return null;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, ...style }} {...rest}>{paths}</svg>;
}

const M_BADGE_STYLES = {
  mint:    { bg: 'var(--mint-50)',   fg: 'var(--mint-600)',   dot: 'var(--mint-500)' },
  amber:   { bg: 'var(--amber-50)',  fg: 'var(--amber-600)',  dot: 'var(--amber-500)' },
  coral:   { bg: 'var(--coral-50)',  fg: 'var(--coral-600)',  dot: 'var(--coral-500)' },
  teal:    { bg: 'var(--teal-50)',   fg: 'var(--teal-700)',   dot: 'var(--teal-500)' },
  neutral: { bg: 'var(--paper-200)', fg: 'var(--ink-700)',    dot: 'var(--ink-500)' },
};
function MBadge({ tone = 'neutral', children }) {
  const s = M_BADGE_STYLES[tone];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 8px', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500, lineHeight: 1, borderRadius: 999, background: s.bg, color: s.fg }}>
    <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />{children}</span>;
}

function MAvatar({ name = '', size = 40, tone }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const tones = ['teal', 'slate', 'amber', 'coral', 'mint'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const t = tone || tones[hash % tones.length];
  const bgs = { teal: '#CFE5E0', slate: '#DBE3EE', amber: '#F6E5C4', coral: '#F5D4CA', mint: '#D2EBDA' };
  const fgs = { teal: '#124540', slate: '#38506A', amber: '#9E6B12', coral: '#9E3820', mint: '#23713F' };
  return <div style={{ width: size, height: size, borderRadius: 999, background: bgs[t], color: fgs[t], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: size * 0.4, flexShrink: 0 }}>{initials}</div>;
}

Object.assign(window, { MIcon, MBadge, MAvatar });

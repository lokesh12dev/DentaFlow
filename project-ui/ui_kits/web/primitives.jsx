// primitives.jsx — DentaFlow UI kit atoms
// Load AFTER React + Babel. Exposes to window at end.

const { useState, useRef, useEffect, useMemo } = React;

// ---------- Icon (inline Lucide paths — no CDN) -------------------------
// Add more entries as needed.
const ICON_PATHS = {
  calendar: <><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></>,
  user:     <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  users:    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  file:     <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14,2 14,8 20,8"/></>,
  search:   <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  bell:     <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  message:  <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  chevron:  <polyline points="9 18 15 12 9 6"/>,
  chevronDown: <polyline points="6 9 12 15 18 9"/>,
  plus:     <><path d="M12 5v14M5 12h14"/></>,
  check:    <polyline points="20 6 9 17 4 12"/>,
  x:        <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
  clock:    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  dollar:   <><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  home:     <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  grid:     <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></>,
  chart:    <><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></>,
  card:     <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
  mic:      <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></>,
  image:    <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></>,
  camera:   <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
  activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
  pill:     <><path d="M10.5 20.5 20.5 10.5a4.243 4.243 0 0 0-6-6L4.5 14.5a4.243 4.243 0 0 0 6 6Z"/><path d="m8.5 8.5 7 7"/></>,
  flask:    <><path d="M10 2v7.31"/><path d="M14 9.3V2"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></>,
  box:      <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  arrowRight: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
  more:     <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  sparkle:  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>,
  filter:   <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
  phone:    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>,
  mail:     <><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></>,
};

function Icon({ name, size = 20, stroke, style, ...rest }) {
  const paths = ICON_PATHS[name];
  if (!paths) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={stroke || "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }} {...rest}>
      {paths}
    </svg>
  );
}

// ---------- Button --------------------------------------------------------
function Button({ variant = 'secondary', size = 'md', icon, iconRight, children, style, ...rest }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: size === 'sm' ? 26 : size === 'lg' ? 40 : 32,
    padding: size === 'sm' ? '0 10px' : size === 'lg' ? '0 16px' : '0 12px',
    fontFamily: 'var(--font-sans)', fontSize: size === 'sm' ? 12 : size === 'lg' ? 14 : 13, fontWeight: 500,
    borderRadius: 'var(--r-2)',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'background var(--dur-1) var(--ease-standard), color var(--dur-1)',
    whiteSpace: 'nowrap',
  };
  const variants = {
    primary:   { background: 'var(--teal-500)', color: '#fff' },
    secondary: { background: '#fff', borderColor: 'var(--border-1)', color: 'var(--fg-1)' },
    ghost:     { background: 'transparent', color: 'var(--fg-1)' },
    danger:    { background: 'var(--coral-500)', color: '#fff' },
    subtle:    { background: 'var(--paper-100)', color: 'var(--fg-1)' },
  };
  const [hover, setHover] = useState(false);
  const hoverStyles = hover ? {
    primary:   { background: 'var(--teal-600)' },
    secondary: { background: 'var(--paper-100)' },
    ghost:     { background: 'var(--bg-hover)' },
    danger:    { background: 'var(--coral-600)' },
    subtle:    { background: 'var(--paper-200)' },
  }[variant] : {};
  return (
    <button
      style={{ ...base, ...variants[variant], ...hoverStyles, ...style }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 14 : 16} />}
    </button>
  );
}

// ---------- Badge / Tag ---------------------------------------------------
const BADGE_STYLES = {
  mint:    { bg: 'var(--mint-50)',   fg: 'var(--mint-600)',   dot: 'var(--mint-500)' },
  amber:   { bg: 'var(--amber-50)',  fg: 'var(--amber-600)',  dot: 'var(--amber-500)' },
  coral:   { bg: 'var(--coral-50)',  fg: 'var(--coral-600)',  dot: 'var(--coral-500)' },
  slate:   { bg: 'var(--slate-50)',  fg: 'var(--slate-600)',  dot: 'var(--slate-500)' },
  teal:    { bg: 'var(--teal-50)',   fg: 'var(--teal-700)',   dot: 'var(--teal-500)' },
  neutral: { bg: 'var(--paper-200)', fg: 'var(--ink-700)',    dot: 'var(--ink-500)' },
};
function Badge({ tone = 'neutral', dot = true, children }) {
  const s = BADGE_STYLES[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 22, padding: '0 8px',
      fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500, lineHeight: 1,
      borderRadius: 999, background: s.bg, color: s.fg,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />}
      {children}
    </span>
  );
}

function Tag({ mono = true, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      height: 20, padding: '0 7px',
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
      fontSize: 11, fontWeight: 500, lineHeight: 1, letterSpacing: 0,
      borderRadius: 'var(--r-1)',
      background: 'var(--paper-100)', color: 'var(--ink-700)',
      border: '1px solid var(--paper-300)',
    }}>{children}</span>
  );
}

// ---------- Avatar --------------------------------------------------------
function Avatar({ name = '', size = 32, tone }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  // Deterministic tone from name hash if not given
  const tones = ['teal', 'slate', 'amber', 'coral', 'mint'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const t = tone || tones[hash % tones.length];
  const bgs = { teal: '#CFE5E0', slate: '#DBE3EE', amber: '#F6E5C4', coral: '#F5D4CA', mint: '#D2EBDA' };
  const fgs = { teal: '#124540', slate: '#38506A', amber: '#9E6B12', coral: '#9E3820', mint: '#23713F' };
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: bgs[t], color: fgs[t],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', fontWeight: 500,
      fontSize: size * 0.42,
      flexShrink: 0,
    }}>{initials}</div>
  );
}

// ---------- Input ---------------------------------------------------------
function Input({ leftIcon, style, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      height: 32, padding: '0 10px',
      background: '#fff',
      border: `1px solid ${focus ? 'var(--teal-500)' : 'var(--border-1)'}`,
      borderRadius: 'var(--r-2)',
      boxShadow: focus ? 'var(--shadow-focus)' : 'var(--shadow-inset)',
      transition: 'border-color var(--dur-1), box-shadow var(--dur-1)',
      ...style,
    }}>
      {leftIcon && <Icon name={leftIcon} size={14} style={{ color: 'var(--fg-3)' }} />}
      <input {...rest}
        onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)',
        }} />
    </div>
  );
}

// ---------- Kbd -----------------------------------------------------------
function Kbd({ children }) {
  return (
    <kbd style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 18, height: 18, padding: '0 5px',
      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, lineHeight: 1,
      color: 'var(--fg-3)', background: 'var(--paper-100)',
      border: '1px solid var(--paper-300)', borderRadius: 4,
      letterSpacing: 0,
    }}>{children}</kbd>
  );
}

Object.assign(window, { Icon, Button, Badge, Tag, Avatar, Input, Kbd });

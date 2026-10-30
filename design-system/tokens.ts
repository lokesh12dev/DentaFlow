export const palette = {
  canvas: '#FBF9F6',
  canvasDark: '#11171C',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F2EC',
  surfaceTertiary: '#EDE8DF',
  surfaceDark: '#192127',
  surfaceDarkSecondary: '#212B32',
  text: '#14161A',
  textSecondary: '#363A42',
  // Keep secondary metadata readable against the warm paper canvas.
  textMuted: '#68727D',
  textInverse: '#FBF9F6',
  textDark: '#F4F6F8',
  textDarkSecondary: '#AAB0B8',
  border: '#E1DCD1',
  borderStrong: '#CFC8BB',
  borderDark: '#334049',
  navy: '#124540',
  navyPressed: '#0C332F',
  navySoft: '#EAF4F2',
  teal: '#1F6E66',
  tealPressed: '#185852',
  tealSoft: '#EAF4F2',
  blue: '#356C96',
  blueSoft: '#E8F0F6',
  green: '#237A52',
  greenSoft: '#E7F2EC',
  amber: '#9A6412',
  amberSoft: '#F7EFE1',
  red: '#B74444',
  redSoft: '#F8EAEA',
  focus: '#287E9A',
  rose: '#9C5264',
  roseSoft: '#F6EBEE',
  overlay: 'rgba(12, 18, 24, 0.42)',
  glass: 'rgba(255,255,255,0.82)',
  glassDark: 'rgba(23,27,32,0.86)',
} as const;

/**
 * Dark-theme derivatives. The light theme uses the base palette directly; the dark
 * theme remaps the accent and soft surfaces to luminance-corrected values. Kept here
 * so every color literal lives in the design system and ThemeProvider stays a mapping.
 */
export const darkDerivatives = {
  surfaceTertiary: '#242A31',
  textMuted: '#7E8791',
  borderStrong: '#3A424B',
  primary: '#D8E6F2',
  primaryPressed: '#C5DAEA',
  primarySoft: '#223749',
  clinical: '#57B7AF',
  clinicalPressed: '#42A49C',
  clinicalSoft: '#173C3A',
  successSoft: '#18382A',
  warningSoft: '#3D2F19',
  dangerSoft: '#472324',
  infoSoft: '#1E334A',
  focus: '#65B7CD',
} as const;

export * from './spacing';
export * from './radii';
export * from './typography';
export * from './motion';
export * from './elevation';

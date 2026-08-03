import { Platform } from 'react-native';

export const palette = {
  canvas: '#F5F7F8',
  canvasDark: '#11171C',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F3F5',
  surfaceTertiary: '#E9EEF1',
  surfaceDark: '#192127',
  surfaceDarkSecondary: '#212B32',
  text: '#15202A',
  textSecondary: '#5F6B76',
  textMuted: '#8A949E',
  textInverse: '#FFFFFF',
  textDark: '#F4F6F8',
  textDarkSecondary: '#AAB0B8',
  border: '#DEE4E8',
  borderStrong: '#C9D2D8',
  borderDark: '#334049',
  navy: '#18384A',
  navyPressed: '#102B3A',
  navySoft: '#E8EFF2',
  teal: '#167C78',
  tealPressed: '#0F6764',
  tealSoft: '#E5F3F1',
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
  glassDark: 'rgba(23,27,32,0.86)'
} as const;

export const spacing = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64 } as const;
export const radii = { xs: 8, sm: 10, md: 12, list: 14, lg: 16, sheet: 22, floating: 24, xl: 22, xxl: 24, pill: 999 } as const;
export const sizes = { touch: 44, touchLarge: 52, input: 50, tabBar: 64, iconSm: 16, iconMd: 20, iconLg: 24 } as const;
export const shell = {
  canvasMaxWidth: 768,
  tabBarHeight: 64,
  tabBarBottomGap: 12,
  horizontalInset: 16,
  fabHeight: 52,
  fabGap: 12,
  contentBreathingRoom: 20,
  toastMaxWidth: 560
} as const;

export const tabShellInset = (safeBottom: number) => safeBottom + shell.tabBarBottomGap + shell.tabBarHeight;
export const tabContentInset = (safeBottom: number) => tabShellInset(safeBottom) + shell.fabGap + shell.fabHeight + shell.contentBreathingRoom;
export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '700' as const, letterSpacing: -0.8 },
  title1: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.4 },
  title2: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const, letterSpacing: -0.2 },
  title3: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' as const },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' as const },
  secondary: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  tiny: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const },
  number: { fontSize: 26, lineHeight: 30, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as ['tabular-nums'] }
};

export const fonts = Platform.select({ ios: { regular: 'System', rounded: 'System' }, android: { regular: 'sans-serif', rounded: 'sans-serif' }, default: { regular: 'System', rounded: 'System' } })!;

export const shadows = {
  floating: Platform.select({
    ios: { shadowColor: '#0F1820', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
    android: { elevation: 8 },
    default: {}
  }),
  sheet: Platform.select({
    ios: { shadowColor: '#0F1820', shadowOpacity: 0.18, shadowRadius: 36, shadowOffset: { width: 0, height: -6 } },
    android: { elevation: 16 },
    default: {}
  })
} as const;

import { Platform } from 'react-native';

export const typography = {
  display: { fontSize: 34, lineHeight: 39, fontWeight: '700' as const, letterSpacing: -1.1 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -0.6 },
  title2: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const, letterSpacing: -0.2 },
  title3: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' as const },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' as const },
  secondary: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  tiny: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const },
  number: { fontSize: 26, lineHeight: 30, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as ['tabular-nums'] },
} as const;

export const fonts = Platform.select({
  ios: { regular: 'System', rounded: 'System' },
  android: { regular: 'sans-serif', rounded: 'sans-serif' },
  default: { regular: 'System', rounded: 'System' },
})!;

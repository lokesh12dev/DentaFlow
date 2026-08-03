import { Platform } from 'react-native';

export const shadows = {
  floating: Platform.select({
    ios: { shadowColor: '#0F1820', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
    android: { elevation: 8 },
    default: {},
  }),
  sheet: Platform.select({
    ios: { shadowColor: '#0F1820', shadowOpacity: 0.18, shadowRadius: 36, shadowOffset: { width: 0, height: -6 } },
    android: { elevation: 16 },
    default: {},
  }),
} as const;

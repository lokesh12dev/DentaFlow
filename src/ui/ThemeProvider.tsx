import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { palette } from './tokens';
import { secureStorage } from '@/core/secureStorage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppTheme {
  dark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: {
    canvas: string;
    surface: string;
    surfaceSecondary: string;
    surfaceTertiary: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    border: string;
    borderStrong: string;
    primary: string;
    primaryPressed: string;
    primarySoft: string;
    clinical: string;
    clinicalPressed: string;
    clinicalSoft: string;
    success: string;
    successSoft: string;
    warning: string;
    warningSoft: string;
    danger: string;
    dangerSoft: string;
    info: string;
    infoSoft: string;
    overlay: string;
    glass: string;
    focus: string;
  };
}

const light: AppTheme = {
  dark: false,
  mode: 'light',
  setMode: () => undefined,
  colors: {
    canvas: palette.canvas, surface: palette.surface, surfaceSecondary: palette.surfaceSecondary, surfaceTertiary: palette.surfaceTertiary,
    text: palette.text, textSecondary: palette.textSecondary, textMuted: palette.textMuted, textInverse: palette.textInverse,
    border: palette.border, borderStrong: palette.borderStrong, primary: palette.navy, primaryPressed: palette.navyPressed,
    primarySoft: palette.navySoft, clinical: palette.teal, clinicalPressed: palette.tealPressed, clinicalSoft: palette.tealSoft,
    success: palette.green, successSoft: palette.greenSoft, warning: palette.amber, warningSoft: palette.amberSoft,
    danger: palette.red, dangerSoft: palette.redSoft, info: palette.blue, infoSoft: palette.blueSoft,
    overlay: palette.overlay, glass: palette.glass, focus: palette.focus
  }
};

const dark: AppTheme = {
  dark: true,
  mode: 'dark',
  setMode: () => undefined,
  colors: {
    ...light.colors,
    canvas: palette.canvasDark, surface: palette.surfaceDark, surfaceSecondary: palette.surfaceDarkSecondary,
    surfaceTertiary: '#242A31', text: palette.textDark, textSecondary: palette.textDarkSecondary, textMuted: '#7E8791',
    textInverse: palette.text, border: palette.borderDark, borderStrong: '#3A424B', primary: '#D8E6F2', primaryPressed: '#C5DAEA',
    primarySoft: '#223749', clinical: '#57B7AF', clinicalPressed: '#42A49C', clinicalSoft: '#173C3A',
    successSoft: '#18382A', warningSoft: '#3D2F19', dangerSoft: '#472324', infoSoft: '#1E334A', glass: palette.glassDark,
    focus: '#65B7CD'
  }
};

const ThemeContext = createContext<AppTheme>(light);

export function ThemeProvider({ children, mode }: { children: React.ReactNode; mode?: ThemeMode }) {
  const scheme = useColorScheme();
  const [selectedMode, setSelectedMode] = useState<ThemeMode>(mode ?? 'light');
  useEffect(() => {
    if (mode) return;
    void secureStorage.get('theme.mode').then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') setSelectedMode(saved);
    });
  }, [mode]);
  const updateMode = useCallback((next: ThemeMode) => {
    setSelectedMode(next);
    void secureStorage.set('theme.mode', next);
  }, []);
  const value = useMemo(() => ({ ...(selectedMode === 'dark' || (selectedMode === 'system' && scheme === 'dark') ? dark : light), mode: selectedMode, setMode: updateMode }), [scheme, selectedMode, updateMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

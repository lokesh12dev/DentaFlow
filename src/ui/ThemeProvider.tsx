import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { palette, darkDerivatives } from './tokens';
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
    surfaceTertiary: darkDerivatives.surfaceTertiary, text: palette.textDark, textSecondary: palette.textDarkSecondary,
    textMuted: darkDerivatives.textMuted, textInverse: palette.text, border: palette.borderDark, borderStrong: darkDerivatives.borderStrong,
    primary: darkDerivatives.primary, primaryPressed: darkDerivatives.primaryPressed, primarySoft: darkDerivatives.primarySoft,
    clinical: darkDerivatives.clinical, clinicalPressed: darkDerivatives.clinicalPressed, clinicalSoft: darkDerivatives.clinicalSoft,
    successSoft: darkDerivatives.successSoft, warningSoft: darkDerivatives.warningSoft, dangerSoft: darkDerivatives.dangerSoft,
    infoSoft: darkDerivatives.infoSoft, glass: palette.glassDark, focus: darkDerivatives.focus
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

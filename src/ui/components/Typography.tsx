import React from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { fonts, typography } from '../tokens';
import { useTheme } from '../ThemeProvider';

type Variant = keyof typeof typography;

export function AppText({ variant = 'body', tone = 'primary', tabular = false, style, ...props }: TextProps & { variant?: Variant; tone?: 'primary' | 'secondary' | 'muted' | 'inverse' | 'clinical' | 'danger' | 'success' | 'warning'; tabular?: boolean; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  const color = {
    primary: theme.colors.text,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    inverse: theme.colors.textInverse,
    clinical: theme.colors.clinical,
    danger: theme.colors.danger,
    success: theme.colors.success,
    warning: theme.colors.warning
  }[tone];
  return <Text {...props} style={[{ color, fontFamily: fonts.regular }, typography[variant], tabular ? { fontVariant: ['tabular-nums'] } : null, style]} />;
}

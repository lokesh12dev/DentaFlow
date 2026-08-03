import React from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { radii, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';

export function Surface({ children, tone = 'default', padded = true, style }: { children: React.ReactNode; tone?: 'default' | 'secondary' | 'clinical' | 'warning' | 'danger' | 'success'; padded?: boolean; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const colors = {
    default: [theme.colors.surface, theme.colors.border],
    secondary: [theme.colors.surfaceSecondary, theme.colors.border],
    clinical: [theme.colors.clinicalSoft, theme.colors.clinicalSoft],
    warning: [theme.colors.warningSoft, theme.colors.warningSoft],
    danger: [theme.colors.dangerSoft, theme.colors.dangerSoft],
    success: [theme.colors.successSoft, theme.colors.successSoft]
  }[tone];
  return <View style={[{ backgroundColor: colors[0], borderColor: colors[1], borderWidth: 1, borderRadius: radii.lg, padding: padded ? spacing[4] : 0 }, style]}>{children}</View>;
}

export function PressableSurface({ children, onPress, accessibilityLabel, tone = 'default', style, disabled, ...props }: PressableProps & { children: React.ReactNode; accessibilityLabel: string; tone?: 'default' | 'secondary'; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return <Pressable {...props} disabled={disabled} accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [{ backgroundColor: tone === 'default' ? theme.colors.surface : theme.colors.surfaceSecondary, borderColor: theme.colors.border, borderWidth: 1, borderRadius: radii.lg, opacity: disabled ? 0.45 : pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.995 : 1 }] }, style]}>{children}</Pressable>;
}

import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from '../icons';
import { sizes } from '../tokens';
import { useTheme } from '../ThemeProvider';

type IconTone = 'default' | 'primary' | 'clinical' | 'success' | 'warning' | 'danger' | 'information' | 'inverse';

export function AppIcon({
  icon: Icon,
  size = sizes.iconMd,
  strokeWidth = 2,
  tone = 'default',
  active = false,
  disabled = false,
  style
}: {
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
  tone?: IconTone;
  active?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const color = disabled ? theme.colors.textMuted : active ? theme.colors.clinical : {
    default: theme.colors.textSecondary,
    primary: theme.colors.primary,
    clinical: theme.colors.clinical,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    information: theme.colors.info,
    inverse: theme.colors.textInverse
  }[tone];

  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
    <Icon size={size} color={color} strokeWidth={active ? Math.max(2.25, strokeWidth) : strokeWidth} />
  </View>;
}

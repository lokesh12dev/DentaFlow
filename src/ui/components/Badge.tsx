import React from 'react';
import { View } from 'react-native';
import type { LucideIcon } from '../icons';
import { radii, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'clinical';

export function Badge({ label, tone = 'neutral', icon: Icon, dot = false }: { label: string; tone?: BadgeTone; icon?: LucideIcon; dot?: boolean }) {
  const theme = useTheme();
  const visual = {
    neutral: [theme.colors.surfaceTertiary, theme.colors.textSecondary],
    info: [theme.colors.infoSoft, theme.colors.info],
    success: [theme.colors.successSoft, theme.colors.success],
    warning: [theme.colors.warningSoft, theme.colors.warning],
    danger: [theme.colors.dangerSoft, theme.colors.danger],
    clinical: [theme.colors.clinicalSoft, theme.colors.clinical]
  }[tone];
  return <View accessibilityRole="text" style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing[2], height: 26, borderRadius: radii.pill, backgroundColor: visual[0] }}>
    {dot ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: visual[1] }} /> : null}
    {Icon ? <Icon size={13} color={visual[1]} strokeWidth={2.2} /> : null}
    <AppText variant="caption" style={{ color: visual[1] }}>{label}</AppText>
  </View>;
}

export function Chip({ label, selected, disabled = false, onPress, count }: { label: string; selected?: boolean; disabled?: boolean; onPress: () => void; count?: number }) {
  const theme = useTheme();
  return <PressableChip accessibilityLabel={`${label}${count != null ? `, ${count}` : ''}`} disabled={disabled} onPress={onPress} selected={Boolean(selected)}>
    <AppText variant="label" style={{ color: selected ? theme.colors.textInverse : disabled ? theme.colors.textMuted : theme.colors.textSecondary }}>{label}{count != null ? ` ${count}` : ''}</AppText>
  </PressableChip>;
}

function PressableChip({ children, selected, disabled, onPress, accessibilityLabel }: { children: React.ReactNode; selected: boolean; disabled: boolean; onPress: () => void; accessibilityLabel: string }) {
  const theme = useTheme();
  const { Pressable } = require('react-native') as typeof import('react-native');
  return <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} accessibilityLabel={accessibilityLabel} disabled={disabled} onPress={() => { haptic(); onPress(); }} style={({ pressed }) => ({ minHeight: 38, paddingHorizontal: spacing[3], borderRadius: radii.pill, backgroundColor: selected ? theme.colors.primary : theme.colors.surface, borderWidth: 1, borderColor: selected ? theme.colors.primary : theme.colors.border, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : pressed ? 0.75 : 1 })}>{children}</Pressable>;
}

function haptic() { import('@/core/haptics').then(({ haptics }) => haptics.selection()); }

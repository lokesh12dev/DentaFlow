import React from 'react';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from '../icons';
import { sizes, spacing, radii } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';
import { haptics } from '@/core/haptics';
import { AppIcon } from './AppIcon';

export function Button({ label, onPress, icon: Icon, tone = 'primary', size = 'regular', full = false, loading = false, disabled = false, style }: { label: string; onPress: () => void; icon?: LucideIcon; tone?: 'primary' | 'clinical' | 'secondary' | 'ghost' | 'danger'; size?: 'small' | 'regular' | 'large'; full?: boolean; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const visual = {
    primary: { bg: theme.colors.primary, text: theme.colors.textInverse, border: theme.colors.primary },
    clinical: { bg: theme.colors.clinical, text: theme.colors.textInverse, border: theme.colors.clinical },
    secondary: { bg: theme.colors.surface, text: theme.colors.text, border: theme.colors.borderStrong },
    ghost: { bg: 'transparent', text: theme.colors.textSecondary, border: 'transparent' },
    danger: { bg: theme.colors.danger, text: theme.colors.textInverse, border: theme.colors.danger }
  }[tone];
  const height = size === 'small' ? sizes.touch : size === 'large' ? 56 : sizes.input;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled || loading} onPress={() => { haptics.impact(); onPress(); }} style={({ pressed }) => [{ height, minWidth: height, width: full ? '100%' : undefined, paddingHorizontal: size === 'small' ? spacing[3] : spacing[4], borderRadius: radii.md, backgroundColor: visual.bg, borderWidth: 1, borderColor: visual.border, opacity: disabled ? 0.45 : pressed ? 0.82 : 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2] }, style]}>
    {loading ? <ActivityIndicator color={visual.text} /> : <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>{Icon ? <AppIcon icon={Icon} size={18} tone={tone === 'secondary' || tone === 'ghost' ? 'default' : 'inverse'} /> : null}<AppText variant="label" style={{ color: visual.text }}>{label}</AppText></View>}
  </Pressable>;
}

export function IconButton({ label, onPress, icon: Icon, tone = 'default', badge, size = sizes.touch }: { label: string; onPress: () => void; icon: LucideIcon; tone?: 'default' | 'primary' | 'clinical' | 'danger'; badge?: number; size?: number }) {
  const theme = useTheme();
  const visual = {
    default: { bg: theme.colors.surfaceSecondary, fg: theme.colors.textSecondary, border: theme.colors.border },
    primary: { bg: theme.colors.primary, fg: theme.colors.textInverse, border: theme.colors.primary },
    clinical: { bg: theme.colors.clinical, fg: theme.colors.textInverse, border: theme.colors.clinical },
    danger: { bg: theme.colors.dangerSoft, fg: theme.colors.danger, border: theme.colors.dangerSoft }
  }[tone];
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { haptics.selection(); onPress(); }} style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, backgroundColor: visual.bg, borderWidth: 1, borderColor: visual.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.72 : 1 })}>
    <AppIcon icon={Icon} size={20} tone={tone === 'primary' || tone === 'clinical' ? 'inverse' : tone === 'danger' ? 'danger' : 'default'} />
    {badge ? <View style={{ position: 'absolute', right: -2, top: -2, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: theme.colors.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.surface }}><AppText variant="tiny" tone="inverse">{badge > 9 ? '9+' : badge}</AppText></View> : null}
  </Pressable>;
}

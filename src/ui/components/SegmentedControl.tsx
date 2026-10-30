import React from 'react';
import { Pressable, View } from 'react-native';
import { radii, sizes, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';
import { haptics } from '@/core/haptics';

export function SegmentedControl<T extends string>({ options, value, onChange, compact = false }: { options: readonly { value: T; label: string; count?: number }[]; value: T; onChange: (value: T) => void; compact?: boolean }) {
  const theme = useTheme();
  return <View accessibilityRole="tablist" style={{ flexDirection: 'row', padding: 3, borderRadius: radii.md, backgroundColor: theme.colors.surfaceTertiary, gap: 2 }}>
    {options.map((option) => {
      const selected = option.value === value;
      return <Pressable key={option.value} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={`${option.label}${option.count != null ? `, ${option.count}` : ''}`} onPress={() => { haptics.selection(); onChange(option.value); }} style={({ pressed }) => ({ flex: 1, minHeight: sizes.touch, paddingHorizontal: spacing[2], borderRadius: radii.sm, backgroundColor: selected ? theme.colors.surface : 'transparent', borderWidth: selected ? 1 : 0, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.72 : 1 })}>
        <AppText variant={compact ? 'caption' : 'label'} tone={selected ? 'primary' : 'secondary'} numberOfLines={1}>{option.label}{option.count != null ? ` ${option.count}` : ''}</AppText>
      </Pressable>;
    })}
  </View>;
}

import React from 'react';
import { Pressable, View } from 'react-native';
import { TOOTH_NUMBERS } from '@/domain/constants';
import type { ToothRecord } from '@/domain/types';
import { radii, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';

/**
 * Fill color per tooth condition, from theme tokens. 'healthy' is the absence of a
 * stored condition; each condition carries the soft tone of its clinical family,
 * matching the legend rendered below the chart.
 */
function useConditionTones(): Record<ToothRecord['condition'], string> {
  const theme = useTheme();
  return {
    healthy: theme.colors.surface,
    caries: theme.colors.dangerSoft,
    filled: theme.colors.infoSoft,
    crown: theme.colors.warningSoft,
    missing: theme.colors.surfaceTertiary,
    implant: theme.colors.clinicalSoft,
    'root-canal': theme.colors.clinicalSoft,
    bridge: theme.colors.warningSoft,
    mobility: theme.colors.dangerSoft,
    watch: theme.colors.warningSoft
  };
}

export function ToothChart({ records = [], selected = [], onSelect, readonly = false }: { records?: ToothRecord[]; selected?: number[]; onSelect?: (tooth: number) => void; readonly?: boolean }) {
  const theme = useTheme();
  const conditionTones = useConditionTones();
  const recordMap = new Map(records.map((item) => [item.toothNumber, item]));
  const groups = [TOOTH_NUMBERS.slice(0, 8), TOOTH_NUMBERS.slice(8, 16), TOOTH_NUMBERS.slice(16, 24), TOOTH_NUMBERS.slice(24, 32)];
  const conditionColor = (condition?: ToothRecord['condition']): string => conditionTones[condition ?? 'healthy'];
  return <View accessibilityLabel="Adult tooth chart" style={{ gap: spacing[3] }}>
    {groups.map((group, groupIndex) => <View key={groupIndex} style={{ flexDirection: 'row', justifyContent: 'center', gap: 5 }}>{group.map((tooth) => {
      const record = recordMap.get(tooth);
      const isSelected = selected.includes(tooth);
      // Visual cells stay compact (dentistry-standard 32-tooth layout); hitSlop restores the
      // 44px minimum touch target without overlapping neighbouring teeth.
      return <Pressable key={tooth} disabled={readonly || !onSelect} accessibilityRole="button" accessibilityLabel={`Tooth ${tooth}${record ? `, ${record.condition}` : ', healthy'}`} accessibilityState={{ selected: isSelected }} onPress={() => onSelect?.(tooth)} hitSlop={{ left: 5, right: 5, top: 1, bottom: 2 }} style={({ pressed }) => ({ width: 34, height: 42, borderRadius: radii.sm, borderWidth: isSelected ? 2 : 1, borderColor: isSelected ? theme.colors.primary : theme.colors.borderStrong, backgroundColor: isSelected ? theme.colors.primarySoft : conditionColor(record?.condition), alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.68 : record?.condition === 'missing' ? 0.48 : 1 })}><AppText variant="caption" style={{ color: isSelected ? theme.colors.primary : theme.colors.text }}>{tooth}</AppText></Pressable>;
    })}</View>)}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], paddingTop: spacing[2] }}>{[
      ['Caries', theme.colors.dangerSoft], ['Filled', theme.colors.infoSoft], ['Crown', theme.colors.warningSoft], ['Implant / RCT', theme.colors.clinicalSoft], ['Missing', theme.colors.surfaceTertiary]
    ].map(([label, color]) => <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} /><AppText variant="caption" tone="secondary">{label}</AppText></View>)}</View>
  </View>;
}

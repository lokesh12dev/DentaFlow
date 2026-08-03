import React from 'react';
import { View } from 'react-native';
import type { LucideIcon } from '../icons';
import { radii, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';
import { AppIcon } from './AppIcon';

export type MetricStripItem = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: 'primary' | 'clinical' | 'success' | 'warning' | 'danger' | 'info';
};

export function MetricStrip({ items, accessibilityLabel = 'Clinic pulse' }: { items: MetricStripItem[]; accessibilityLabel?: string }) {
  const theme = useTheme();
  return <View accessible accessibilityLabel={accessibilityLabel} style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: theme.colors.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border }}>
    {items.map((item, index) => {
      const tone = item.tone ?? 'primary';
      return <View key={item.label} style={{ flexGrow: 1, flexBasis: 0, minWidth: 0, minHeight: 68, paddingHorizontal: spacing[2], paddingVertical: spacing[3], justifyContent: 'center', borderLeftWidth: index ? 1 : 0, borderColor: theme.colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
          {item.icon ? <AppIcon icon={item.icon} size={15} tone={tone === 'info' ? 'information' : tone} /> : null}
          <AppText variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>{item.value}</AppText>
        </View>
        <AppText variant="tiny" tone="muted" numberOfLines={1}>{item.label}</AppText>
      </View>;
    })}
  </View>;
}

export function MetricTile({ label, value, icon: Icon, tone = 'primary', detail }: { label: string; value: string | number; icon: LucideIcon; tone?: 'primary' | 'clinical' | 'success' | 'warning' | 'danger' | 'info'; detail?: string }) {
  const theme = useTheme();
  const visual = {
    primary: [theme.colors.primarySoft, theme.colors.primary], clinical: [theme.colors.clinicalSoft, theme.colors.clinical],
    success: [theme.colors.successSoft, theme.colors.success], warning: [theme.colors.warningSoft, theme.colors.warning],
    danger: [theme.colors.dangerSoft, theme.colors.danger], info: [theme.colors.infoSoft, theme.colors.info]
  }[tone];
  return <View style={{ flex: 1, minWidth: 145, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: radii.lg, padding: spacing[4], gap: spacing[3] }}>
    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: visual[0], alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color={visual[1]} /></View>
    <View style={{ gap: 2 }}><AppText variant="number">{value}</AppText><AppText variant="caption" tone="secondary">{label}</AppText>{detail ? <AppText variant="tiny" style={{ color: visual[1] }}>{detail}</AppText> : null}</View>
  </View>;
}

export function ProgressBar({ value, tone = 'clinical', label }: { value: number; tone?: 'clinical' | 'success' | 'warning' | 'danger' | 'primary'; label?: string }) {
  const theme = useTheme();
  const color = { clinical: theme.colors.clinical, success: theme.colors.success, warning: theme.colors.warning, danger: theme.colors.danger, primary: theme.colors.primary }[tone];
  return <View style={{ gap: spacing[2] }}>{label ? <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><AppText variant="caption" tone="secondary">{label}</AppText><AppText variant="caption">{Math.round(value)}%</AppText></View> : null}<View style={{ height: 7, borderRadius: 4, backgroundColor: theme.colors.surfaceTertiary, overflow: 'hidden' }}><View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} /></View></View>;
}

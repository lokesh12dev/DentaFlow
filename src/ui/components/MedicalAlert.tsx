import React from 'react';
import { View } from 'react-native';
import { HeartPulse, TriangleAlert } from '../icons';
import { radii, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';
import type { MedicalAlert as MedicalAlertType } from '@/domain/types';

export function MedicalAlertCard({ alerts, compact = false }: { alerts: MedicalAlertType[]; compact?: boolean }) {
  const theme = useTheme();
  const critical = alerts.some((item) => item.severity === 'critical' || item.severity === 'high');
  const Icon = critical ? TriangleAlert : HeartPulse;
  const background = critical ? theme.colors.dangerSoft : theme.colors.warningSoft;
  const color = critical ? theme.colors.danger : theme.colors.warning;
  if (!alerts.length) return null;
  return <View accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], backgroundColor: background, borderRadius: radii.lg, padding: compact ? spacing[3] : spacing[4] }}>
    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' }}><Icon size={19} color={color} /></View>
    <View style={{ flex: 1, gap: compact ? 1 : 3 }}><AppText variant="label" style={{ color }}>{critical ? 'Important medical alert' : 'Medical information'}</AppText><AppText variant={compact ? 'caption' : 'bodyStrong'}>{alerts.map((item) => item.label).join(' · ')}</AppText>{!compact && alerts.some((item) => item.detail) ? <AppText variant="caption" tone="secondary">{alerts.map((item) => item.detail).filter(Boolean).join(' · ')}</AppText> : null}</View>
  </View>;
}

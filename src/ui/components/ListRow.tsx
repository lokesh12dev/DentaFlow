import React from 'react';
import { Pressable, View } from 'react-native';
import type { LucideIcon } from '../icons';
import { ChevronRight } from '../icons';
import { radii, sizes, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';
import { Badge, type BadgeTone } from './Badge';

export function Avatar({ name, size = 44, tone = 'primary' }: { name: string; size?: number; tone?: 'primary' | 'clinical' | 'info' | 'warning' | 'danger' }) {
  const theme = useTheme();
  const visual = {
    primary: [theme.colors.primarySoft, theme.colors.primary], clinical: [theme.colors.clinicalSoft, theme.colors.clinical],
    info: [theme.colors.infoSoft, theme.colors.info], warning: [theme.colors.warningSoft, theme.colors.warning], danger: [theme.colors.dangerSoft, theme.colors.danger]
  }[tone];
  const letters = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return <View accessibilityRole="image" accessibilityLabel={`${name} avatar`} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: visual[0], alignItems: 'center', justifyContent: 'center' }}><AppText variant="label" style={{ color: visual[1] }}>{letters}</AppText></View>;
}

export function ListRow({ title, subtitle, meta, icon: Icon, iconTone = 'primary', badge, badgeTone = 'neutral', leading, trailing, onPress, accessibilityLabel, showChevron = Boolean(onPress), destructive = false }: { title: string; subtitle?: string; meta?: string; icon?: LucideIcon; iconTone?: 'primary' | 'clinical' | 'info' | 'warning' | 'danger'; badge?: string; badgeTone?: BadgeTone; leading?: React.ReactNode; trailing?: React.ReactNode; onPress?: () => void; accessibilityLabel?: string; showChevron?: boolean; destructive?: boolean }) {
  const theme = useTheme();
  const iconVisual = {
    primary: [theme.colors.primarySoft, theme.colors.primary], clinical: [theme.colors.clinicalSoft, theme.colors.clinical],
    info: [theme.colors.infoSoft, theme.colors.info], warning: [theme.colors.warningSoft, theme.colors.warning], danger: [theme.colors.dangerSoft, theme.colors.danger]
  }[iconTone];
  const content = <View style={{ minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] }}>
    {leading ?? (Icon ? <View style={{ width: 40, height: 40, borderRadius: radii.md, backgroundColor: iconVisual[0], alignItems: 'center', justifyContent: 'center' }}><Icon size={19} color={iconVisual[1]} /></View> : null)}
    <View style={{ flex: 1, gap: 2 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}><AppText variant="bodyStrong" tone={destructive ? 'danger' : 'primary'} numberOfLines={1} style={{ flexShrink: 1 }}>{title}</AppText>{badge ? <Badge label={badge} tone={badgeTone} /> : null}</View>{subtitle ? <AppText tone="secondary" numberOfLines={2}>{subtitle}</AppText> : null}{meta ? <AppText variant="caption" tone="muted" numberOfLines={1} tabular>{meta}</AppText> : null}</View>
    {trailing}{showChevron ? <ChevronRight size={18} color={theme.colors.textMuted} /> : null}
  </View>;
  if (!onPress) return content;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, minHeight: sizes.touch })}>{content}</Pressable>;
}

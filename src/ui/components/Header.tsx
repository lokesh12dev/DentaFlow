import React from 'react';
import { Pressable, View } from 'react-native';
import type { LucideIcon } from '../icons';
import { ArrowLeft, Bell, Search } from '../icons';
import { spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';
import { IconButton } from './Button';
import { AppIcon } from './AppIcon';

export function PageHeader({ title, subtitle, eyebrow, onBack, onSearch, onNotifications, notificationCount, right }: { title: string; subtitle?: string; eyebrow?: string; onBack?: () => void; onSearch?: () => void; onNotifications?: () => void; notificationCount?: number; right?: React.ReactNode }) {
  const theme = useTheme();
  return <View style={{ paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[4], gap: spacing[3] }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
      {onBack ? <IconButton label="Go back" icon={ArrowLeft} onPress={onBack} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        {eyebrow ? <AppText variant="tiny" style={{ color: theme.colors.clinical, textTransform: 'uppercase', letterSpacing: 0.9 }}>{eyebrow}</AppText> : null}
        <AppText variant="title1" numberOfLines={1}>{title}</AppText>
        {subtitle ? <AppText tone="secondary" numberOfLines={2}>{subtitle}</AppText> : null}
      </View>
      {onSearch ? <IconButton label="Open command search" icon={Search} onPress={onSearch} /> : null}
      {onNotifications ? <IconButton label="Open notifications" icon={Bell} badge={notificationCount} onPress={onNotifications} /> : null}
      {right}
    </View>
  </View>;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction, icon: Icon }: { title: string; subtitle?: string; actionLabel?: string; onAction?: () => void; icon?: LucideIcon }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[3] }}>
    {Icon ? <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><AppIcon icon={Icon} size={18} tone="primary" /></View> : null}
    <View style={{ flex: 1, gap: 1 }}>
      <AppText variant="title3">{title}</AppText>
      {subtitle ? <AppText variant="caption" tone="secondary">{subtitle}</AppText> : null}
    </View>
    {actionLabel && onAction ? <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} hitSlop={10} onPress={onAction}><AppText variant="label" tone="clinical">{actionLabel}</AppText></Pressable> : null}
  </View>;
}

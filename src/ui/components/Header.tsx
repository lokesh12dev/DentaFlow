import React from 'react';
import { Pressable, View } from 'react-native';
import type { LucideIcon } from '../icons';
import { ArrowLeft, Bell, Search } from '../icons';
import { spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';
import { IconButton } from './Button';
import { AppIcon } from './AppIcon';

export function PageHeader({ title, subtitle, eyebrow, onBack, onSearch, onNotifications, notificationCount, primaryAction, right }: { title: string; subtitle?: string; eyebrow?: string; onBack?: () => void; onSearch?: () => void; onNotifications?: () => void; notificationCount?: number; primaryAction?: { label: string; icon: LucideIcon; onPress: () => void }; right?: React.ReactNode }) {
  const theme = useTheme();
  const isStackHeader = Boolean(onBack);
  return <View style={{ paddingHorizontal: spacing[5], paddingTop: isStackHeader ? spacing[2] : spacing[3], paddingBottom: spacing[5] }}>
    <View style={{ flexDirection: 'row', alignItems: isStackHeader ? 'center' : 'flex-start', gap: spacing[3] }}>
      {onBack ? <IconButton label="Go back" icon={ArrowLeft} onPress={onBack} /> : null}
      <View style={{ flex: 1, gap: spacing[1], paddingTop: isStackHeader ? spacing[1] : 0 }}>
        {eyebrow ? <AppText variant="tiny" style={{ color: theme.colors.clinical, textTransform: 'uppercase', letterSpacing: 1.2 }}>{eyebrow}</AppText> : null}
        <AppText variant={isStackHeader ? 'title2' : 'title1'} numberOfLines={1}>{title}</AppText>
        {subtitle ? <AppText variant="secondary" tone="secondary" numberOfLines={2}>{subtitle}</AppText> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        {onSearch ? <IconButton label="Search" icon={Search} onPress={onSearch} /> : null}
        {onNotifications ? <IconButton label="Notifications" icon={Bell} badge={notificationCount} onPress={onNotifications} /> : null}
        {primaryAction ? <IconButton label={primaryAction.label} icon={primaryAction.icon} tone="primary" onPress={primaryAction.onPress} /> : null}
        {right}
      </View>
    </View>
  </View>;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction, icon: Icon }: { title: string; subtitle?: string; actionLabel?: string; onAction?: () => void; icon?: LucideIcon }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] }}>
    {Icon ? <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><AppIcon icon={Icon} size={18} tone="primary" /></View> : null}
    <View style={{ flex: 1, gap: 1 }}>
      <AppText variant="title3">{title}</AppText>
      {subtitle ? <AppText variant="caption" tone="secondary">{subtitle}</AppText> : null}
    </View>
    {actionLabel && onAction ? <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} hitSlop={10} onPress={onAction}><AppText variant="label" tone="clinical">{actionLabel}</AppText></Pressable> : null}
  </View>;
}

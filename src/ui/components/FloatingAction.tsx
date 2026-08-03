import React from 'react';
import { Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { router, useGlobalSearchParams, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LucideIcon } from '../icons';
import { CalendarDays, MessageCircle, Plus, Stethoscope, UserRoundPlus } from '../icons';
import { radii, shadows, shell, sizes, spacing, tabShellInset } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';
import { haptics } from '@/core/haptics';
import { AppIcon } from './AppIcon';

export function FloatingAction({ label, onPress, icon: Icon = Plus, compact = false }: { label: string; onPress: () => void; icon?: LucideIcon; compact?: boolean }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { haptics.impact(); onPress(); }} style={({ pressed }) => [{ height: sizes.touchLarge, minWidth: sizes.touchLarge, borderRadius: radii.pill, paddingHorizontal: compact ? 0 : spacing[4], backgroundColor: pressed ? theme.colors.primaryPressed : theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }], ...(Platform.OS === 'web' ? { outlineColor: theme.colors.focus } : undefined) }, shadows.floating]}>
    <AppIcon icon={Icon} size={21} tone="inverse" strokeWidth={2.2} />
    {!compact ? <AppText variant="label" tone="inverse">{label}</AppText> : null}
  </Pressable>;
}

const tabActions: Record<string, { label: string; icon: LucideIcon; route: string }> = {
  '/today': { label: 'New appointment', icon: CalendarDays, route: '/appointment/new' },
  '/patients': { label: 'Add patient', icon: UserRoundPlus, route: '/patient/new' },
  '/calendar': { label: 'Book appointment', icon: CalendarDays, route: '/appointment/new' },
  '/inbox': { label: 'New conversation', icon: MessageCircle, route: '/communication/new' }
};

export function ContextualFAB() {
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ id?: string | string[] }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const normalizedPath = pathname.replace(/^\/\(tabs\)/, '').replace(/\/$/, '') || '/';
  const isTabRoute = Boolean(tabActions[normalizedPath]) || normalizedPath === '/more';
  const patientId = normalizedPath.startsWith('/patient/') ? (Array.isArray(params.id) ? params.id[0] : params.id) ?? normalizedPath.split('/')[2] : undefined;
  const action = tabActions[normalizedPath] ?? (patientId ? { label: 'Add clinical entry', icon: Stethoscope, route: `/clinical/note?patientId=${patientId}` } : undefined);
  if (!action) return null;

  const bottom = isTabRoute ? tabShellInset(insets.bottom) + shell.fabGap : insets.bottom + shell.contentBreathingRoom;
  return <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom, zIndex: 90, alignItems: 'center', paddingHorizontal: shell.horizontalInset }}>
    <View pointerEvents="box-none" style={{ width: '100%', maxWidth: shell.canvasMaxWidth, alignItems: 'flex-end' }}>
      <FloatingAction label={action.label} icon={action.icon} compact={width < 370} onPress={() => router.push(action.route as never)} />
    </View>
  </View>;
}

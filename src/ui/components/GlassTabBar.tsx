import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, Home, Inbox, MoreHorizontal, UsersRound, type LucideIcon } from '../icons';
import { radii, shadows, shell, sizes, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';
import { haptics } from '@/core/haptics';
import { AppIcon } from './AppIcon';

const tabIcons: Record<string, LucideIcon> = { today: Home, patients: UsersRound, calendar: CalendarDays, inbox: Inbox, more: MoreHorizontal };

export function GlassTabBar({ state, descriptors, navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const content = <View style={{ height: sizes.tabBar, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[1], borderRadius: radii.floating, borderWidth: 1, borderColor: theme.colors.borderStrong, overflow: 'hidden' }}>
    {state.routes.map((route: any, index: number) => {
      const focused = state.index === index;
      const label = descriptors[route.key]?.options?.tabBarLabel ?? descriptors[route.key]?.options?.title ?? route.name;
      const Icon = tabIcons[route.name] ?? MoreHorizontal;
      return <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={String(label)} onPress={() => { haptics.selection(); const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params); }} onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })} style={({ pressed }) => ({ flex: 1, minWidth: 44, height: 56, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: focused ? theme.colors.clinicalSoft : pressed ? theme.colors.surfaceSecondary : 'transparent', opacity: pressed ? 0.72 : 1, ...(Platform.OS === 'web' ? { outlineColor: theme.colors.focus } : undefined) })}>
        <AppIcon icon={Icon} active={focused} size={20} />
        <AppText variant="tiny" style={{ color: focused ? theme.colors.clinical : theme.colors.textSecondary }}>{String(label)}</AppText>
      </Pressable>;
    })}
  </View>;
  return <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + shell.tabBarBottomGap, zIndex: 80, alignItems: 'center', paddingHorizontal: shell.horizontalInset }}>
    <View style={{ width: '100%', maxWidth: shell.canvasMaxWidth }}>
      {Platform.OS === 'ios' ? <BlurView intensity={50} tint={theme.dark ? 'dark' : 'light'} style={[{ borderRadius: radii.floating, backgroundColor: theme.colors.glass, overflow: 'hidden' }, shadows.floating]}>{content}</BlurView> : <View style={[{ borderRadius: radii.floating, backgroundColor: theme.colors.glass }, shadows.floating]}>{content}</View>}
    </View>
  </View>;
}

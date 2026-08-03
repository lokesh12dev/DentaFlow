import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, CheckCircle2, Info, RefreshCw, TriangleAlert, X } from '../icons';
import { radii, shadows, shell, spacing, tabShellInset } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';
import { Button } from './Button';
import { useUIStore } from '@/store/uiStore';
import { AppIcon } from './AppIcon';

export function LoadingState({ label = 'Loading clinic data…' }: { label?: string }) {
  const theme = useTheme();
  return <View style={{ flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: spacing[3] }}><ActivityIndicator size="small" color={theme.colors.clinical} /><AppText tone="secondary">{label}</AppText></View>;
}

export function ErrorState({ title = 'Unable to load this view', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  const theme = useTheme();
  return <View style={{ minHeight: 240, alignItems: 'center', justifyContent: 'center', padding: spacing[6], gap: spacing[3] }}>
    <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: theme.colors.dangerSoft, alignItems: 'center', justifyContent: 'center' }}><AlertCircle size={24} color={theme.colors.danger} /></View>
    <AppText variant="title3" style={{ textAlign: 'center' }}>{title}</AppText>
    {message ? <AppText tone="secondary" style={{ textAlign: 'center' }}>{message}</AppText> : null}
    {onRetry ? <Button label="Try again" tone="secondary" icon={RefreshCw} onPress={onRetry} /> : null}
  </View>;
}

export function EmptyState({ title, message, actionLabel, onAction, icon: Icon = CheckCircle2 }: { title: string; message: string; actionLabel?: string; onAction?: () => void; icon?: typeof CheckCircle2 }) {
  const theme = useTheme();
  return <View style={{ minHeight: 220, alignItems: 'center', justifyContent: 'center', padding: spacing[6], gap: spacing[3] }}>
    <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: theme.colors.surfaceTertiary, alignItems: 'center', justifyContent: 'center' }}><Icon size={24} color={theme.colors.textSecondary} /></View>
    <AppText variant="title3" style={{ textAlign: 'center' }}>{title}</AppText>
    <AppText tone="secondary" style={{ textAlign: 'center', maxWidth: 330 }}>{message}</AppText>
    {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
  </View>;
}

export function Skeleton({ width = '100%', height = 18, radius = 8 }: { width?: number | `${number}%`; height?: number; radius?: number }) {
  const theme = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.45));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true })]));
    loop.start(); return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={{ width, height, borderRadius: radius, backgroundColor: theme.colors.surfaceTertiary, opacity }} />;
}

export function ToastHost() {
  const toast = useUIStore((state) => state.toast);
  const hide = useUIStore((state) => state.hideToast);
  const theme = useTheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  const color = toast.tone === 'danger' ? theme.colors.danger : toast.tone === 'warning' ? theme.colors.warning : toast.tone === 'success' ? theme.colors.success : theme.colors.primary;
  const normalizedPath = pathname.replace(/^\/\(tabs\)/, '').replace(/\/$/, '') || '/';
  const tabRoute = ['/today', '/patients', '/calendar', '/inbox', '/more'].includes(normalizedPath);
  const hasFab = ['/today', '/patients', '/calendar', '/inbox'].includes(normalizedPath) || normalizedPath.startsWith('/patient/');
  const base = tabRoute ? tabShellInset(insets.bottom) : insets.bottom + shell.contentBreathingRoom;
  const bottom = base + (hasFab ? shell.fabHeight + shell.fabGap : 0) + shell.fabGap;
  const Icon = toast.tone === 'danger' ? AlertCircle : toast.tone === 'warning' ? TriangleAlert : toast.tone === 'success' ? CheckCircle2 : Info;
  const tone = toast.tone === 'neutral' ? 'information' : toast.tone;
  return <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom, alignItems: 'center', paddingHorizontal: shell.horizontalInset, zIndex: 1000 }}>
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[{ width: '100%', maxWidth: shell.toastMaxWidth, minHeight: 60, borderRadius: radii.list, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderStrong, flexDirection: 'row', alignItems: 'center', paddingLeft: spacing[4], paddingRight: spacing[2], paddingVertical: spacing[2], gap: spacing[3] }, shadows.floating]}>
      <AppIcon icon={Icon} tone={tone} size={20} />
      <AppText variant="bodyStrong" style={{ flex: 1 }}>{toast.message}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={hide} hitSlop={4} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? theme.colors.surfaceSecondary : 'transparent' })}>
        <AppIcon icon={X} size={18} />
      </Pressable>
      <View style={{ position: 'absolute', left: 0, top: radii.list, bottom: radii.list, width: 3, borderRadius: 2, backgroundColor: color }} />
    </View>
  </View>;
}

export const SafeToastHost = ToastHost;

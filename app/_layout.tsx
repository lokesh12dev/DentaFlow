import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@/core/query';
import { ThemeProvider, useTheme } from '@/ui/ThemeProvider';
import { AppShell, CommandPalette, SafeToastHost } from '@/ui/components';
import { useBootstrap } from '@/hooks/useBootstrap';
import { LoadingState } from '@/ui/components/Feedback';

function NotificationObserver() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const redirect = (notification: Notifications.Notification) => {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) redirect(last.notification);
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => redirect(response.notification));
    return () => subscription.remove();
  }, []);
  return null;
}

function NavigationRoot() {
  const ready = useBootstrap();
  const theme = useTheme();
  if (!ready) return <LoadingState label="Opening your secure clinic workspace…" />;
  return <>
    <StatusBar style={theme.dark ? 'light' : 'dark'} />
    <NotificationObserver />
    <AppShell><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.canvas }, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack></AppShell>
    <CommandPalette />
    <SafeToastHost />
  </>;
}

export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1 }}><QueryClientProvider client={queryClient}><ThemeProvider><NavigationRoot /></ThemeProvider></QueryClientProvider></GestureHandlerRootView>;
}

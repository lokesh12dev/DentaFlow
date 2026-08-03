import React from 'react';
import { Redirect } from 'expo-router';
import { useSessionStore } from '@/store/sessionStore';

export default function Index() {
  const demoMode = useSessionStore((state) => state.demoMode);
  const session = useSessionStore((state) => state.session);
  const activeClinicId = useSessionStore((state) => state.activeClinicId);
  const configurationError = useSessionStore((state) => state.configurationError);
  if (configurationError) return <Redirect href="/setup/credentials" />;
  if (demoMode) return <Redirect href="/(tabs)/today" />;
  if (!session) return <Redirect href="/(auth)/sign-in" />;
  if (!activeClinicId) return <Redirect href="/(auth)/create-clinic" />;
  return <Redirect href="/(tabs)/today" />;
}

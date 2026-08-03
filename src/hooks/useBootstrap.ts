import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useSessionStore } from '@/store/sessionStore';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export function useBootstrap(): boolean {
  const bootstrapped = useSessionStore((state) => state.bootstrapped);
  const bootstrap = useSessionStore((state) => state.bootstrap);

  useEffect(() => {
    bootstrap().finally(() => SplashScreen.hideAsync().catch(() => undefined));
  }, [bootstrap]);

  return bootstrapped;
}

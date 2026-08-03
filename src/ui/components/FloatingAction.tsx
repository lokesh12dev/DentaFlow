import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { router, useGlobalSearchParams, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LucideIcon } from '../icons';
import { BadgeIndianRupee, CalendarDays, MessageCircle, Plus, Stethoscope, UserRoundPlus, UsersRound } from '../icons';
import { radii, shadows, shell, sizes, tabShellInset } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { haptics } from '@/core/haptics';
import { AppIcon } from './AppIcon';
import { useDashboard } from '@/hooks/useClinicQueries';
import { can } from '@/domain/access';

export function FloatingAction({ label, onPress, icon: Icon = Plus }: { label: string; onPress: () => void; icon?: LucideIcon }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { haptics.impact(); onPress(); }} style={({ pressed }) => [{ width: sizes.touchLarge, height: sizes.touchLarge, borderRadius: radii.pill, backgroundColor: pressed ? theme.colors.primaryPressed : theme.colors.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.82 : 1, ...(Platform.OS === 'web' ? { outlineColor: theme.colors.focus } : undefined) }, shadows.floating]}>
    <AppIcon icon={Icon} size={21} tone="inverse" strokeWidth={2.2} />
  </Pressable>;
}

export function ContextualFAB() {
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ id?: string | string[] }>();
  const insets = useSafeAreaInsets();
  const normalizedPath = `/${pathname.split('/').filter((segment) => segment && !segment.startsWith('(')).join('/')}`.replace(/\/$/, '') || '/';
  const needsWorkspace = ['/today', '/patients', '/calendar', '/inbox', '/more'].includes(normalizedPath) || normalizedPath.startsWith('/patient/');
  const dashboard = useDashboard(needsWorkspace);
  const patientId = normalizedPath.startsWith('/patient/') ? (Array.isArray(params.id) ? params.id[0] : params.id) ?? normalizedPath.split('/')[2] : undefined;
  const role = dashboard.data?.currentStaff.role;
  const firstPatientId = dashboard.data?.appointments[0]?.patientId;
  const action = patientId && role && can(role, 'clinical.draft')
    ? { label: 'Add clinical entry', icon: Stethoscope, route: `/clinical/note?patientId=${patientId}` }
    : normalizedPath === '/calendar' && role && can(role, 'appointment.manage')
      ? { label: 'New appointment', icon: Plus, route: '/appointment/new' }
      : normalizedPath === '/patients' && role && can(role, 'patient.create')
        ? { label: 'Add patient', icon: UserRoundPlus, route: '/patient/new' }
        : normalizedPath === '/inbox' && role && can(role, 'communication.compose')
          ? { label: 'Compose', icon: MessageCircle, route: '/communication/new' }
          : normalizedPath === '/today' && role === 'receptionist'
            ? { label: 'New appointment', icon: CalendarDays, route: '/appointment/new' }
            : normalizedPath === '/today' && role === 'billing'
              ? { label: 'Record payment', icon: BadgeIndianRupee, route: '/payment/new' }
              : normalizedPath === '/today' && role === 'assistant'
                ? { label: 'Open waiting room', icon: UsersRound, route: '/(modules)/waiting-room' }
                : normalizedPath === '/today' && role === 'dentist' && firstPatientId
                  ? { label: 'Add clinical note', icon: Stethoscope, route: `/clinical/note?patientId=${firstPatientId}` }
                  : normalizedPath === '/today' && (role === 'owner' || role === 'manager')
                    ? { label: 'New appointment', icon: CalendarDays, route: '/appointment/new' }
                    : undefined;
  if (!action) return null;

  const tabRoute = ['/today', '/patients', '/calendar', '/inbox', '/more'].includes(normalizedPath);
  const bottom = tabRoute ? tabShellInset(insets.bottom) + shell.fabGap : insets.bottom + shell.contentBreathingRoom;
  return <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom, zIndex: 90, alignItems: 'center', paddingHorizontal: shell.horizontalInset }}>
    <View pointerEvents="box-none" style={{ width: '100%', maxWidth: shell.canvasMaxWidth, alignItems: 'flex-end' }}>
      <FloatingAction label={action.label} icon={action.icon} onPress={() => router.push(action.route as never)} />
    </View>
  </View>;
}

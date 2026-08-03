import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import type { Permission } from '@/domain/access';
import { can } from '@/domain/access';
import { useDashboard } from '@/hooks/useClinicQueries';
import { ErrorState, LoadingState } from '@/ui/components';
import { useUIStore } from '@/store/uiStore';

export function RoleGuard({ permission, children, fallback = '/(tabs)/more' }: { permission?: Permission; children: React.ReactNode; fallback?: '/(tabs)/more' | '/(tabs)/today' }) {
  const dashboard = useDashboard();
  const showToast = useUIStore((state) => state.showToast);
  const denied = Boolean(permission && dashboard.data && !can(dashboard.data.currentStaff.role, permission));

  useEffect(() => {
    if (denied) showToast('You don’t have access to that area.', 'warning');
  }, [denied, showToast]);

  if (dashboard.isLoading) return <LoadingState label="Checking workspace access…" />;
  if (dashboard.isError || !dashboard.data) return <ErrorState message="Workspace access could not be verified." onRetry={() => dashboard.refetch()} />;
  if (denied) return <Redirect href={fallback} />;
  return <>{children}</>;
}

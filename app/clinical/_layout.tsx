import React from 'react';
import { Stack, usePathname } from 'expo-router';
import type { Permission } from '@/domain/access';
import { RoleGuard } from '@/navigation/RoleGuard';

export default function ClinicalLayout() {
  const path = usePathname();
  const permission: Permission = path.endsWith('/prescription') ? 'prescription.create' : path.endsWith('/consent') ? 'consent.manage' : 'clinical.draft';
  return <RoleGuard permission={permission}><Stack screenOptions={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} /></RoleGuard>;
}

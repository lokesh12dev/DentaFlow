import React from 'react';
import { Slot, usePathname } from 'expo-router';
import { requiredPermissionForPath } from '@/domain/access';
import { RoleGuard } from '@/navigation/RoleGuard';

export default function ModuleLayout() {
  const pathname = usePathname();
  const permission = requiredPermissionForPath(pathname);
  return <RoleGuard permission={permission}><Slot /></RoleGuard>;
}

import React from 'react';
import { Slot } from 'expo-router';
import { RoleGuard } from '@/navigation/RoleGuard';

export default function AutomationLayout() {
  return <RoleGuard permission="automation.manage"><Slot /></RoleGuard>;
}

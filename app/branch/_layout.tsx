import React from 'react';
import { Slot } from 'expo-router';
import { RoleGuard } from '@/navigation/RoleGuard';

export default function BranchLayout() {
  return <RoleGuard permission="branch.manage"><Slot /></RoleGuard>;
}

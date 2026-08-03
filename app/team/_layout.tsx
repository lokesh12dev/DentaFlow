import React from 'react';
import { Slot } from 'expo-router';
import { RoleGuard } from '@/navigation/RoleGuard';

export default function TeamLayout() {
  return <RoleGuard permission="team.manage"><Slot /></RoleGuard>;
}

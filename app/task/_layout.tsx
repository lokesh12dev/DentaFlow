import React from 'react';
import { Slot } from 'expo-router';
import { RoleGuard } from '@/navigation/RoleGuard';

export default function TaskLayout() {
  return <RoleGuard permission="task.manage"><Slot /></RoleGuard>;
}

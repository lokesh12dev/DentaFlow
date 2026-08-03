import React from 'react';
import { Slot } from 'expo-router';
import { RoleGuard } from '@/navigation/RoleGuard';

export default function LaboratoryLayout() {
  return <RoleGuard permission="laboratory.manage"><Slot /></RoleGuard>;
}

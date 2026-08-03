import React from 'react';
import { Slot } from 'expo-router';
import { RoleGuard } from '@/navigation/RoleGuard';

export default function TreatmentLayout() {
  return <RoleGuard permission="treatment.manage"><Slot /></RoleGuard>;
}

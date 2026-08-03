import React from 'react';
import { Slot } from 'expo-router';
import { RoleGuard } from '@/navigation/RoleGuard';

export default function TemplateLayout() {
  return <RoleGuard permission="template.manage"><Slot /></RoleGuard>;
}

import React from 'react';
import { Stack, usePathname } from 'expo-router';
import { RoleGuard } from '@/navigation/RoleGuard';

export default function AppointmentLayout() {
  return <RoleGuard permission={usePathname().endsWith('/new') ? 'appointment.manage' : 'appointment.read'}><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} /><Stack.Screen name="[id]" /></Stack></RoleGuard>;
}

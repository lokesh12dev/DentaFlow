import React from 'react';
import { Stack, usePathname } from 'expo-router';
import { RoleGuard } from '@/navigation/RoleGuard';

export default function PaymentLayout() {
  return <RoleGuard permission={usePathname().endsWith('/refund') ? 'refund.create' : 'billing.manage'}><Stack screenOptions={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} /></RoleGuard>;
}

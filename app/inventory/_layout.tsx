import React from 'react';
import { Slot } from 'expo-router';
import { RoleGuard } from '@/navigation/RoleGuard';

export default function InventoryLayout() {
  return <RoleGuard permission="inventory.manage"><Slot /></RoleGuard>;
}

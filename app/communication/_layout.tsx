import React from 'react';
import { Stack } from 'expo-router';
import { RoleGuard } from '@/navigation/RoleGuard';

export default function CommunicationLayout() {
  return <RoleGuard permission="communication.compose"><Stack screenOptions={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} /></RoleGuard>;
}

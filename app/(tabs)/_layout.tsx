import React from 'react';
import { Tabs } from 'expo-router';
import { GlassTabBar } from '@/ui/components';

export default function TabsLayout() {
  return <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false, lazy: true }}>
    <Tabs.Screen name="today" options={{ title: 'Today' }} />
    <Tabs.Screen name="patients" options={{ title: 'Patients' }} />
    <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
    <Tabs.Screen name="inbox" options={{ title: 'Inbox' }} />
    <Tabs.Screen name="more" options={{ title: 'More' }} />
  </Tabs>;
}

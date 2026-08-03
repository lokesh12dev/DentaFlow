import React from 'react';
import { View } from 'react-native';
import { ContextualFAB } from './FloatingAction';

export function AppShell({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1 }}>
    {children}
    <ContextualFAB />
  </View>;
}

import React from 'react';
import { ScrollView, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { shell, spacing, tabContentInset } from '../tokens';
import { useTheme } from '../ThemeProvider';

export function Screen({ children, scroll = true, contentContainerStyle, style, bottomInset = true, ...props }: ScrollViewProps & { children: React.ReactNode; scroll?: boolean; contentContainerStyle?: StyleProp<ViewStyle>; bottomInset?: boolean }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname().replace(/^\/\(tabs\)/, '').replace(/\/$/, '') || '/';
  const tabRoute = ['/today', '/patients', '/calendar', '/inbox', '/more'].includes(pathname);
  const hasStackFab = pathname.startsWith('/patient/');
  const automaticBottomInset = tabRoute ? tabContentInset(insets.bottom) : insets.bottom + shell.contentBreathingRoom + (hasStackFab ? shell.fabHeight + shell.fabGap : 0);
  const canvasStyle = { width: '100%' as const, maxWidth: shell.canvasMaxWidth, alignSelf: 'center' as const };
  const bodyStyle = [{ flexGrow: 1 }, contentContainerStyle, canvasStyle, { paddingBottom: bottomInset ? automaticBottomInset : spacing[6] }];
  return <SafeAreaView edges={['top', 'left', 'right']} style={[{ flex: 1, backgroundColor: theme.colors.canvas }, style]}>
    {scroll ? <ScrollView {...props} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={bodyStyle}>{children}</ScrollView> : <View style={[{ flex: 1 }, contentContainerStyle, canvasStyle, { paddingBottom: bottomInset ? automaticBottomInset : 0 }]}>{children}</View>}
  </SafeAreaView>;
}

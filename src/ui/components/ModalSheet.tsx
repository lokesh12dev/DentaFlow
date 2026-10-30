import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { X } from '../icons';
import { radii, shadows, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';
import { IconButton } from './Button';
import { useModalFocus } from '../modalFocus';

export function ModalSheet({ visible, title, subtitle, onClose, children, footer, scroll = true }: { visible: boolean; title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; scroll?: boolean }) {
  const theme = useTheme();
  // Web dialog semantics + focus trap; no-op on native where the system Modal governs.
  useModalFocus({ active: visible, onClose });
  const content = <View style={{ gap: spacing[4], paddingHorizontal: spacing[4], paddingBottom: spacing[6] }}>{children}</View>;
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close sheet" aria-hidden={Platform.OS === 'web' ? true : undefined} onPress={onClose} style={{ ...Platform.select({ ios: { backgroundColor: 'transparent' }, default: { backgroundColor: theme.colors.overlay } }), position: 'absolute', inset: 0 }}>
        {Platform.OS === 'ios' ? <BlurView intensity={18} tint={theme.dark ? 'dark' : 'light'} style={{ flex: 1, backgroundColor: theme.colors.overlay }} /> : null}
      </Pressable>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} role={Platform.OS === 'web' ? 'dialog' : undefined} aria-modal={Platform.OS === 'web' ? true : undefined} aria-label={Platform.OS === 'web' ? title : undefined} style={[{ maxHeight: '92%', borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl, backgroundColor: theme.colors.surface, overflow: 'hidden' }, shadows.sheet]}>
        <View style={{ alignItems: 'center', paddingTop: spacing[2] }}><View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: theme.colors.borderStrong }} /></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
          <View style={{ flex: 1, gap: 2 }}><AppText variant="title2">{title}</AppText>{subtitle ? <AppText tone="secondary">{subtitle}</AppText> : null}</View>
          <IconButton label="Close" icon={X} onPress={onClose} />
        </View>
        {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: spacing[4] }}>{content}</ScrollView> : <View style={{ paddingTop: spacing[4] }}>{content}</View>}
        {footer ? <View style={{ padding: spacing[4], borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </View>
  </Modal>;
}

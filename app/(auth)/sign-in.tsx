import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LockKeyhole, Mail, ShieldCheck, Stethoscope } from '@/ui/icons';
import { AppText, Button, Field, Surface } from '@/ui/components';
import { Screen } from '@/ui/components/Screen';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';
import { supabase } from '@/core/supabase';
import { useSessionStore } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';
import { readableError } from '@/core/errors';

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const showToast = useUIStore((state) => state.showToast);
  const bootstrap = useSessionStore((state) => state.bootstrap);

  const signIn = async () => {
    if (!supabase) return showToast('Add Supabase credentials before signing in.', 'warning');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      await bootstrap();
      router.replace('/');
    } catch (error) {
      showToast(readableError(error), 'danger');
    } finally { setLoading(false); }
  };

  return <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing[5] }} bottomInset={false}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ gap: spacing[6] }}>
      <View style={{ alignItems: 'center', gap: spacing[3] }}>
        <View style={{ width: 68, height: 68, borderRadius: 22, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}><Stethoscope size={32} color={theme.colors.textInverse} strokeWidth={2} /></View>
        <View style={{ alignItems: 'center', gap: spacing[2] }}><AppText variant="display">DentaFlow</AppText><AppText tone="secondary" style={{ textAlign: 'center', maxWidth: 340 }}>A calm, secure operating system for modern dental practices.</AppText></View>
      </View>
      <Surface style={{ gap: spacing[4] }}>
        <View style={{ gap: spacing[1] }}><AppText variant="title2">Sign in to your clinic</AppText><AppText tone="secondary">Use the account invited by your practice owner.</AppText></View>
        <Field label="Work email" value={email} onChangeText={setEmail} placeholder="name@clinic.com" icon={Mail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" icon={LockKeyhole} secureTextEntry />
        <Button label="Sign in securely" onPress={signIn} loading={loading} full />
      </Surface>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], paddingHorizontal: spacing[3] }}><ShieldCheck size={18} color={theme.colors.clinical} /><AppText variant="caption" tone="secondary" style={{ flex: 1 }}>Sessions are protected by Supabase Auth, tenant-level database policies, encrypted local storage, and device access controls.</AppText></View>
    </KeyboardAvoidingView>
  </Screen>;
}

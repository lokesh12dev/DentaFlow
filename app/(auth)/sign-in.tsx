import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, LockKeyhole, Mail, ShieldCheck } from '@/ui/icons';
import { AppIcon, AppText, Button, DentaFlowMark, Field } from '@/ui/components';
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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const showToast = useUIStore((state) => state.showToast);
  const bootstrap = useSessionStore((state) => state.bootstrap);
  const demoMode = useSessionStore((state) => state.demoMode);

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

  const resetPassword = async () => {
    if (!email.trim()) return showToast('Enter your work email first.', 'warning');
    if (!supabase) return showToast('Password recovery is available after Supabase is configured.', 'warning');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) return showToast(readableError(error), 'danger');
    showToast('Password reset link sent.', 'success');
  };

  return <Screen contentContainerStyle={{ flexGrow: 1 }} bottomInset={false}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={{ width: '100%', maxWidth: 440, flex: 1, alignSelf: 'center', paddingHorizontal: spacing[6], paddingTop: spacing[8], paddingBottom: spacing[6] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}><DentaFlowMark size={27} /></View>
          <AppText variant="title2" style={{ letterSpacing: -0.4 }}>DentaFlow</AppText>
        </View>

        <View style={{ marginTop: spacing[12], gap: spacing[3] }}>
          <AppText variant="tiny" tone="clinical" style={{ letterSpacing: 1.5 }}>CLINIC WORKSPACE</AppText>
          <AppText variant="display" style={{ maxWidth: 340 }}>Your clinic, in sync.</AppText>
          <AppText tone="secondary" style={{ maxWidth: 360 }}>Sign in to see today’s patients, priorities, and conversations in one place.</AppText>
        </View>

        <View style={{ marginTop: spacing[8], gap: spacing[4] }}>
          <Field label="Work email" value={email} onChangeText={setEmail} placeholder="name@clinic.com" icon={Mail} autoCapitalize="none" autoComplete="email" textContentType="emailAddress" keyboardType="email-address" returnKeyType="next" />
          <View style={{ gap: spacing[2] }}>
            <Field label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" icon={LockKeyhole} secureTextEntry={!passwordVisible} autoComplete="password" textContentType="password" returnKeyType="go" onSubmitEditing={() => void signIn()} trailing={<Pressable accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'} hitSlop={10} onPress={() => setPasswordVisible((visible) => !visible)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 }}><AppIcon icon={Eye} size={19} /></Pressable>} />
            <Pressable accessibilityRole="button" onPress={() => void resetPassword()} style={({ pressed }) => ({ minHeight: 44, alignSelf: 'flex-end', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}><AppText variant="secondary" tone="clinical">Forgot password?</AppText></Pressable>
          </View>
          <Button label="Sign in" onPress={signIn} loading={loading} full size="large" />
          {demoMode ? <Button label="Open demo workspace" onPress={() => router.replace('/(tabs)/today')} tone="secondary" full /> : null}
        </View>

        <View style={{ flex: 1, minHeight: spacing[8] }} />
        <View style={{ paddingTop: spacing[5], borderTopWidth: 1, borderTopColor: theme.colors.border, gap: spacing[2] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}><AppIcon icon={ShieldCheck} size={18} tone="clinical" /><AppText variant="caption" style={{ flex: 1 }}>Private workspace for invited clinic staff</AppText></View>
          <AppText variant="caption" tone="secondary">For dentists, assistants, front desk, billing, managers, and owners. Patients use the separate patient portal.</AppText>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Screen>;
}

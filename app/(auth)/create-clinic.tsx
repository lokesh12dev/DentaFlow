import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, Mail, Phone, Store } from '@/ui/icons';
import { AppText, Button, DentaFlowMark, Field, Screen } from '@/ui/components';
import { spacing } from '@/ui/tokens';
import { supabase } from '@/core/supabase';
import { useSessionStore } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';
import { readableError } from '@/core/errors';
import { useTheme } from '@/ui/ThemeProvider';

export default function CreateClinicScreen() {
  const router = useRouter();
  const theme = useTheme();
  const setClinic = useSessionStore((state) => state.setActiveClinic);
  const showToast = useUIStore((state) => state.showToast);
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [email, setEmail] = useState(''); const [city, setCity] = useState(''); const [loading, setLoading] = useState(false);
  const create = async () => {
    if (!supabase) return;
    if (!name.trim() || !phone.trim() || !city.trim()) return showToast('Complete the clinic name, phone, and city.', 'warning');
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_clinic', { p_name: name.trim(), p_phone: phone.trim(), p_email: email.trim() || null, p_city: city.trim(), p_timezone: 'Asia/Kolkata', p_currency: 'INR', p_locale: 'en-IN' });
      if (error) throw error;
      const clinicId = typeof data === 'string' ? data : data?.id;
      if (!clinicId) throw new Error('Clinic creation did not return an ID.');
      setClinic(clinicId); showToast('Clinic workspace created.', 'success'); router.replace('/(tabs)/today');
    } catch (error) { showToast(readableError(error), 'danger'); } finally { setLoading(false); }
  };
  return <Screen contentContainerStyle={{ flexGrow: 1 }} bottomInset={false}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={{ width: '100%', maxWidth: 440, flex: 1, alignSelf: 'center', paddingHorizontal: spacing[6], paddingTop: spacing[8], paddingBottom: spacing[6] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          <DentaFlowMark size={30} />
          <AppText variant="title2">DentaFlow</AppText>
        </View>

        <View style={{ marginTop: spacing[10], gap: spacing[3] }}>
          <AppText variant="tiny" tone="clinical" style={{ letterSpacing: 1.5 }}>NEW WORKSPACE</AppText>
          <AppText variant="display">Set up your clinic.</AppText>
          <AppText tone="secondary">Start with the details staff and patients use every day. Branches, roles, pricing, and integrations come later.</AppText>
        </View>

        <View style={{ marginTop: spacing[8], gap: spacing[4] }}>
          <Field label="Clinic name" value={name} onChangeText={setName} placeholder="Harbour Dental Studio" icon={Building2} autoCapitalize="words" />
          <Field label="Clinic phone" value={phone} onChangeText={setPhone} placeholder="+91 00000 00000" icon={Phone} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
          <Field label="Clinic email" value={email} onChangeText={setEmail} placeholder="care@clinic.com" icon={Mail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
          <Field label="City" value={city} onChangeText={setCity} placeholder="Chennai" icon={Store} autoCapitalize="words" returnKeyType="go" onSubmitEditing={() => void create()} />
          <Button label="Create clinic workspace" onPress={create} loading={loading} full size="large" />
        </View>

        <View style={{ flex: 1, minHeight: spacing[8] }} />
        <View style={{ paddingTop: spacing[5], borderTopWidth: 1, borderTopColor: theme.colors.border }}>
          <AppText variant="caption" tone="secondary">Your first account becomes the clinic owner. Access can be changed later from Team.</AppText>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Screen>;
}

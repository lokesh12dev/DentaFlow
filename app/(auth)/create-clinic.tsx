import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, Mail, Phone, Store } from '@/ui/icons';
import { AppText, Button, Field, PageHeader, Screen, Surface } from '@/ui/components';
import { spacing } from '@/ui/tokens';
import { supabase } from '@/core/supabase';
import { useSessionStore } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';
import { readableError } from '@/core/errors';

export default function CreateClinicScreen() {
  const router = useRouter();
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
  return <Screen><PageHeader title="Create your clinic" subtitle="You can add branches, roles, procedure pricing, and integrations later." /><View style={{ paddingHorizontal: spacing[4] }}><Surface style={{ gap: spacing[4] }}><Field label="Clinic name" value={name} onChangeText={setName} placeholder="Harbour Dental Studio" icon={Building2} /><Field label="Clinic phone" value={phone} onChangeText={setPhone} placeholder="+91…" icon={Phone} keyboardType="phone-pad" /><Field label="Clinic email" value={email} onChangeText={setEmail} placeholder="care@clinic.com" icon={Mail} keyboardType="email-address" autoCapitalize="none" /><Field label="City" value={city} onChangeText={setCity} placeholder="Chennai" icon={Store} /><Button label="Create secure workspace" onPress={create} loading={loading} full /></Surface></View></Screen>;
}

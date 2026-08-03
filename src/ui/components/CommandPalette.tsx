import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BadgeIndianRupee, CalendarDays, FileText, FlaskConical, Package, Search, Settings, UserRoundPlus, UsersRound, X } from '../icons';
import { radii, shadows, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { SearchField } from './Field';
import { AppText } from './Typography';
import { ListRow } from './ListRow';
import { IconButton } from './Button';
import { usePatients } from '@/hooks/useClinicQueries';
import { useUIStore } from '@/store/uiStore';

const actions = [
  { label: 'New patient intake', subtitle: 'Create a complete patient record', icon: UserRoundPlus, href: '/patient/new' },
  { label: 'Book appointment', subtitle: 'Find a patient and available chair', icon: CalendarDays, href: '/appointment/new' },
  { label: 'Open billing', subtitle: 'Invoices, collections, and receipts', icon: BadgeIndianRupee, href: '/(modules)/billing' },
  { label: 'Treatment pipeline', subtitle: 'Follow proposed and incomplete care', icon: FileText, href: '/(modules)/treatment-pipeline' },
  { label: 'Laboratory cases', subtitle: 'Track external lab work', icon: FlaskConical, href: '/(modules)/laboratory' },
  { label: 'Inventory', subtitle: 'Stock, batches, and expiry', icon: Package, href: '/(modules)/inventory' },
  { label: 'Settings', subtitle: 'Clinic, team, integrations, and security', icon: Settings, href: '/(modules)/settings' }
] as const;

export function CommandPalette() {
  const open = useUIStore((state) => state.commandOpen);
  const setOpen = useUIStore((state) => state.setCommandOpen);
  const [query, setQuery] = useState('');
  const patients = usePatients({ query });
  const theme = useTheme();
  const router = useRouter();
  const filteredActions = useMemo(() => actions.filter((item) => `${item.label} ${item.subtitle}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const go = (href: string) => { setOpen(false); setQuery(''); router.push(href as never); };
  return <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
    <View style={{ flex: 1, backgroundColor: theme.colors.overlay, paddingHorizontal: spacing[4], paddingTop: 92 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close command search" onPress={() => setOpen(false)} style={{ position: 'absolute', inset: 0 }} />
      <View style={[{ maxHeight: '78%', backgroundColor: theme.colors.surface, borderRadius: radii.xxl, borderWidth: 1, borderColor: theme.colors.borderStrong, overflow: 'hidden' }, shadows.sheet]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderBottomWidth: 1, borderBottomColor: theme.colors.border }}><Search size={20} color={theme.colors.textMuted} /><View style={{ flex: 1 }}><AppText variant="title3">Command search</AppText><AppText variant="caption" tone="secondary">Find patients or jump to a workflow</AppText></View><IconButton label="Close" icon={X} onPress={() => setOpen(false)} /></View>
        <View style={{ padding: spacing[4], paddingBottom: spacing[2] }}><SearchField value={query} onChangeText={setQuery} placeholder="Search patients and actions" /></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: spacing[4], paddingBottom: spacing[6] }}>
          {filteredActions.length ? <><AppText variant="tiny" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing[3], marginBottom: spacing[2] }}>Actions</AppText>{filteredActions.map((item) => <ListRow key={item.href} title={item.label} subtitle={item.subtitle} icon={item.icon} onPress={() => go(item.href)} />)}</> : null}
          {query.length >= 2 ? <><AppText variant="tiny" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing[4], marginBottom: spacing[2] }}>Patients</AppText>{patients.data?.slice(0, 8).map((patient) => <ListRow key={patient.id} title={patient.displayName} subtitle={`${patient.patientNumber} · ${patient.phone}`} icon={UsersRound} iconTone={patient.medicalAlerts.length ? 'danger' : 'clinical'} onPress={() => go(`/patient/${patient.id}`)} />)}{patients.data?.length === 0 ? <AppText tone="secondary">No patient matches “{query}”.</AppText> : null}</> : null}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

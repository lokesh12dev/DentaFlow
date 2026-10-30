import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Patient, RecallStatus } from '@/domain/types';
import { usePatients } from '@/hooks/useClinicQueries';
import { dateLabel, relativeTime } from '@/core/format';
import { AppIcon, AppText, Badge, Button, Chip, EmptyState, ErrorState, LoadingState, PageHeader, Screen, SectionHeader, Surface } from '@/ui/components';
import { CalendarDays, CheckCircle2, MessageCircle, Phone } from '@/ui/icons';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';

type RecallFilter = RecallStatus | 'all';
const filters: { value: RecallFilter; label: string }[] = [
  { value: 'overdue', label: 'Overdue' }, { value: 'due', label: 'Due' },
  { value: 'due-soon', label: 'Due soon' }, { value: 'contacted', label: 'Contacted' },
  { value: 'scheduled', label: 'Scheduled' }, { value: 'inactive', label: 'Inactive' },
  { value: 'all', label: 'All' },
];

export function RecallScreen() {
  const patients = usePatients();
  const [status, setStatus] = useState<RecallFilter>('overdue');
  const rows = useMemo(() => (patients.data ?? []).filter((patient) => patient.recallStatus && (status === 'all' || patient.recallStatus === status)), [patients.data, status]);
  return <Screen>
    <PageHeader title="Recall" subtitle="Preventive care follow-up" onBack={() => router.back()} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[4] }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }}>
        {filters.map((item) => <Chip key={item.value} label={item.label} selected={status === item.value} onPress={() => setStatus(item.value)} />)}
      </ScrollView>
      <View style={{ gap: spacing[2] }}>
        <SectionHeader title="Recall queue" subtitle={`${rows.length} patients`} />
        <Surface padded={false} style={{ paddingHorizontal: spacing[4] }}>
          {patients.isLoading ? <LoadingState /> : patients.isError ? <ErrorState onRetry={() => patients.refetch()} /> : !rows.length ? <EmptyState title="Queue complete" message="No patients match this recall state. Check due-soon recalls for upcoming work." icon={CheckCircle2} /> : rows.map((patient, index) => <View key={patient.id}>
            <RecallRow patient={patient} />
            {index < rows.length - 1 ? <Divider /> : null}
          </View>)}
        </Surface>
      </View>
      {rows.length > 0 && rows.length < 3 ? <Surface tone="clinical" style={{ padding: spacing[3], flexDirection: 'row', gap: spacing[3], alignItems: 'center' }}>
        <AppIcon icon={CalendarDays} size={18} tone="clinical" />
        <AppText variant="caption" tone="secondary" style={{ flex: 1 }}>This queue is nearly clear. Review due-soon patients to prepare the next outreach block.</AppText>
      </Surface> : null}
    </View>
  </Screen>;
}

function RecallRow({ patient }: { patient: Patient }) {
  const theme = useTheme();
  const dueCopy = recallDueCopy(patient.recallDueAt);
  const channel = patient.preferredContact === 'whatsapp' && patient.whatsappConsent ? 'WhatsApp consented' : patient.preferredContact === 'call' ? 'Call preferred' : `${patient.preferredContact} preferred`;
  return <View style={{ paddingVertical: spacing[3], gap: spacing[3] }}>
    <View style={{ flexDirection: 'row', gap: spacing[3] }}>
      <View style={{ width: 3, borderRadius: 2, backgroundColor: patient.recallStatus === 'overdue' ? theme.colors.danger : theme.colors.clinical }} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{patient.displayName}</AppText>
          <Badge label={patient.recallStatus?.replaceAll('-', ' ') ?? 'Recall'} tone={patient.recallStatus === 'overdue' ? 'danger' : patient.recallStatus === 'scheduled' ? 'success' : 'clinical'} />
        </View>
        <AppText variant="caption" style={{ color: patient.recallStatus === 'overdue' ? theme.colors.danger : theme.colors.textSecondary }}>{dueCopy}</AppText>
        <AppText variant="caption" tone="muted">{patient.lastVisitAt ? `Last visit ${relativeTime(patient.lastVisitAt)}` : 'No previous visit'} · {channel}</AppText>
      </View>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing[2], flexWrap: 'wrap' }}>
      <Button label="Call" icon={Phone} size="small" tone="secondary" onPress={() => router.push({ pathname: '/communication/new', params: { patientId: patient.id, channel: 'call' } })} />
      <Button label="Message" icon={MessageCircle} size="small" tone="secondary" onPress={() => router.push({ pathname: '/communication/new', params: { patientId: patient.id, channel: patient.whatsappConsent ? 'whatsapp' : 'sms' } })} />
      <Button label="Book" icon={CalendarDays} size="small" onPress={() => router.push(`/appointment/new?patientId=${patient.id}`)} />
    </View>
  </View>;
}

function recallDueCopy(value?: string) {
  if (!value) return 'Due date not set';
  const days = differenceInCalendarDays(new Date(), parseISO(value));
  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} overdue`;
  if (days === 0) return 'Due today';
  return `Due ${dateLabel(value)}`;
}

function Divider() { const theme = useTheme(); return <View style={{ height: 1, backgroundColor: theme.colors.border }} />; }

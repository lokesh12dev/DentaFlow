import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { differenceInMinutes, parseISO } from 'date-fns';
import type { Appointment } from '@/domain/types';
import { useAppointments, useTransitionAppointment } from '@/hooks/useClinicQueries';
import { useUIStore } from '@/store/uiStore';
import { APPOINTMENT_STATUS_LABELS } from '@/domain/constants';
import { AppText, Badge, Button, EmptyState, ErrorState, LoadingState, PageHeader, Screen, SectionHeader, Surface } from '@/ui/components';
import { Clock3, ListChecks, Stethoscope, TriangleAlert } from '@/ui/icons';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';

export function WaitingRoomScreen() {
  const theme = useTheme();
  const query = useAppointments({ date: new Date().toISOString().slice(0, 10) });
  const transition = useTransitionAppointment();
  const toast = useUIStore((state) => state.showToast);
  const queue = useMemo(() => (query.data ?? [])
    .filter((appointment) => ['checked-in', 'waiting', 'in-chair'].includes(appointment.status))
    .sort((left, right) => (left.checkedInAt ?? left.startsAt).localeCompare(right.checkedInAt ?? right.startsAt)), [query.data]);
  const waiting = queue.filter((appointment) => appointment.status === 'checked-in' || appointment.status === 'waiting');
  const inChair = queue.filter((appointment) => appointment.status === 'in-chair');
  const delayed = waiting.filter((appointment) => elapsedMinutes(appointment) > 15);
  const move = async (id: string, status: 'waiting' | 'in-chair' | 'completed') => {
    try {
      await transition.mutateAsync({ id, status });
      toast(`Patient moved to ${APPOINTMENT_STATUS_LABELS[status]}`, 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to move patient', 'danger');
    }
  };

  return <Screen>
    <PageHeader title="Waiting room" subtitle="Live patient flow" onBack={() => router.back()} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[4] }}>
      <SummaryStrip waiting={waiting.length} inChair={inChair.length} delayed={delayed.length} />
      {delayed.length ? <Surface tone="warning" style={{ padding: spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}>
          <TriangleAlert size={18} color={theme.colors.warning} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">Check the longest waits</AppText>
            <AppText variant="caption" tone="secondary">{delayed.map((appointment) => appointment.patientName).join(', ')} waited more than 15 minutes.</AppText>
          </View>
        </View>
      </Surface> : null}
      {query.isLoading ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : queue.length === 0 ? <EmptyState title="No patients in clinic" message="Checked-in patients will appear here with chair actions." icon={ListChecks} /> : <>
        <View style={{ gap: spacing[2] }}>
          <SectionHeader title="Reception queue" subtitle="Longest wait first" />
          <Surface padded={false} style={{ paddingHorizontal: spacing[4] }}>
            {waiting.length ? waiting.map((appointment, index) => <View key={appointment.id}>
              <QueueRow appointment={appointment} onOpen={() => router.push(`/appointment/${appointment.id}`)} onAction={() => move(appointment.id, appointment.status === 'checked-in' ? 'waiting' : 'in-chair')} actionLabel={appointment.status === 'checked-in' ? 'Mark waiting' : 'Move to chair'} />
              {index < waiting.length - 1 ? <Divider /> : null}
            </View>) : <AppText tone="secondary" style={{ paddingVertical: spacing[4] }}>No one is waiting.</AppText>}
          </Surface>
        </View>
        <View style={{ gap: spacing[2] }}>
          <SectionHeader title="Active chairs" subtitle={`${inChair.length} visits in treatment`} />
          <Surface padded={false} style={{ paddingHorizontal: spacing[4] }}>
            {inChair.length ? inChair.map((appointment, index) => <View key={appointment.id}>
              <QueueRow appointment={appointment} onOpen={() => router.push(`/appointment/${appointment.id}`)} onAction={() => move(appointment.id, 'completed')} actionLabel="Complete visit" />
              {index < inChair.length - 1 ? <Divider /> : null}
            </View>) : <AppText tone="secondary" style={{ paddingVertical: spacing[4] }}>All chairs are available.</AppText>}
          </Surface>
        </View>
      </>}
    </View>
  </Screen>;
}

function SummaryStrip({ waiting, inChair, delayed }: { waiting: number; inChair: number; delayed: number }) {
  const items = [{ label: 'Waiting', value: waiting }, { label: 'In chair', value: inChair }, { label: 'Over 15 min', value: delayed }];
  return <Surface style={{ paddingVertical: spacing[3], flexDirection: 'row' }}>
    {items.map((item, index) => <View key={item.label} style={{ flex: 1, alignItems: 'center', borderLeftWidth: index ? 1 : 0, borderLeftColor: 'rgba(128, 138, 148, 0.22)' }}>
      <AppText variant="title2" style={{ fontVariant: ['tabular-nums'] }}>{item.value}</AppText>
      <AppText variant="caption" tone="secondary">{item.label}</AppText>
    </View>)}
  </Surface>;
}

function QueueRow({ appointment, onOpen, onAction, actionLabel }: { appointment: Appointment; onOpen: () => void; onAction: () => void; actionLabel: string }) {
  const theme = useTheme();
  const blockers = readinessBlockers(appointment);
  const elapsed = elapsedMinutes(appointment);
  return <View style={{ paddingVertical: spacing[3], gap: spacing[3] }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${appointment.patientName}'s visit`} onPress={onOpen} style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}>
      <View style={{ flexDirection: 'row', gap: spacing[3] }}>
        <View style={{ width: 3, borderRadius: 2, backgroundColor: elapsed > 15 ? theme.colors.warning : theme.colors.clinical }} />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{appointment.patientName}</AppText>
            <AppText variant="label" style={{ fontVariant: ['tabular-nums'], color: elapsed > 15 ? theme.colors.warning : theme.colors.text }}>{elapsed} min</AppText>
          </View>
          <AppText variant="caption" tone="secondary">{appointment.procedureName}</AppText>
          <AppText variant="caption" tone="muted">{appointment.doctorName} · {appointment.chairName}</AppText>
          {blockers.length ? <AppText variant="caption" style={{ color: theme.colors.warning }}>Needs {blockers.join(' · ')}</AppText> : <Badge label="Ready" tone="success" dot />}
        </View>
      </View>
    </Pressable>
    <Button label={actionLabel} icon={appointment.status === 'in-chair' ? Stethoscope : Clock3} size="small" tone={appointment.status === 'in-chair' ? 'secondary' : 'clinical'} onPress={onAction} style={{ alignSelf: 'flex-end' }} />
  </View>;
}

function elapsedMinutes(appointment: Appointment) {
  return Math.max(0, differenceInMinutes(new Date(), parseISO(appointment.checkedInAt ?? appointment.startsAt)));
}

function readinessBlockers(appointment: Appointment) {
  const readiness = appointment.readiness;
  return [
    !readiness.intakeComplete ? 'intake' : null,
    !readiness.medicalHistoryVerified ? 'medical review' : null,
    !readiness.consentReady ? 'consent' : null,
    !readiness.labCaseReady ? 'lab case' : null,
    !readiness.paymentReady ? 'payment' : null,
  ].filter((item): item is string => Boolean(item));
}

function Divider() { return <View style={{ height: 1, backgroundColor: 'rgba(128, 138, 148, 0.18)' }} />; }

import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { APPOINTMENT_STATUS_LABELS } from '@/domain/constants';
import { canTransitionAppointment, readinessScore } from '@/domain/rules';
import type { AppointmentStatus } from '@/domain/types';
import { useAppointment, useTransitionAppointment } from '@/hooks/useClinicQueries';
import { useUIStore } from '@/store/uiStore';
import { calendarDate, money, time } from '@/core/format';
import { CalendarDays, CheckCircle2, ClipboardCheck, CreditCard, FileText, HeartPulse, MessageCircle, MoreHorizontal, Phone, Stethoscope, UserRound } from '@/ui/icons';
import { AppText, Badge, Button, ErrorState, IconButton, LoadingState, PageHeader, ProgressBar, Screen, SectionHeader, Surface } from '@/ui/components';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';

const nextActions: Partial<Record<AppointmentStatus, Array<{ status: AppointmentStatus; label: string }>>> = {
  requested: [{ status: 'awaiting-confirmation', label: 'Send confirmation' }, { status: 'confirmed', label: 'Confirm manually' }],
  'awaiting-confirmation': [{ status: 'confirmed', label: 'Mark confirmed' }, { status: 'cancelled', label: 'Cancel' }],
  confirmed: [{ status: 'checked-in', label: 'Check in patient' }, { status: 'cancelled', label: 'Cancel visit' }, { status: 'no-show', label: 'Mark no-show' }],
  'checked-in': [{ status: 'waiting', label: 'Move to waiting' }, { status: 'in-chair', label: 'Start treatment' }],
  waiting: [{ status: 'in-chair', label: 'Move to chair' }, { status: 'cancelled', label: 'Cancel visit' }],
  'in-chair': [{ status: 'paused', label: 'Pause treatment' }, { status: 'completed', label: 'Complete visit' }, { status: 'needs-follow-up', label: 'Needs follow-up' }],
  paused: [{ status: 'in-chair', label: 'Resume treatment' }, { status: 'needs-follow-up', label: 'End with follow-up' }],
  completed: [{ status: 'needs-follow-up', label: 'Add follow-up' }]
};

export function AppointmentDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useAppointment(id ?? '');
  const transition = useTransitionAppointment();
  const toast = useUIStore((s) => s.showToast);
  const [expanded, setExpanded] = useState(false);
  const appointment = query.data;
  const score = appointment ? readinessScore(appointment.readiness) : 0;
  const actions = appointment ? (nextActions[appointment.status] ?? []).filter((a) => canTransitionAppointment(appointment.status, a.status)) : [];
  const primary = actions[0];
  const readiness = useMemo(() => appointment ? [
    ['Digital intake', appointment.readiness.intakeComplete], ['Medical history verified', appointment.readiness.medicalHistoryVerified], ['Consent ready', appointment.readiness.consentReady], ['Lab case ready', appointment.readiness.labCaseReady], ['Payment readiness', appointment.readiness.paymentReady]
  ] as Array<[string, boolean]> : [], [appointment]);

  if (query.isLoading) return <Screen><LoadingState label="Opening appointment…" /></Screen>;
  if (query.isError || !appointment) return <Screen><ErrorState message="This appointment could not be found." onRetry={() => query.refetch()} /></Screen>;
  const runTransition = async (status: AppointmentStatus) => { try { await transition.mutateAsync({ id: appointment.id, status }); toast(`Visit moved to ${APPOINTMENT_STATUS_LABELS[status]}`, 'success'); } catch (e) { toast(e instanceof Error ? e.message : 'Unable to update appointment', 'danger'); } };

  return <Screen>
    <PageHeader title={appointment.patientName} subtitle={`${calendarDate(appointment.startsAt)} · ${time(appointment.startsAt)} · ${appointment.chairName}`} onBack={() => router.back()} right={<IconButton label="More appointment actions" icon={MoreHorizontal} onPress={() => setExpanded(!expanded)} />} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[4] }}>
      <Surface style={{ gap: spacing[4] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}><View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><CalendarDays size={24} color={theme.colors.primary} /></View><View style={{ flex: 1, gap: 3 }}><AppText variant="title2">{appointment.procedureName}</AppText><AppText tone="secondary">{appointment.doctorName} · {appointment.durationMinutes} minutes</AppText></View><Badge label={APPOINTMENT_STATUS_LABELS[appointment.status]} tone={appointment.status === 'in-chair' ? 'clinical' : appointment.status === 'completed' ? 'success' : appointment.status === 'cancelled' || appointment.status === 'no-show' ? 'danger' : 'warning'} /></View>
        <ProgressBar value={score} tone={score < 60 ? 'danger' : score < 100 ? 'warning' : 'success'} label="Visit readiness" />
        {primary ? <Button label={primary.label} icon={CheckCircle2} tone="clinical" loading={transition.isPending} onPress={() => runTransition(primary.status)} full /> : null}
        {expanded ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>{actions.slice(1).map((action) => <Button key={action.status} label={action.label} size="small" tone={action.status === 'cancelled' || action.status === 'no-show' ? 'danger' : 'secondary'} onPress={() => runTransition(action.status)} />)}</View> : null}
      </Surface>

      {score < 100 ? <Surface tone={score < 60 ? 'danger' : 'warning'} style={{ gap: spacing[3] }}><SectionHeader title="Readiness checklist" subtitle="Resolve blockers before treatment begins" icon={ClipboardCheck} />{readiness.map(([label, ready]) => <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}><CheckCircle2 size={18} color={ready ? theme.colors.success : theme.colors.warning} /><AppText style={{ flex: 1 }}>{label}</AppText><Badge label={ready ? 'Ready' : 'Required'} tone={ready ? 'success' : 'warning'} /></View>)}</Surface> : null}

      <Surface style={{ gap: spacing[3] }}><SectionHeader title="Patient actions" subtitle="Everything needed during this visit" icon={UserRound} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}><Button label="Patient record" icon={UserRound} tone="secondary" onPress={() => router.push(`/patient/${appointment.patientId}`)} /><Button label="Call" icon={Phone} tone="secondary" onPress={() => router.push({ pathname: '/communication/new', params: { patientId: appointment.patientId, channel: 'call', appointmentId: appointment.id } })} /><Button label="WhatsApp" icon={MessageCircle} tone="secondary" onPress={() => router.push({ pathname: '/communication/new', params: { patientId: appointment.patientId, channel: 'whatsapp', appointmentId: appointment.id } })} /></View></Surface>

      <Surface style={{ gap: spacing[3] }}><SectionHeader title="Clinical workspace" subtitle="Document safely without leaving visit context" icon={Stethoscope} /><View style={{ gap: spacing[2] }}><ActionRow icon={FileText} title="Clinical note" detail="Structured examination and procedure record" onPress={() => router.push({ pathname: '/clinical/note', params: { patientId: appointment.patientId, appointmentId: appointment.id } })} /><ActionRow icon={HeartPulse} title="Tooth chart and media" detail="Record findings, photographs, X-rays and voice notes" onPress={() => router.push({ pathname: '/clinical/note', params: { patientId: appointment.patientId, appointmentId: appointment.id, mode: 'capture' } })} /><ActionRow icon={CreditCard} title="Invoice and collect" detail={`${money(appointment.estimatedFee ?? 0)} estimated treatment fee`} onPress={() => router.push({ pathname: '/payment/new', params: { patientId: appointment.patientId } })} /></View></Surface>

      <Surface style={{ gap: spacing[3] }}><SectionHeader title="Visit details" icon={FileText} /><Detail label="Source" value={appointment.source.replace('-', ' ')} /><Detail label="Confirmation" value={appointment.confirmationStatus.replace('-', ' ')} /><Detail label="Reminder" value={appointment.reminderStatus.replace('-', ' ')} /><Detail label="Deposit" value={`${money(appointment.depositPaid ?? 0)} of ${money(appointment.depositRequired ?? 0)}`} />{appointment.internalNote ? <Detail label="Preparation" value={appointment.internalNote} /> : null}</Surface>
    </View>
  </Screen>;
}
function Detail({ label, value }: { label: string; value: string }) { return <View style={{ flexDirection: 'row', gap: spacing[3] }}><AppText tone="secondary" style={{ width: 110 }}>{label}</AppText><AppText variant="bodyStrong" style={{ flex: 1, textTransform: 'capitalize' }}>{value}</AppText></View>; }
function ActionRow({ icon: Icon, title, detail, onPress }: { icon: typeof FileText; title: string; detail: string; onPress: () => void }) { const theme = useTheme(); return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={{ minHeight: 64, borderRadius: 14, backgroundColor: theme.colors.surfaceSecondary, padding: spacing[3], flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}><View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Icon size={19} color={theme.colors.primary} /></View><View style={{ flex: 1 }}><AppText variant="bodyStrong">{title}</AppText><AppText variant="caption" tone="secondary">{detail}</AppText></View></Pressable>; }

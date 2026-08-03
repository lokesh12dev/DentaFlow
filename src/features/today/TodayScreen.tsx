import React, { useMemo } from 'react';
import { RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  BadgeIndianRupee, CalendarDays, CheckCircle2, Clock3, FlaskConical, Phone, UsersRound
} from '@/ui/icons';
import {
  AppIcon, AppText, AppointmentRow, ErrorState, ListRow, LoadingState,
  MetricStrip, PageHeader, Screen, SectionHeader, TaskRow
} from '@/ui/components';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';
import { useDashboard, useSetTaskStatus, useTransitionAppointment } from '@/hooks/useClinicQueries';
import { useUIStore } from '@/store/uiStore';
import { getNextAppointmentActions } from '@/domain/rules';
import { APPOINTMENT_STATUS_LABELS } from '@/domain/constants';
import { money } from '@/core/format';
import type { Appointment } from '@/domain/types';
import { STAFF_HOME } from '@/domain/access';

function nextOperationalStatus(appointment: Appointment) {
  const preferred = ['checked-in', 'waiting', 'in-chair', 'completed', 'needs-follow-up'] as const;
  return preferred.find((status) => getNextAppointmentActions(appointment.status).includes(status));
}

export function TodayScreen() {
  const theme = useTheme();
  const router = useRouter();
  const dashboard = useDashboard();
  const transition = useTransitionAppointment();
  const setTask = useSetTaskStatus();
  const setCommandOpen = useUIStore((state) => state.setCommandOpen);
  const showToast = useUIStore((state) => state.showToast);

  const actionItems = useMemo(() => {
    const data = dashboard.data;
    if (!data) return [];
    const focus = STAFF_HOME[data.currentStaff.role].focus;
    return [
      data.metrics.unconfirmed && (focus === 'reception' || focus === 'oversight') ? { id: 'unconfirmed', title: `${data.metrics.unconfirmed} appointment${data.metrics.unconfirmed === 1 ? '' : 's'} need confirmation`, subtitle: 'Confirm before the slot is at risk', icon: CalendarDays, tone: 'warning' as const, route: '/(tabs)/calendar' } : null,
      data.metrics.missedCalls && (focus === 'reception' || focus === 'oversight') ? { id: 'calls', title: `${data.metrics.missedCalls} missed call${data.metrics.missedCalls === 1 ? '' : 's'} need callbacks`, subtitle: 'Return the oldest unanswered call', icon: Phone, tone: 'danger' as const, route: '/(tabs)/inbox' } : null,
      data.overdueInvoices.length && (focus === 'billing' || focus === 'reception' || focus === 'oversight') ? { id: 'billing', title: `${data.overdueInvoices.length} overdue account${data.overdueInvoices.length === 1 ? '' : 's'}`, subtitle: `${money(data.overdueInvoices.reduce((sum, item) => sum + item.balance, 0))} ready for follow-up`, icon: BadgeIndianRupee, tone: 'warning' as const, route: '/(modules)/billing' } : null,
      data.labDue.length && (focus === 'clinical' || focus === 'assistant' || focus === 'oversight') ? { id: 'lab', title: `${data.labDue.length} lab case${data.labDue.length === 1 ? '' : 's'} need a handoff`, subtitle: 'Verify delivery before the visit', icon: FlaskConical, tone: 'danger' as const, route: '/(modules)/laboratory' } : null
    ].filter(Boolean) as { id: string; title: string; subtitle: string; icon: typeof CalendarDays; tone: 'warning' | 'danger'; route: string }[];
  }, [dashboard.data]);

  if (dashboard.isLoading) return <Screen><PageHeader title="Today" /><LoadingState label="Preparing today’s clinic flow…" /></Screen>;
  if (dashboard.isError || !dashboard.data) return <Screen><PageHeader title="Today" /><ErrorState message={dashboard.error instanceof Error ? dashboard.error.message : undefined} onRetry={() => dashboard.refetch()} /></Screen>;
  const data = dashboard.data;
  const profile = STAFF_HOME[data.currentStaff.role];
  const roleAppointments = data.currentStaff.role === 'dentist'
    ? data.appointments.filter((appointment) => appointment.doctorId === data.currentStaff.id)
    : data.appointments;
  const roleTasks = data.currentStaff.role === 'owner' || data.currentStaff.role === 'manager'
    ? data.tasks
    : data.tasks.filter((task) => task.assignedTo === data.currentStaff.id);
  const overdueAmount = money(data.overdueInvoices.reduce((sum, item) => sum + item.balance, 0));
  const headerContext = profile.context({ appointments: roleAppointments.length, overdue: overdueAmount, branch: data.clinic.branchCode });
  const metricItems = profile.focus === 'billing'
    ? [
      { label: 'Collected', value: money(data.metrics.collectionsToday), icon: BadgeIndianRupee, tone: 'success' as const },
      { label: 'Outstanding', value: money(data.metrics.outstanding), icon: BadgeIndianRupee, tone: 'warning' as const },
      { label: 'Overdue', value: data.overdueInvoices.length, icon: Clock3, tone: 'warning' as const },
      { label: 'Tasks', value: roleTasks.length, icon: CheckCircle2 },
    ]
    : profile.focus === 'clinical'
      ? [
        { label: 'Patients', value: roleAppointments.length, icon: CalendarDays },
        { label: 'In chair', value: data.metrics.inChair, icon: UsersRound, tone: 'clinical' as const },
        { label: 'Follow-ups', value: data.followUps.length, icon: CheckCircle2, tone: 'warning' as const },
        { label: 'Lab due', value: data.labDue.length, icon: FlaskConical, tone: data.labDue.length ? 'warning' as const : 'success' as const },
      ]
      : profile.focus === 'assistant'
        ? [
          { label: 'Visits', value: roleAppointments.length, icon: CalendarDays },
          { label: 'Waiting', value: data.metrics.waiting, icon: Clock3, tone: data.metrics.waiting ? 'warning' as const : 'success' as const },
          { label: 'Lab due', value: data.labDue.length, icon: FlaskConical, tone: data.labDue.length ? 'warning' as const : 'success' as const },
          { label: 'Tasks', value: roleTasks.length, icon: CheckCircle2 },
        ]
        : [
          { label: 'Visits', value: data.metrics.appointmentsToday, icon: CalendarDays },
          { label: 'Waiting', value: data.metrics.waiting, icon: Clock3, tone: data.metrics.waiting ? 'warning' as const : 'success' as const },
          { label: 'In chair', value: data.metrics.inChair, icon: UsersRound, tone: 'clinical' as const },
          { label: profile.focus === 'reception' ? 'Callbacks' : 'Collected', value: profile.focus === 'reception' ? data.metrics.missedCalls : money(data.metrics.collectionsToday), icon: profile.focus === 'reception' ? Phone : BadgeIndianRupee, tone: profile.focus === 'reception' && data.metrics.missedCalls ? 'warning' as const : 'success' as const },
        ];

  const advance = async (appointment: Appointment) => {
    const status = nextOperationalStatus(appointment);
    if (!status) return router.push(`/appointment/${appointment.id}` as never);
    try {
      await transition.mutateAsync({ id: appointment.id, status });
      showToast(`Appointment moved to ${APPOINTMENT_STATUS_LABELS[status]}.`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update appointment.', 'danger');
    }
  };

  const todayLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date());

  return <Screen refreshControl={<RefreshControl refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()} tintColor={theme.colors.clinical} />}>
    <PageHeader
      eyebrow={`${todayLabel} · ${data.clinic.branchCode}`}
      title={profile.title}
      subtitle={headerContext}
      onSearch={() => setCommandOpen(true)}
    />

    <View style={{ gap: spacing[8] }}>
      <View>
        <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[3], flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.success }} /><AppText variant="secondary" style={{ flex: 1 }}>{data.waiting.length ? `${data.waiting.length} patients moving through clinic` : 'Clinic flow is clear'}</AppText></View>
        <MetricStrip items={metricItems} />
      </View>

      <View style={{ paddingHorizontal: spacing[4] }}>
        <SectionHeader title="Needs attention" />
        {actionItems.length ? <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border }}>
          {actionItems.map((item, index) => <View key={item.id} style={{ paddingHorizontal: spacing[4], borderBottomWidth: index < actionItems.length - 1 ? 1 : 0, borderBottomColor: theme.colors.border }}>
            <ListRow title={item.title} subtitle={item.subtitle} icon={item.icon} iconTone={item.tone} onPress={() => router.push(item.route as never)} />
          </View>)}
        </View> : <View style={{ flexDirection: 'row', gap: spacing[3], alignItems: 'center', paddingVertical: spacing[4], borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border }}>
          <AppIcon icon={CheckCircle2} tone="success" />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">No urgent exceptions</AppText>
            <AppText variant="caption" tone="secondary">Today’s clinic flow is on plan.</AppText>
          </View>
        </View>}
      </View>

      {profile.focus !== 'billing' ? <View style={{ paddingHorizontal: spacing[4] }}>
        <SectionHeader title="Live clinic flow" actionLabel="Calendar" onAction={() => router.push('/(tabs)/calendar')} />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border }}>
          {roleAppointments.length ? roleAppointments.map((appointment, index) => {
            const next = nextOperationalStatus(appointment);
            return <View key={appointment.id} style={{ paddingHorizontal: spacing[3], borderBottomWidth: index < roleAppointments.length - 1 ? 1 : 0, borderBottomColor: theme.colors.border }}>
              <AppointmentRow appointment={appointment} onPress={() => router.push(`/appointment/${appointment.id}` as never)} onPrimaryAction={next ? () => advance(appointment) : undefined} primaryActionLabel={next ? APPOINTMENT_STATUS_LABELS[next] : undefined} />
            </View>;
          }) : <View style={{ padding: spacing[6], alignItems: 'center', gap: spacing[2] }}>
            <AppIcon icon={CalendarDays} size={24} />
            <AppText variant="bodyStrong">No appointments today</AppText>
            <AppText tone="secondary">Use New appointment to add the first visit.</AppText>
          </View>}
        </View>
      </View> : null}

      {roleTasks.length ? <View style={{ paddingHorizontal: spacing[4] }}>
        <SectionHeader title="Team handovers" actionLabel="View all" onAction={() => router.push('/(modules)/tasks')} />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border }}>
          {roleTasks.slice(0, 3).map((task, index) => <View key={task.id} style={{ borderBottomWidth: index < Math.min(3, roleTasks.length) - 1 ? 1 : 0, borderBottomColor: theme.colors.border }}>
            <TaskRow task={task} onPress={async () => {
              if (task.status === 'open') {
                await setTask.mutateAsync({ id: task.id, status: 'in-progress' });
                showToast('Task moved to your active queue.', 'success');
              } else {
                router.push('/(modules)/tasks');
              }
            }} />
          </View>)}
        </View>
      </View> : null}
    </View>
  </Screen>;
}

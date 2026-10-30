import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  useAppointments,
  useInvoices,
  usePatients,
  usePayments,
  useTasks,
  useTreatmentPlans
} from '@/hooks/useClinicQueries';
import { money } from '@/core/format';
import {
  AppText,
  MetricTile,
  PageHeader,
  ProgressBar,
  Screen,
  SectionHeader,
  SegmentedControl,
  Surface,
  EmptyState,
  ErrorState,
  LoadingState
} from '@/ui/components';
import { Activity, BadgeIndianRupee, CalendarDays, CheckCircle2, Clock3, Stethoscope, TriangleAlert } from '@/ui/icons';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';
import { ANALYTICS_RANGE_LABELS, buildClinicAnalytics, type AnalyticsRangeKey } from '@/domain/rules';

const RANGE_OPTIONS: readonly { value: AnalyticsRangeKey; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all-loaded', label: 'All' }
];

const DEFINITION_TITLES: readonly { key: keyof ReturnType<typeof buildClinicAnalytics>['definitions']; label: string }[] = [
  { key: 'utilization', label: 'Attended visits' },
  { key: 'cancellationRate', label: 'Cancellation rate' },
  { key: 'noShowRate', label: 'No-show rate' },
  { key: 'followUpCompletion', label: 'Follow-up completion' },
  { key: 'collections', label: 'Collections' },
  { key: 'outstanding', label: 'Outstanding balance' },
  { key: 'acceptanceRate', label: 'Treatment acceptance' },
  { key: 'recallCompletion', label: 'Recall scheduling' }
];

function pct(value: number): string {
  return `${Math.round(value)}%`;
}

export function ReportsScreen() {
  const theme = useTheme();
  const [range, setRange] = useState<AnalyticsRangeKey>('30d');
  const appointments = useAppointments();
  const invoices = useInvoices();
  const plans = useTreatmentPlans();
  const tasks = useTasks();
  const payments = usePayments();
  const patients = usePatients();

  const queries = [appointments, invoices, plans, tasks, payments, patients];
  const loading = queries.some((query) => query.isLoading);
  const errorQuery = queries.find((query) => query.isError);

  const analytics = useMemo(() => buildClinicAnalytics({
    range,
    appointments: appointments.data ?? [],
    invoices: invoices.data ?? [],
    payments: payments.data ?? [],
    plans: plans.data ?? [],
    tasks: tasks.data ?? [],
    patients: patients.data ?? []
  }), [range, appointments.data, invoices.data, payments.data, plans.data, tasks.data, patients.data]);

  const outstandingShare = analytics.outstanding ? Math.min(100, Math.round((analytics.overdue / analytics.outstanding) * 100)) : 0;

  return (
    <Screen>
      <PageHeader title="Reports" subtitle="Operational insight calculated from verified clinic data" onBack={() => router.back()} />
      <View style={{ paddingHorizontal: spacing[4], gap: spacing[4] }}>
        <SegmentedControl<AnalyticsRangeKey> options={RANGE_OPTIONS} value={range} onChange={setRange} />
        {loading ? <LoadingState label="Preparing clinic reports…" /> : errorQuery ? (
          <ErrorState message={errorQuery.error instanceof Error ? errorQuery.error.message : 'One or more clinic datasets could not be loaded.'} onRetry={() => { queries.forEach((query) => { void query.refetch(); }); }} />
        ) : <View style={{ gap: spacing[4] }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
            <MetricTile label="Scheduled visits" value={analytics.appointmentCount} icon={CalendarDays} tone="primary" detail={ANALYTICS_RANGE_LABELS[range]} />
            <MetricTile label="Attended" value={analytics.completed} icon={CheckCircle2} tone="success" detail={pct(analytics.utilization)} />
            <MetricTile label="Cancellations" value={analytics.cancelled} icon={TriangleAlert} tone={analytics.cancelled > 0 ? 'warning' : 'success'} detail={pct(analytics.cancellationRate)} />
            <MetricTile label="Collections" value={money(analytics.collections)} icon={BadgeIndianRupee} tone="clinical" detail={ANALYTICS_RANGE_LABELS[range]} />
          </View>

          <Surface style={{ gap: spacing[4] }}>
            <SectionHeader title="Appointment performance" subtitle="Track process reliability before adding more capacity" icon={Activity} />
            <ProgressBar value={analytics.utilization} label="Attended share of scheduled visits" tone={analytics.utilization >= 80 ? 'success' : 'warning'} />
            <ProgressBar value={analytics.cancellationRate} label="Cancellation rate" tone={analytics.cancellationRate > 10 ? 'danger' : 'clinical'} />
            <ProgressBar value={analytics.noShowRate} label="No-show rate" tone={analytics.noShowRate > 10 ? 'danger' : 'clinical'} />
          </Surface>

          <Surface style={{ gap: spacing[4] }}>
            <SectionHeader title="Treatment conversion" subtitle="From shared recommendation to patient-approved care" icon={Stethoscope} />
            <ProgressBar value={analytics.acceptanceRate} label="Value accepted or started" tone={analytics.acceptanceRate >= 60 ? 'success' : 'warning'} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText tone="secondary">Proposed value</AppText>
              <AppText variant="bodyStrong" tabular>{money(analytics.proposedValue)}</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText tone="secondary">Accepted / active</AppText>
              <AppText variant="bodyStrong" tabular>{money(analytics.acceptedValue)}</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText tone="secondary">Declined</AppText>
              <AppText variant="bodyStrong" tabular style={{ color: analytics.declinedValue > 0 ? theme.colors.danger : undefined }}>{money(analytics.declinedValue)}</AppText>
            </View>
          </Surface>

          <Surface style={{ gap: spacing[4] }}>
            <SectionHeader title="Receivables" subtitle="Separate earned revenue from cash collected" icon={BadgeIndianRupee} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText tone="secondary">Collected (net of refunds, this window)</AppText>
              <AppText variant="bodyStrong" tabular style={{ color: theme.colors.success }}>{money(analytics.collections)}</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText tone="secondary">Outstanding (all loaded invoices)</AppText>
              <AppText variant="bodyStrong" tabular style={{ color: theme.colors.warning }}>{money(analytics.outstanding)}</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText tone="secondary">Overdue</AppText>
              <AppText variant="bodyStrong" tabular style={{ color: analytics.overdue > 0 ? theme.colors.danger : undefined }}>{money(analytics.overdue)}</AppText>
            </View>
            <ProgressBar value={outstandingShare} label="Overdue share of outstanding" tone={outstandingShare > 20 ? 'danger' : 'clinical'} />
          </Surface>

          <Surface style={{ gap: spacing[4] }}>
            <SectionHeader title="Follow-ups and recalls" subtitle="Work that keeps patients returning on schedule" icon={Clock3} />
            <ProgressBar value={analytics.followUpCompletion} label="Follow-up tasks completed" tone={analytics.followUpCompletion >= 70 ? 'success' : 'warning'} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText tone="secondary">Follow-up tasks in window</AppText>
              <AppText variant="bodyStrong" tabular>{analytics.followUpsDone}/{analytics.followUps}</AppText>
            </View>
            <ProgressBar value={analytics.recallCompletion} label="Patients scheduled for recall" tone={analytics.recallCompletion >= 60 ? 'success' : 'warning'} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText tone="secondary">Recalls scheduled vs needing attention</AppText>
              <AppText variant="bodyStrong" tabular>{analytics.recallScheduled} / {analytics.recallDue}</AppText>
            </View>
          </Surface>

          <Surface tone="secondary" style={{ gap: spacing[2] }}>
            <AppText variant="bodyStrong">{analytics.window.label}</AppText>
            <AppText tone="secondary">Every number above is calculated from the clinic records loaded for your role, using these exact formulas:</AppText>
            {DEFINITION_TITLES.map(({ key, label }) => (
              <View key={key} style={{ gap: 2 }}>
                <AppText variant="caption" style={{ color: theme.colors.textSecondary }}>{label}</AppText>
                <AppText variant="caption" tone="secondary">{analytics.definitions[key]}</AppText>
              </View>
            ))}
          </Surface>

          {!analytics.appointmentCount ? (
            <EmptyState title="No scheduled visits in this window" message="Widen the range or book appointments to populate operational reports." icon={CalendarDays} />
          ) : null}

          <Surface tone="warning" style={{ gap: spacing[2] }}>
            <AppText variant="bodyStrong">Reporting guardrail</AppText>
            <AppText tone="secondary">Clinical quality and patient consent must not be reduced to revenue targets. Production dashboards keep audit context and role-based visibility.</AppText>
          </Surface>
        </View>}
      </View>
    </Screen>
  );
}

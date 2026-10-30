import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import type { LabCase, LabCaseStatus } from '@/domain/types';
import { useLabCases } from '@/hooks/useClinicQueries';
import { dateLabel } from '@/core/format';
import { AppText, Badge, Button, Chip, EmptyState, ErrorState, LoadingState, PageHeader, Screen, SectionHeader, Surface } from '@/ui/components';
import { CheckCircle2, Plus, TriangleAlert } from '@/ui/icons';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';

type LabFilter = LabCaseStatus | 'all';
const filters: { value: LabFilter; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'delayed', label: 'Delayed' },
  { value: 'in-progress', label: 'In progress' }, { value: 'trial-ready', label: 'Trial ready' },
  { value: 'received', label: 'Received' }, { value: 'sent', label: 'Sent' }, { value: 'fitted', label: 'Fitted' },
];

export function LaboratoryScreen() {
  const query = useLabCases();
  const [status, setStatus] = useState<LabFilter>('all');
  const rows = useMemo(() => (query.data ?? []).filter((labCase) => status === 'all' || labCase.status === status), [query.data, status]);
  const delayed = (query.data ?? []).filter((labCase) => labCase.status === 'delayed').length;
  const due = (query.data ?? []).filter((labCase) => labCase.dueAt && new Date(labCase.dueAt) <= new Date() && !['fitted', 'cancelled'].includes(labCase.status)).length;
  const active = (query.data ?? []).filter((labCase) => !['fitted', 'cancelled'].includes(labCase.status)).length;
  const groups = groupCases(rows);
  return <Screen>
    <PageHeader title="Laboratory" subtitle="Cases and clinical handoffs" onBack={() => router.back()} right={<Button label="New case" icon={Plus} size="small" onPress={() => router.push('/laboratory/new')} />} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[4] }}>
      <SummaryStrip active={active} due={due} delayed={delayed} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }}>
        {filters.map((item) => <Chip key={item.value} label={item.label} selected={status === item.value} onPress={() => setStatus(item.value)} />)}
      </ScrollView>
      {query.isLoading ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : !rows.length ? <EmptyState title="No cases in this view" message="Cases matching this handoff state will appear here." icon={CheckCircle2} /> : groups.map((group) => <View key={group.title} style={{ gap: spacing[2] }}>
        <SectionHeader title={group.title} subtitle={`${group.cases.length} ${group.cases.length === 1 ? 'case' : 'cases'}`} />
        <Surface padded={false} style={{ paddingHorizontal: spacing[4] }}>
          {group.cases.map((labCase, index) => <View key={labCase.id}>
            <LabRow labCase={labCase} />
            {index < group.cases.length - 1 ? <Divider /> : null}
          </View>)}
        </Surface>
      </View>)}
    </View>
  </Screen>;
}

function SummaryStrip({ active, due, delayed }: { active: number; due: number; delayed: number }) {
  return <Surface style={{ paddingVertical: spacing[3], flexDirection: 'row' }}>
    <SummaryValue label="Active" value={active} />
    <SummaryValue label="Due now" value={due} divided />
    <SummaryValue label="Delayed" value={delayed} divided />
  </Surface>;
}

function SummaryValue({ label, value, divided = false }: { label: string; value: number; divided?: boolean }) {
  const theme = useTheme();
  return <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: divided ? 1 : 0, borderLeftColor: theme.colors.border }}>
    <AppText variant="title2" style={{ fontVariant: ['tabular-nums'] }}>{value}</AppText>
    <AppText variant="caption" tone="secondary">{label}</AppText>
  </View>;
}

function LabRow({ labCase }: { labCase: LabCase }) {
  const theme = useTheme();
  const delayed = labCase.status === 'delayed';
  const due = labCase.dueAt ? `Due ${dateLabel(labCase.dueAt)}` : 'No due date';
  return <View style={{ paddingVertical: spacing[3], gap: spacing[3] }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${labCase.caseType} for ${labCase.patientName}`} onPress={() => router.push(`/patient/${labCase.patientId}`)} style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}>
      <View style={{ flexDirection: 'row', gap: spacing[3] }}>
        <View style={{ width: 3, borderRadius: 2, backgroundColor: delayed ? theme.colors.danger : theme.colors.clinical }} />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{labCase.patientName}</AppText>
            <Badge label={labCase.status.replaceAll('-', ' ')} tone={delayed ? 'danger' : labCase.status === 'received' || labCase.status === 'fitted' ? 'success' : 'clinical'} />
          </View>
          <AppText variant="caption" tone="secondary">{labCase.caseType} · {labCase.labName}</AppText>
          <AppText variant="caption" tone="muted">{labCase.toothNumbers.length ? `Teeth ${labCase.toothNumbers.join(', ')}` : 'Teeth not specified'}{labCase.shade ? ` · Shade ${labCase.shade}` : ''} · {due}</AppText>
          <AppText variant="caption" style={{ color: delayed ? theme.colors.danger : theme.colors.textSecondary }}>Next: {nextStep(labCase.status)}</AppText>
          {labCase.note ? <AppText variant="caption" tone="secondary" numberOfLines={2}>{labCase.note}</AppText> : null}
        </View>
      </View>
    </Pressable>
    {delayed ? <Button label="Review delay" icon={TriangleAlert} size="small" onPress={() => router.push(`/patient/${labCase.patientId}`)} style={{ alignSelf: 'flex-end' }} /> : null}
  </View>;
}

function groupCases(cases: LabCase[]) {
  const order = ['Delayed handoffs', 'Due today or earlier', 'Upcoming handoffs', 'No due date'];
  const grouped = new Map<string, LabCase[]>();
  for (const labCase of cases) {
    const title = labCase.status === 'delayed' ? 'Delayed handoffs' : !labCase.dueAt ? 'No due date' : new Date(labCase.dueAt) <= new Date() ? 'Due today or earlier' : 'Upcoming handoffs';
    grouped.set(title, [...(grouped.get(title) ?? []), labCase]);
  }
  return order.filter((title) => grouped.has(title)).map((title) => ({ title, cases: grouped.get(title)! }));
}

function nextStep(status: LabCaseStatus) {
  return ({ draft: 'send case to laboratory', sent: 'confirm laboratory receipt', 'in-progress': 'track production handoff', 'trial-ready': 'schedule clinical trial', received: 'review and fit', fitted: 'case complete', delayed: 'contact laboratory', cancelled: 'no further action' })[status];
}

function Divider() { const theme = useTheme(); return <View style={{ height: 1, backgroundColor: theme.colors.border }} />; }

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import type { Invoice } from '@/domain/types';
import { useInvoices, usePatients } from '@/hooks/useClinicQueries';
import { money, relativeTime } from '@/core/format';
import { AppText, Badge, Button, Chip, EmptyState, ErrorState, LoadingState, PageHeader, Screen, SectionHeader, Surface } from '@/ui/components';
import { BadgeIndianRupee, MessageCircle, Receipt } from '@/ui/icons';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';

type BillingFilter = 'action' | 'overdue' | 'partial' | 'paid' | 'all';
const filters: { value: BillingFilter; label: string }[] = [
  { value: 'action', label: 'Action needed' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'partial', label: 'Part paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'all', label: 'All' },
];

export function BillingScreen() {
  const invoices = useInvoices();
  const patients = usePatients();
  const [filter, setFilter] = useState<BillingFilter>('action');
  const rows = useMemo(() => (invoices.data ?? []).filter((invoice) => matchesFilter(invoice, filter)), [invoices.data, filter]);
  const outstanding = (invoices.data ?? []).reduce((sum, invoice) => sum + invoice.balance, 0);
  const overdue = (invoices.data ?? []).filter((invoice) => invoice.status === 'overdue').reduce((sum, invoice) => sum + invoice.balance, 0);
  const dueCount = (invoices.data ?? []).filter((invoice) => invoice.balance > 0).length;

  return <Screen>
    <PageHeader title="Billing" subtitle="Receivables and collections" onBack={() => router.back()} right={<Button label="Record payment" icon={BadgeIndianRupee} size="small" onPress={() => router.push('/payment/new')} />} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[4] }}>
      <ReceivablesStrip outstanding={outstanding} overdue={overdue} dueCount={dueCount} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }}>
        {filters.map((item) => <Chip key={item.value} label={item.label} selected={filter === item.value} onPress={() => setFilter(item.value)} />)}
      </ScrollView>
      <View style={{ gap: spacing[2] }}>
        <SectionHeader title="Invoices" subtitle={`${rows.length} records`} />
        <Surface padded={false} style={{ paddingHorizontal: spacing[4] }}>
          {invoices.isLoading ? <LoadingState /> : invoices.isError ? <ErrorState onRetry={() => invoices.refetch()} /> : !rows.length ? <EmptyState title="Queue complete" message="No invoices need attention in this view." icon={Receipt} /> : rows.map((invoice, index) => {
            const patient = patients.data?.find((item) => item.id === invoice.patientId);
            return <View key={invoice.id}>
              <InvoiceRow invoice={invoice} patientName={patient?.displayName ?? 'Patient'} />
              {index < rows.length - 1 ? <Divider /> : null}
            </View>;
          })}
        </Surface>
      </View>
    </View>
  </Screen>;
}

function ReceivablesStrip({ outstanding, overdue, dueCount }: { outstanding: number; overdue: number; dueCount: number }) {
  return <Surface style={{ paddingVertical: spacing[3], flexDirection: 'row' }}>
    <SummaryValue label="Outstanding" value={money(outstanding)} />
    <SummaryValue label="Overdue" value={money(overdue)} divided />
    <SummaryValue label="Open invoices" value={String(dueCount)} divided />
  </Surface>;
}

function SummaryValue({ label, value, divided = false }: { label: string; value: string; divided?: boolean }) {
  return <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: divided ? 1 : 0, borderLeftColor: 'rgba(128, 138, 148, 0.22)', paddingHorizontal: spacing[1] }}>
    <AppText variant="bodyStrong" numberOfLines={1} adjustsFontSizeToFit style={{ fontVariant: ['tabular-nums'] }}>{value}</AppText>
    <AppText variant="caption" tone="secondary" numberOfLines={1}>{label}</AppText>
  </View>;
}

function InvoiceRow({ invoice, patientName }: { invoice: Invoice; patientName: string }) {
  const theme = useTheme();
  const collect = () => router.push({ pathname: '/payment/new', params: { patientId: invoice.patientId, invoiceId: invoice.id } });
  const remind = () => router.push({ pathname: '/communication/new', params: { patientId: invoice.patientId, channel: 'whatsapp' } });
  const open = () => router.push(`/patient/${invoice.patientId}`);
  const age = relativeTime(invoice.issuedAt);
  return <View style={{ paddingVertical: spacing[3], gap: spacing[3] }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${invoice.invoiceNumber} for ${patientName}`} onPress={open} style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}>
      <View style={{ flexDirection: 'row', gap: spacing[3] }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{patientName}</AppText>
            <Badge label={invoice.status.replaceAll('-', ' ')} tone={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'danger' : invoice.status === 'partial' ? 'info' : 'neutral'} />
          </View>
          <AppText variant="caption" tone="secondary">{invoice.invoiceNumber} · issued {age}</AppText>
        </View>
        <View style={{ minWidth: 92, alignItems: 'flex-end' }}>
          <AppText variant="bodyStrong" style={{ fontVariant: ['tabular-nums'], color: invoice.status === 'overdue' ? theme.colors.danger : theme.colors.text }}>{money(invoice.balance)}</AppText>
          <AppText variant="caption" tone="muted">of {money(invoice.total)}</AppText>
        </View>
      </View>
    </Pressable>
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing[2], flexWrap: 'wrap' }}>
      {invoice.balance > 0 ? <Button label="Collect" icon={BadgeIndianRupee} size="small" onPress={collect} /> : null}
      {invoice.balance > 0 ? <Button label="Remind" icon={MessageCircle} size="small" tone="secondary" onPress={remind} /> : null}
      <Button label="Open" size="small" tone="ghost" onPress={open} />
    </View>
  </View>;
}

function matchesFilter(invoice: Invoice, filter: BillingFilter) {
  if (filter === 'all') return true;
  if (filter === 'action') return invoice.balance > 0 && invoice.status !== 'overdue';
  if (filter === 'partial') return invoice.status === 'partial';
  return invoice.status === filter;
}

function Divider() { return <View style={{ height: 1, backgroundColor: 'rgba(128, 138, 148, 0.18)' }} />; }

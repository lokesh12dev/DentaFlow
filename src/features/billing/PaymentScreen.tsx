import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { PaymentMethod } from '@/domain/types';
import { PAYMENT_METHOD_LABELS } from '@/domain/constants';
import { useClinic, useInvoices, usePatients, useRecordPayment } from '@/hooks/useClinicQueries';
import { createAndShareReceipt } from '@/services/receipt';
import { useUIStore } from '@/store/uiStore';
import { BadgeIndianRupee, Check, CreditCard, Receipt, Send, UserRound } from '@/ui/icons';
import { AppText, Badge, Button, Chip, Field, PageHeader, Screen, SectionHeader, Surface } from '@/ui/components';
import { spacing } from '@/ui/tokens';
import { money } from '@/core/format';

const methods: PaymentMethod[] = ['cash','card','upi','bank-transfer','payment-link','insurance','credit','installment'];
export function PaymentScreen() {
  const params = useLocalSearchParams<{ patientId?: string; invoiceId?: string }>();
  const patients = usePatients(); const invoices = useInvoices(); const clinic = useClinic(); const record = useRecordPayment(); const toast = useUIStore((s) => s.showToast);
  const [patientId, setPatientId] = useState(params.patientId ?? ''); const [invoiceId, setInvoiceId] = useState(params.invoiceId ?? ''); const [amount, setAmount] = useState(''); const [method, setMethod] = useState<PaymentMethod>('upi'); const [reference, setReference] = useState(''); const [sendReceipt, setSendReceipt] = useState(true);
  const patient = patients.data?.find((p) => p.id === patientId);
  const patientInvoices = useMemo(() => (invoices.data ?? []).filter((i) => i.patientId === patientId && i.balance > 0), [invoices.data, patientId]);
  const invoice = patientInvoices.find((i) => i.id === invoiceId);
  const numeric = Number(amount || 0); const valid = Boolean(patient && numeric > 0 && (!invoice || numeric <= invoice.balance));
  const submit = async () => { if (!patient || !clinic.data) return; try { const payment = await record.mutateAsync({ patientId: patient.id, invoiceId: invoiceId || undefined, amount: numeric, method, reference: reference || undefined, sendReceipt }); toast(`Payment recorded · ${payment.receiptNumber}`, 'success'); if (sendReceipt) await createAndShareReceipt(clinic.data, patient, payment, invoice); router.back(); } catch (e) { toast(e instanceof Error ? e.message : 'Payment could not be recorded', 'danger'); } };
  return <Screen><PageHeader title="Record payment" subtitle="Create a ledger entry and verifiable receipt" onBack={() => router.back()} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[4] }}>
      <Surface style={{ gap: spacing[3] }}><SectionHeader title="Patient" icon={UserRound} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>{patients.data?.filter((p) => p.balance > 0 || p.id === params.patientId).slice(0, 12).map((p) => <Chip key={p.id} label={`${p.displayName} · ${money(p.balance)}`} selected={patientId === p.id} onPress={() => { setPatientId(p.id); setInvoiceId(''); setAmount(''); }} />)}</View></Surface>
      {patient ? <Surface style={{ gap: spacing[3] }}><SectionHeader title="Apply to invoice" subtitle="Unallocated payments remain visible in the patient ledger" icon={Receipt} /><Chip label="Unallocated payment" selected={!invoiceId} onPress={() => setInvoiceId('')} />{patientInvoices.map((i) => <View key={i.id} style={{ gap: spacing[2] }}><Chip label={`${i.invoiceNumber} · ${money(i.balance)} due`} selected={invoiceId === i.id} onPress={() => { setInvoiceId(i.id); setAmount(String(i.balance)); }} /><AppText variant="caption" tone="secondary">Issued {new Date(i.issuedAt).toLocaleDateString()} · {i.status}</AppText></View>)}</Surface> : null}
      <Surface style={{ gap: spacing[3] }}><SectionHeader title="Payment details" icon={CreditCard} /><Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" helper={invoice ? `Maximum ${money(invoice.balance)}` : patient ? `Patient balance ${money(patient.balance)}` : undefined} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>{methods.map((m) => <Chip key={m} label={PAYMENT_METHOD_LABELS[m]} selected={method === m} onPress={() => setMethod(m)} />)}</View><Field label="Reference" value={reference} onChangeText={setReference} placeholder="UPI transaction, card authorization or bank reference" /><Chip label={sendReceipt ? 'Generate and share receipt' : 'Do not share receipt'} selected={sendReceipt} onPress={() => setSendReceipt(!sendReceipt)} /></Surface>
      <Surface tone="clinical" style={{ gap: spacing[2] }}><AppText variant="caption" tone="secondary">AMOUNT TO RECORD</AppText><AppText variant="display">{money(numeric)}</AppText>{invoice ? <Badge label={`New balance ${money(Math.max(0, invoice.balance - numeric))}`} tone="clinical" /> : null}</Surface>
      <Button label="Record payment" icon={Check} disabled={!valid} loading={record.isPending} onPress={submit} full />
    </View>
  </Screen>;
}

import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { usePatientRecord, useWithdrawConsent } from '@/hooks/useClinicQueries';
import { AppText, Button, ErrorState, Field, LoadingState, PageHeader, Screen, SectionHeader, Surface } from '@/ui/components';
import { ShieldCheck, TriangleAlert } from '@/ui/icons';
import { spacing } from '@/ui/tokens';
import { useUIStore } from '@/store/uiStore';

export function ConsentWithdrawalScreen() {
  const { patientId = '', consentId = '' } = useLocalSearchParams<{ patientId: string; consentId: string }>();
  const record = usePatientRecord(patientId);
  const mutation = useWithdrawConsent();
  const toast = useUIStore((state) => state.showToast);
  const [reason, setReason] = useState('');
  if (record.isLoading) return <Screen><PageHeader title="Withdraw consent" onBack={() => router.back()} /><LoadingState /></Screen>;
  const consent = record.data?.consents.find((item) => item.id === consentId);
  if (record.isError || !consent) return <Screen><PageHeader title="Withdraw consent" onBack={() => router.back()} /><ErrorState message="Consent record was not found." onRetry={() => record.refetch()} /></Screen>;
  const submit = async () => {
    if (reason.trim().length < 3) return toast('Document a clear withdrawal reason.', 'warning');
    try { await mutation.mutateAsync({ consentId, reason: reason.trim() }); toast('Consent withdrawal recorded without altering the signed record.', 'success'); router.back(); }
    catch (error) { toast(error instanceof Error ? error.message : 'Unable to withdraw consent.', 'danger'); }
  };
  return <Screen><PageHeader title="Withdraw consent" subtitle={`${record.data?.patient.displayName} · ${consent.templateName}`} onBack={() => router.back()} /><View style={{ paddingHorizontal: spacing[4], gap: spacing[4] }}>
    <Surface tone="danger" style={{ gap: spacing[3] }}><SectionHeader title="This does not delete the signed record" icon={TriangleAlert} /><AppText tone="secondary">The original version, signer, signature, timestamp and attestation remain immutable. A separate withdrawal event is added to the patient timeline and audit history.</AppText></Surface>
    <Surface style={{ gap: spacing[3] }}><SectionHeader title="Withdrawal record" icon={ShieldCheck} /><AppText variant="bodyStrong">{consent.templateName}</AppText><AppText variant="caption" tone="secondary">Version {consent.version} · {consent.language} · currently {consent.status}</AppText><Field label="Reason" value={reason} onChangeText={setReason} multiline placeholder="Patient changed decision, procedure changed, guardian withdrew authority…" /></Surface>
    <Button label="Record consent withdrawal" tone="danger" icon={ShieldCheck} loading={mutation.isPending} onPress={submit} full />
  </View></Screen>;
}

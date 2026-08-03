import React, { useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useCreateClinicalNote, usePatientRecord } from '@/hooks/useClinicQueries';
import { useUIStore } from '@/store/uiStore';
import { Camera, Check, FileText, Image as ImageIcon, Mic, Pause, ShieldCheck, Sparkles, Stethoscope } from '@/ui/icons';
import { AppText, Badge, Button, Chip, ErrorState, Field, LoadingState, PageHeader, ProgressBar, Screen, SectionHeader, Surface, ToothChart } from '@/ui/components';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';
import { generateClinicalDraft } from '@/services/clinicalAi';
import { uploadClinicalSources } from '@/services/clinicalMedia';
import { useSessionStore } from '@/store/sessionStore';

const fields = [
  ['chiefComplaint', 'Chief complaint', 'Patient-reported concern, location, duration and severity'],
  ['medicalUpdate', 'Medical update', 'Changes in conditions, medications, allergies or pregnancy status'],
  ['examination', 'Examination', 'Extraoral, intraoral, radiographic and periodontal examination'],
  ['findings', 'Findings', 'Objective clinical findings and tooth-specific observations'],
  ['assessment', 'Clinical assessment', 'Clinician-entered assessment or differential considerations'],
  ['procedurePerformed', 'Procedure performed', 'Steps completed during this visit'],
  ['anaesthetic', 'Anaesthetic', 'Agent, concentration, amount, route and response'],
  ['materials', 'Materials', 'Restorative materials, shade, batch or implant system'],
  ['medication', 'Medication', 'Medication prescribed or administered'],
  ['advice', 'Post-treatment advice', 'Instructions, warning signs and restrictions'],
  ['followUp', 'Follow-up', 'Review interval, next procedure or escalation criteria']
] as const;

type FormState = Record<(typeof fields)[number][0], string>;
const emptyForm = Object.fromEntries(fields.map(([key]) => [key, ''])) as FormState;

export function ClinicalNoteScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ patientId: string; appointmentId?: string; mode?: string }>();
  const patientQuery = usePatientRecord(params.patientId ?? '');
  const create = useCreateClinicalNote();
  const toast = useUIStore((s) => s.showToast);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [teeth, setTeeth] = useState<number[]>([]);
  const [media, setMedia] = useState<Array<{ uri: string; type: 'photo' | 'document' }>>([]);
  const [recordingUri, setRecordingUri] = useState<string>();
  const [aiReview, setAiReview] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const clinicId = useSessionStore((state) => state.activeClinicId);
  const [signed, setSigned] = useState(false);
  const completed = useMemo(() => fields.filter(([key]) => form[key].trim()).length, [form]);
  const completion = Math.round((completed / fields.length) * 100);
  const patient = patientQuery.data?.patient;

  if (patientQuery.isLoading) return <Screen><LoadingState label="Preparing clinical workspace…" /></Screen>;
  if (patientQuery.isError || !patient) return <Screen><ErrorState message="Patient record could not be loaded." onRetry={() => patientQuery.refetch()} /></Screen>;
  const set = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const selectTooth = (tooth: number) => setTeeth((current) => current.includes(tooth) ? current.filter((t) => t !== tooth) : [...current, tooth]);
  const pick = async (camera: boolean) => {
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { toast('Permission is required to attach clinical evidence', 'warning'); return; }
    const result = camera ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85, exif: false }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 6, quality: 0.85, exif: false });
    if (!result.canceled) setMedia((current) => [...current, ...result.assets.map((asset) => ({ uri: asset.uri, type: 'photo' as const }))]);
  };
  const toggleRecord = async () => {
    if (recorder.isRecording) { await recorder.stop(); setRecordingUri(recorder.uri ?? undefined); toast('Voice source preserved for review', 'success'); return; }
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) { toast('Microphone permission is required', 'warning'); return; }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync(); await recorder.record();
  };
  const ensureSourcesUploaded = async () => {
    if (sourceIds.length) return sourceIds;
    const sources = [...media.map((item) => ({ uri: item.uri, kind: item.type, mimeType: 'image/jpeg', toothNumbers: teeth } as const)), ...(recordingUri ? [{ uri: recordingUri, kind: 'audio' as const, mimeType: 'audio/mp4', toothNumbers: teeth }] : [])];
    const uploaded = await uploadClinicalSources(patient.id, params.appointmentId, sources); setSourceIds(uploaded); return uploaded;
  };
  const structureDraft = async () => {
    const source = fields.map(([key,label]) => form[key].trim() ? `${label}: ${form[key].trim()}` : '').filter(Boolean).join('\n');
    if (!source && !recordingUri && !media.length) { toast('Add text, a recording or an image first', 'warning'); return; }
    if (!clinicId) { toast('No active clinic is selected.', 'danger'); return; }
    setAiBusy(true);
    try {
      const uploaded = await ensureSourcesUploaded();
      const draft = await generateClinicalDraft({ clinicId, patientId: patient.id, appointmentId: params.appointmentId, text: source || undefined, mediaIds: uploaded, action: media.length ? 'extract-document' : 'structure-note' });
      setForm((current) => Object.fromEntries(fields.map(([key]) => [key, String(draft[key] ?? current[key] ?? '')])) as FormState);
      setAiReview(true); toast(draft.uncertainties?.length ? `Draft prepared with ${draft.uncertainties.length} uncertainty flag(s).` : 'Draft prepared for clinician review.', 'success');
    } catch (error) {
      const message=error instanceof Error?error.message:'Unable to structure the source';
      setForm((current)=>({...current,findings:current.findings||'Source attached. Cloud drafting was unavailable; complete this field manually before signing.'}));
      setAiReview(true);toast(message,'warning');
    } finally { setAiBusy(false); }
  };
  const save = async (status: 'draft' | 'review-required' | 'signed') => {
    if (status === 'signed' && !form.findings.trim() && !form.procedurePerformed.trim()) { toast('Findings or procedure is required before signing', 'warning'); return; }
    try { const uploaded = await ensureSourcesUploaded(); await create.mutateAsync({ patientId: patient.id, appointmentId: params.appointmentId, ...form, toothNumbers: teeth, status, aiGenerated: aiReview, aiSourceIds: uploaded }); toast(status === 'signed' ? 'Clinical record signed and locked' : 'Clinical draft saved', 'success'); router.back(); } catch (e) { toast(e instanceof Error ? e.message : 'Unable to save clinical note', 'danger'); }
  };

  return <Screen><PageHeader title="Clinical record" subtitle={`${patient.displayName} · ${patient.patientNumber}`} onBack={() => router.back()} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[4] }}>
      {patient.medicalAlerts.length ? <Surface tone="danger" style={{ gap: spacing[2] }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}><ShieldCheck size={19} color={theme.colors.danger} /><AppText variant="bodyStrong">Review before treatment</AppText></View>{patient.medicalAlerts.map((alert) => <AppText key={alert.id} tone="secondary">• {alert.label}{alert.detail ? ` — ${alert.detail}` : ''}</AppText>)}</Surface> : null}
      <Surface style={{ gap: spacing[3] }}><SectionHeader title="Record completeness" subtitle="Clinical safety uses required evidence, not decorative progress" icon={FileText} /><ProgressBar value={completion} tone={completion > 70 ? 'success' : 'warning'} label={`${completed} of ${fields.length} structured sections`} />{aiReview ? <Badge label="AI-assisted draft · clinician review required" tone="warning" /> : null}</Surface>
      <Surface style={{ gap: spacing[3] }}><SectionHeader title="Tooth selection" subtitle="Attach findings to exact teeth where possible" icon={Stethoscope} /><ToothChart records={patientQuery.data?.teeth ?? []} selected={teeth} onSelect={selectTooth} /></Surface>
      <Surface style={{ gap: spacing[3] }}><SectionHeader title="Source capture" subtitle="Original images and recordings remain preserved beside any extracted draft" icon={Camera} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}><Button label="Camera" icon={Camera} tone="secondary" onPress={() => pick(true)} /><Button label="Gallery" icon={ImageIcon} tone="secondary" onPress={() => pick(false)} /><Button label={recorder.isRecording ? 'Stop recording' : 'Voice note'} icon={recorder.isRecording ? Pause : Mic} tone={recorder.isRecording ? 'danger' : 'secondary'} onPress={toggleRecord} /></View>{recorder.isRecording ? <Surface tone="danger"><AppText variant="bodyStrong">Recording in progress</AppText><AppText tone="secondary">State the patient concern, tooth, findings, procedure, materials and follow-up.</AppText></Surface> : null}{recordingUri ? <Badge label="Voice source attached" tone="success" /> : null}{media.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>{media.map((item, index) => <View key={`${item.uri}-${index}`} style={{ width: 86, height: 86, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border }}><Image source={{ uri: item.uri }} style={{ width: '100%', height: '100%' }} /></View>)}</View> : null}<Button label="Structure sources into draft" icon={Sparkles} tone="clinical" onPress={structureDraft} loading={aiBusy} /></Surface>
      <Surface style={{ gap: spacing[4] }}><SectionHeader title="Structured note" subtitle="Collapse unused fields by leaving them blank" icon={FileText} />{fields.map(([key, label, helper]) => <Field key={key} label={label} value={form[key]} onChangeText={(value) => set(key, value)} placeholder={helper} multiline />)}</Surface>
      <Surface style={{ gap: spacing[3] }}><SectionHeader title="Clinical attestation" subtitle="Signing confirms the clinician reviewed content and sources" icon={ShieldCheck} /><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: signed }} onPress={() => setSigned(!signed)} style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}><View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: signed ? theme.colors.clinical : theme.colors.borderStrong, backgroundColor: signed ? theme.colors.clinical : theme.colors.surface, alignItems: 'center', justifyContent: 'center' }}>{signed ? <Check size={16} color={theme.colors.textInverse} /> : null}</View><AppText style={{ flex: 1 }}>I reviewed this record, its source material and all AI-assisted text.</AppText></Pressable><View style={{ flexDirection: 'row', gap: spacing[3] }}><Button label="Save draft" tone="secondary" onPress={() => save(aiReview ? 'review-required' : 'draft')} style={{ flex: 1 }} /><Button label="Sign record" icon={ShieldCheck} disabled={!signed} loading={create.isPending} onPress={() => save('signed')} style={{ flex: 1 }} /></View></Surface>
    </View>
  </Screen>;
}

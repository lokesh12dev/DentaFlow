import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  BadgeIndianRupee, CalendarDays, Camera, CheckCircle2, ClipboardList, Clock3,
  FileCheck2, FileImage, FileText, FlaskConical, History, Mail, MessageCircle,
  Mic, MoreHorizontal, Phone, Pill, Plus, Receipt, Send, ShieldCheck, Signature,
  Stethoscope, WalletCards
} from '@/ui/icons';
import {
  AppText, Avatar, Badge, Button, EmptyState, ErrorState, LoadingState, MedicalAlertCard,
  MetricTile, ModalSheet, PageHeader, PressableSurface, Screen, SectionHeader, SegmentedControl,
  Surface, TimelineList, ToothChart
} from '@/ui/components';
import { spacing, radii } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';
import { useClinic, usePatientRecord } from '@/hooks/useClinicQueries';
import { useUIStore } from '@/store/uiStore';
import { useSessionStore } from '@/store/sessionStore';
import { money, dateLabel, dateTime, fullDate, relativeTime } from '@/core/format';
import { highestMedicalRisk } from '@/domain/rules';
import type { ClinicalMedia, PatientRecord, Payment, Prescription } from '@/domain/types';
import { createAndShareReceipt } from '@/services/receipt';
import { createAndSharePrescription } from '@/services/clinicalDocuments';
import { sharePatientPortalLink } from '@/services/patientPortal';
import { HistoryAssistant } from './HistoryAssistant';

const mainTabs = [
  { value: 'summary', label: 'Summary' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'clinical', label: 'Clinical' },
  { value: 'finance', label: 'Finance' }
] as const;

type MainTab = typeof mainTabs[number]['value'];
type ClinicalTab = 'teeth' | 'notes' | 'media' | 'plans' | 'medical' | 'documents';
const clinicalTabs: Array<{ value: ClinicalTab; label: string }> = [
  { value: 'teeth', label: 'Teeth' }, { value: 'notes', label: 'Notes' }, { value: 'media', label: 'Media' },
  { value: 'plans', label: 'Plans' }, { value: 'medical', label: 'Medical' }, { value: 'documents', label: 'Documents' }
];

export function PatientProfileScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const patientId = Array.isArray(params.id) ? params.id[0]! : params.id;
  const router = useRouter();
  const theme = useTheme();
  const record = usePatientRecord(patientId);
  const clinic = useClinic();
  const toast = useUIStore((state) => state.showToast);
  const demoMode = useSessionStore((state) => state.demoMode);
  const [tab, setTab] = useState<MainTab>('summary');
  const [clinicalTab, setClinicalTab] = useState<ClinicalTab>('teeth');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<'all' | PatientRecord['timeline'][number]['type']>('all');

  const filteredTimeline = useMemo(
    () => record.data?.timeline.filter((event) => timelineFilter === 'all' || event.type === timelineFilter) ?? [],
    [record.data?.timeline, timelineFilter]
  );

  if (record.isLoading) return <Screen><PageHeader title="Patient record" onBack={() => router.back()} /><LoadingState label="Opening the protected patient record…" /></Screen>;
  if (record.isError || !record.data) return <Screen><PageHeader title="Patient record" onBack={() => router.back()} /><ErrorState message={record.error instanceof Error ? record.error.message : undefined} onRetry={() => record.refetch()} /></Screen>;

  const data = record.data;
  const patient = data.patient;
  const risk = highestMedicalRisk(patient.medicalAlerts);

  const shareIntake = async () => {
    if (demoMode) return toast('Secure patient links require Supabase mode.', 'warning');
    try {
      await sharePatientPortalLink({ patientName: patient.firstName, patientId: patient.id, scope: 'intake', expiresInMinutes: 1440 });
      toast('Secure intake link created. It expires in 24 hours.', 'success');
    } catch (error) { toast(error instanceof Error ? error.message : 'Unable to create the intake link.', 'danger'); }
  };

  const shareReceipt = async (payment: Payment) => {
    if (!clinic.data) return toast('Clinic profile is still loading.', 'warning');
    try {
      await createAndShareReceipt(clinic.data, patient, payment, data.invoices.find((invoice) => invoice.id === payment.invoiceId));
    } catch (error) { toast(error instanceof Error ? error.message : 'Receipt could not be generated.', 'danger'); }
  };

  const sharePrescription = async (prescription: Prescription) => {
    if (!clinic.data) return toast('Clinic profile is still loading.', 'warning');
    try { await createAndSharePrescription(clinic.data, patient, prescription); }
    catch (error) { toast(error instanceof Error ? error.message : 'Prescription could not be generated.', 'danger'); }
  };

  const navigate = (path: string) => { setActionsOpen(false); router.push(path as never); };

  return <Screen refreshControl={<RefreshControl refreshing={record.isRefetching} onRefresh={() => record.refetch()} tintColor={theme.colors.clinical} />}>
    <PageHeader
      title={patient.displayName}
      subtitle={`${patient.patientNumber} · ${patient.age} years · ${patient.preferredLanguage}`}
      onBack={() => router.back()}
      right={<Badge label={risk === 'none' ? 'No medical alert' : `${risk} risk`} tone={risk === 'critical' || risk === 'high' ? 'danger' : risk === 'moderate' ? 'warning' : 'success'} />}
    />

    <View style={{ paddingHorizontal: spacing[4], gap: spacing[5] }}>
      <PatientIdentityCard data={data} onCall={() => navigate(`/communication/new?patientId=${patient.id}&channel=call`)} onWhatsApp={() => navigate(`/communication/new?patientId=${patient.id}&channel=whatsapp`)} onEmail={() => navigate(`/communication/new?patientId=${patient.id}&channel=email`)} onBook={() => navigate(`/appointment/new?patientId=${patient.id}`)} onMore={() => setActionsOpen(true)} />
      <SegmentedControl options={mainTabs} value={tab} onChange={setTab} compact />

      {tab === 'summary' ? <SummaryTab data={data} onHistory={() => setHistoryOpen(true)} onBook={() => navigate(`/appointment/new?patientId=${patient.id}`)} onClinical={() => navigate(`/clinical/note?patientId=${patient.id}`)} onPayment={() => navigate(`/payment/new?patientId=${patient.id}`)} onIntake={shareIntake} /> : null}
      {tab === 'timeline' ? <TimelineTab data={data} filter={timelineFilter} onFilter={setTimelineFilter} events={filteredTimeline} /> : null}
      {tab === 'clinical' ? <View style={{ gap: spacing[4] }}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }}>{clinicalTabs.map((item) => <Button key={item.value} label={item.label} size="small" tone={clinicalTab === item.value ? 'clinical' : 'secondary'} onPress={() => setClinicalTab(item.value)} />)}</ScrollView><ClinicalTabContent data={data} tab={clinicalTab} onNewNote={() => navigate(`/clinical/note?patientId=${patient.id}`)} onNewPlan={() => navigate(`/treatment/new?patientId=${patient.id}`)} onNewConsent={() => navigate(`/clinical/consent?patientId=${patient.id}`)} onNewPrescription={() => navigate(`/clinical/prescription?patientId=${patient.id}`)} onNewLab={() => navigate(`/laboratory/new?patientId=${patient.id}`)} onOpenConsent={(id) => navigate(`/consent/${id}?patientId=${patient.id}`)} onWithdrawConsent={(id) => navigate(`/consent/withdraw?patientId=${patient.id}&consentId=${id}`)} onSharePrescription={sharePrescription} /></View> : null}
      {tab === 'finance' ? <FinanceTab data={data} onPayment={() => navigate(`/payment/new?patientId=${patient.id}`)} onReceipt={shareReceipt} onRefund={(payment) => navigate(`/payment/refund?patientId=${patient.id}&paymentId=${payment.id}`)} /> : null}
    </View>

    <HistoryAssistant visible={historyOpen} patientId={patient.id} onClose={() => setHistoryOpen(false)} />
    <ModalSheet visible={actionsOpen} title="Patient actions" subtitle="Choose the next accountable workflow" onClose={() => setActionsOpen(false)}>
      <ActionGrid actions={[
        { label: 'Book appointment', icon: CalendarDays, action: () => navigate(`/appointment/new?patientId=${patient.id}`) },
        { label: 'Clinical note', icon: Stethoscope, action: () => navigate(`/clinical/note?patientId=${patient.id}`) },
        { label: 'Treatment plan', icon: FileCheck2, action: () => navigate(`/treatment/new?patientId=${patient.id}`) },
        { label: 'Prepare consent', icon: Signature, action: () => navigate(`/clinical/consent?patientId=${patient.id}`) },
        { label: 'Prescription', icon: Pill, action: () => navigate(`/clinical/prescription?patientId=${patient.id}`) },
        { label: 'Laboratory case', icon: FlaskConical, action: () => navigate(`/laboratory/new?patientId=${patient.id}`) },
        { label: 'Create task', icon: ClipboardList, action: () => navigate(`/task/new?patientId=${patient.id}`) },
        { label: 'Secure intake link', icon: Send, action: () => { setActionsOpen(false); void shareIntake(); } }
      ]} />
    </ModalSheet>
  </Screen>;
}

function PatientIdentityCard({ data, onCall, onWhatsApp, onEmail, onBook, onMore }: { data: PatientRecord; onCall: () => void; onWhatsApp: () => void; onEmail: () => void; onBook: () => void; onMore: () => void }) {
  const patient = data.patient;
  const risk = highestMedicalRisk(patient.medicalAlerts);
  return <Surface style={{ gap: spacing[4] }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
      <Avatar name={patient.displayName} size={64} tone={risk === 'critical' || risk === 'high' ? 'danger' : 'clinical'} />
      <View style={{ flex: 1, gap: 3 }}><AppText variant="title2">{patient.displayName}</AppText><AppText tone="secondary">Born {fullDate(patient.dateOfBirth)} · {patient.gender}</AppText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1] }}>{patient.tags.map((tag) => <Badge key={tag} label={tag} />)}{!patient.intakeVerified ? <Badge label="History unverified" tone="warning" /> : null}</View></View>
    </View>
    <MedicalAlertCard alerts={patient.medicalAlerts} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <QuickAction label="Call" icon={Phone} onPress={onCall} />
      <QuickAction label="WhatsApp" icon={MessageCircle} onPress={onWhatsApp} />
      <QuickAction label="Email" icon={Mail} onPress={onEmail} />
      <QuickAction label="Book" icon={CalendarDays} onPress={onBook} />
      <QuickAction label="More" icon={MoreHorizontal} onPress={onMore} />
    </View>
  </Surface>;
}

function QuickAction({ label, icon: Icon, onPress }: { label: string; icon: typeof Phone; onPress: () => void }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ alignItems: 'center', gap: spacing[1], opacity: pressed ? 0.65 : 1 })}><View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surfaceSecondary, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }}><Icon size={19} color={theme.colors.primary} /></View><AppText variant="tiny" tone="secondary">{label}</AppText></Pressable>;
}

function SummaryTab({ data, onHistory, onBook, onClinical, onPayment, onIntake }: { data: PatientRecord; onHistory: () => void; onBook: () => void; onClinical: () => void; onPayment: () => void; onIntake: () => void }) {
  const patient = data.patient;
  const next = data.appointments.find((appointment) => new Date(appointment.startsAt) >= new Date() && !['cancelled', 'no-show'].includes(appointment.status));
  const latestNote = data.notes[0];
  const activePlan = data.treatmentPlans.find((plan) => !['completed', 'declined'].includes(plan.stage));
  const openTasks = data.tasks.filter((task) => !['done', 'cancelled'].includes(task.status));
  return <View style={{ gap: spacing[5] }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
      <MetricTile label="Balance" value={money(patient.balance)} icon={WalletCards} tone={patient.balance ? 'warning' : 'success'} />
      <MetricTile label="Recall" value={patient.recallStatus ? patient.recallStatus.replaceAll('-', ' ') : 'Inactive'} icon={Clock3} tone={patient.recallStatus === 'overdue' ? 'danger' : patient.recallStatus === 'due' ? 'warning' : patient.recallStatus === 'due-soon' ? 'warning' : 'success'} />
      <MetricTile label="Clinical files" value={String(data.media.length)} icon={FileImage} tone="clinical" />
      <MetricTile label="Open tasks" value={String(openTasks.length)} icon={ClipboardList} tone={openTasks.length ? 'info' : 'success'} />
      <MetricTile label="Lifetime value" value={money(patient.lifetimeValue)} icon={BadgeIndianRupee} tone="primary" />
    </View>

    <Surface style={{ gap: spacing[3] }}><SectionHeader title="Next best action" subtitle="Highest-value unresolved item" icon={CheckCircle2} />
      {!patient.intakeComplete ? <ActionCallout tone="warning" title="Patient intake is incomplete" detail="Send a secure link before the visit to reduce reception work." button="Send intake link" onPress={onIntake} />
        : !patient.intakeVerified ? <ActionCallout tone="danger" title="Verify medical history before treatment" detail="Patient-reported information has not been confirmed by a clinician." button="Open clinical note" onPress={onClinical} />
        : patient.balance > 0 ? <ActionCallout tone="warning" title={`Collect ${money(patient.balance)} outstanding`} detail="Review invoices and payment stages before continuing treatment." button="Record payment" onPress={onPayment} />
        : activePlan?.stage === 'not-booked' ? <ActionCallout tone="clinical" title="Accepted treatment is not booked" detail={activePlan.title} button="Book appointment" onPress={onBook} />
        : <ActionCallout tone="clinical" title="Review source-linked history" detail="Ask a focused question before the next clinical decision." button="Search history" onPress={onHistory} />}
    </Surface>

    <Surface style={{ gap: spacing[3] }}><SectionHeader title="Care snapshot" subtitle="Clinical and operational context at a glance" icon={Stethoscope} />
      <SnapshotRow icon={CalendarDays} title={next ? `${dateTime(next.startsAt)} · ${next.procedureName}` : 'No upcoming appointment'} detail={next ? `${next.doctorName} · ${next.chairName} · ${next.status}` : 'Book the next visit from this record.'} />
      <SnapshotRow icon={FileText} title={latestNote?.procedurePerformed || latestNote?.chiefComplaint || 'No recent clinical note'} detail={latestNote ? `${latestNote.authorName} · ${relativeTime(latestNote.createdAt)}` : 'Documentation will appear after the first clinical entry.'} />
      <SnapshotRow icon={FileCheck2} title={activePlan?.title ?? 'No active treatment plan'} detail={activePlan ? `${activePlan.stage.replaceAll('-', ' ')} · ${money(activePlan.total)}` : 'Create an itemised plan after assessment.'} />
      <SnapshotRow icon={Clock3} title={`${openTasks.length} open task${openTasks.length === 1 ? '' : 's'}`} detail={openTasks[0]?.title ?? 'No handover or follow-up is pending.'} />
    </Surface>

    {data.media.length ? <View style={{ gap: spacing[3] }}><SectionHeader title="Recent clinical media" subtitle="Original source preserved" icon={Camera} /><View style={{ flexDirection: 'row', gap: spacing[3] }}>{data.media.slice(0, 3).map((media) => <MediaTile key={media.id} media={media} />)}</View></View> : null}
  </View>;
}

function TimelineTab({ data, filter, onFilter, events }: { data: PatientRecord; filter: string; onFilter: (value: 'all' | PatientRecord['timeline'][number]['type']) => void; events: PatientRecord['timeline'] }) {
  return <View style={{ gap: spacing[4] }}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }}>
      {(['all', 'appointment', 'clinical', 'communication', 'payment', 'consent', 'treatment', 'lab', 'document'] as const).map((value) => <Button key={value} label={value[0]!.toUpperCase() + value.slice(1)} tone={filter === value ? 'primary' : 'secondary'} size="small" onPress={() => onFilter(value)} />)}
    </ScrollView>
    <Surface>{events.length ? <TimelineList events={events} /> : <EmptyState title="No matching history" message="This patient has no events in the selected category." icon={History} />}</Surface>
    <AppText variant="caption" tone="muted" tabular>{data.timeline.length} total events. Signed clinical records retain their original version and author.</AppText>
  </View>;
}

function ClinicalTabContent({ data, tab, onNewNote, onNewPlan, onNewConsent, onNewPrescription, onNewLab, onOpenConsent, onWithdrawConsent, onSharePrescription }: {
  data: PatientRecord; tab: ClinicalTab; onNewNote: () => void; onNewPlan: () => void; onNewConsent: () => void; onNewPrescription: () => void; onNewLab: () => void; onOpenConsent: (id: string) => void; onWithdrawConsent: (id: string) => void; onSharePrescription: (prescription: Prescription) => void;
}) {
  const theme = useTheme();
  if (tab === 'teeth') return <Surface style={{ gap: spacing[4] }}><SectionHeader title="Adult dentition" subtitle="Current condition by tooth and surface" icon={Stethoscope} /><ToothChart records={data.teeth} readonly /><View style={{ gap: spacing[2] }}>{data.teeth.map((tooth) => <View key={tooth.toothNumber} style={{ flexDirection: 'row', gap: spacing[3], alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: spacing[3] }}><Badge label={`Tooth ${tooth.toothNumber}`} tone="clinical" /><AppText style={{ flex: 1 }}>{tooth.condition.replaceAll('-', ' ')}{tooth.surfaces.length ? ` · ${tooth.surfaces.join('/')}` : ''}{tooth.note ? ` · ${tooth.note}` : ''}</AppText></View>)}</View></Surface>;
  if (tab === 'notes') return <View style={{ gap: spacing[3] }}><Button label="New structured clinical note" icon={Plus} onPress={onNewNote} full />{data.notes.length ? data.notes.map((note) => <Surface key={note.id} style={{ gap: spacing[2] }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}><AppText variant="bodyStrong" style={{ flex: 1 }}>{note.procedurePerformed || note.chiefComplaint || 'Clinical note'}</AppText><Badge label={note.status} tone={note.status === 'signed' ? 'success' : 'warning'} /></View>{note.findings ? <AppText tone="secondary">{note.findings}</AppText> : null}{note.advice ? <AppText tone="secondary">Advice: {note.advice}</AppText> : null}<AppText variant="caption" tone="muted">{note.authorName} · {dateTime(note.createdAt)}{note.toothNumbers.length ? ` · Teeth ${note.toothNumbers.join(', ')}` : ''}{note.aiGenerated ? ' · AI-assisted draft reviewed by clinician' : ''}</AppText></Surface>) : <EmptyState title="No clinical notes" message="Create a structured note or convert media into a review-required draft." actionLabel="Create note" onAction={onNewNote} icon={ClipboardList} />}</View>;
  if (tab === 'media') return <View style={{ gap: spacing[3] }}><Button label="Capture photo, document, or voice" icon={Camera} onPress={onNewNote} full />{data.media.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>{data.media.map((media) => <View key={media.id} style={{ width: '47.5%' }}><MediaTile media={media} /><View style={{ paddingTop: spacing[2], gap: 2 }}><Badge label={media.aiStatus ?? 'not-requested'} tone={media.aiStatus === 'reviewed' ? 'success' : media.aiStatus === 'failed' ? 'danger' : 'neutral'} /><AppText variant="caption" tone="muted" tabular>{dateTime(media.capturedAt)}</AppText></View></View>)}</View> : <EmptyState title="No media" message="Clinical media appears here with the original source preserved." actionLabel="Capture media" onAction={onNewNote} icon={Camera} />}</View>;
  if (tab === 'plans') return <View style={{ gap: spacing[3] }}><Button label="Create treatment plan" icon={FileCheck2} onPress={onNewPlan} full />{data.treatmentPlans.length ? data.treatmentPlans.map((plan) => <Surface key={plan.id} style={{ gap: spacing[3] }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}><AppText variant="title3" style={{ flex: 1 }}>{plan.title}</AppText><Badge label={plan.stage.replaceAll('-', ' ')} tone={plan.stage === 'completed' ? 'success' : plan.stage === 'declined' ? 'danger' : 'clinical'} /></View>{plan.items.map((item) => <View key={item.id} style={{ flexDirection: 'row', gap: spacing[3], paddingTop: spacing[2], borderTopWidth: 1, borderTopColor: theme.colors.border }}><View style={{ flex: 1 }}><AppText variant="bodyStrong">{item.procedureName}</AppText><AppText variant="caption" tone="secondary">{item.toothNumbers.length ? `Teeth ${item.toothNumbers.join(', ')} · ` : ''}{item.status}</AppText></View><AppText variant="bodyStrong" tabular>{money(item.total)}</AppText></View>)}<View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: theme.colors.border }}><AppText variant="label">Plan total</AppText><AppText variant="title3" tabular>{money(plan.total)}</AppText></View></Surface>) : <EmptyState title="No treatment plan" message="Create an itemised care proposal after clinical assessment." actionLabel="Create plan" onAction={onNewPlan} icon={FileCheck2} />}</View>;
  if (tab === 'medical') return <View style={{ gap: spacing[3] }}><MedicalAlertCard alerts={data.patient.medicalAlerts} /><Surface style={{ gap: spacing[3] }}><SectionHeader title="Current medications" icon={Pill} />{data.patient.medications.length ? data.patient.medications.map((medication) => <View key={medication.id} style={{ paddingTop: spacing[2], borderTopWidth: 1, borderTopColor: theme.colors.border }}><AppText variant="bodyStrong">{medication.name}</AppText><AppText tone="secondary">{[medication.dosage, medication.frequency, medication.indication].filter(Boolean).join(' · ')}</AppText></View>) : <AppText tone="secondary">No medication has been recorded.</AppText>}</Surface><Button label="Issue prescription" icon={Pill} onPress={onNewPrescription} full />{data.prescriptions.map((prescription) => <PressableSurface key={prescription.id} accessibilityLabel="Share prescription" onPress={() => onSharePrescription(prescription)} style={{ padding: spacing[4] }}><View style={{ gap: spacing[2] }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><AppText variant="bodyStrong" style={{ flex: 1 }}>{prescription.items.map((item) => item.medicine).join(', ')}</AppText><Badge label="PDF" tone="info" /></View><AppText variant="caption" tone="secondary">{dateTime(prescription.issuedAt)} · {prescription.prescribedByName}</AppText><AppText variant="caption" tone="muted">Tap to generate and share the authorised prescription.</AppText></View></PressableSurface>)}</View>;
  return <View style={{ gap: spacing[3] }}><View style={{ flexDirection: 'row', gap: spacing[2] }}><Button label="Prepare consent" icon={Signature} onPress={onNewConsent} style={{ flex: 1 }} /><Button label="New lab case" icon={FlaskConical} tone="secondary" onPress={onNewLab} style={{ flex: 1 }} /></View><Surface style={{ gap: spacing[3] }}><SectionHeader title="Consent records" icon={ShieldCheck} />{data.consents.length ? data.consents.map((consent) => <Pressable key={consent.id} accessibilityRole="button" accessibilityLabel={consent.status === 'signed' ? `Withdraw ${consent.templateName}` : `Open ${consent.templateName}`} disabled={consent.status === 'withdrawn'} onPress={() => consent.status === 'signed' ? onWithdrawConsent(consent.id) : onOpenConsent(consent.id)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: theme.colors.border, opacity: pressed ? 0.68 : 1 })}><View style={{ flex: 1 }}><AppText variant="bodyStrong">{consent.templateName}</AppText><AppText variant="caption" tone="secondary" tabular>Version {consent.version} · {consent.language}{consent.signedByName ? ` · ${consent.signedByName}` : ''}</AppText></View><Badge label={consent.status} tone={consent.status === 'signed' ? 'success' : consent.status === 'declined' || consent.status === 'withdrawn' ? 'danger' : 'warning'} /></Pressable>) : <AppText tone="secondary">No procedure-specific consent has been prepared.</AppText>}</Surface><Surface style={{ gap: spacing[3] }}><SectionHeader title="Laboratory cases" icon={FlaskConical} />{data.labCases.length ? data.labCases.map((lab) => <View key={lab.id} style={{ gap: 2, paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: theme.colors.border }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><AppText variant="bodyStrong" style={{ flex: 1 }}>{lab.caseType}</AppText><Badge label={lab.status} tone={lab.status === 'received' ? 'success' : lab.status === 'delayed' ? 'danger' : 'warning'} /></View><AppText variant="caption" tone="secondary">{lab.labName}{lab.toothNumbers.length ? ` · Teeth ${lab.toothNumbers.join(', ')}` : ''}{lab.dueAt ? ` · Due ${dateLabel(lab.dueAt)}` : ''}</AppText></View>) : <AppText tone="secondary">No laboratory case is linked to this patient.</AppText>}</Surface></View>;
}

function FinanceTab({ data, onPayment, onReceipt, onRefund }: { data: PatientRecord; onPayment: () => void; onReceipt: (payment: Payment) => void; onRefund: (payment: Payment) => void }) {
  const theme = useTheme();
  const netPaid = data.payments.reduce((sum, payment) => sum + (payment.status === 'failed' ? 0 : payment.amount - (payment.refundAmount ?? 0)), 0);
  return <View style={{ gap: spacing[5] }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}><MetricTile label="Outstanding" value={money(data.patient.balance)} icon={WalletCards} tone={data.patient.balance ? 'warning' : 'success'} /><MetricTile label="Net paid" value={money(netPaid)} icon={BadgeIndianRupee} tone="success" /></View>
    <Button label="Record payment" icon={BadgeIndianRupee} onPress={onPayment} full />
    <View style={{ gap: spacing[3] }}><SectionHeader title="Invoices" subtitle="Current patient ledger" icon={FileText} />{data.invoices.length ? data.invoices.map((invoice) => <Surface key={invoice.id} style={{ gap: spacing[3] }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}><View style={{ flex: 1 }}><AppText variant="bodyStrong">{invoice.invoiceNumber}</AppText><AppText variant="caption" tone="secondary" tabular>Issued {dateTime(invoice.issuedAt)}</AppText></View><Badge label={invoice.status} tone={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'danger' : 'warning'} /></View>{invoice.items.map((item) => <View key={item.id} style={{ flexDirection: 'row', gap: spacing[3] }}><AppText tone="secondary" style={{ flex: 1 }}>{item.description}</AppText><AppText tabular>{money(item.total)}</AppText></View>)}<View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: spacing[3] }}><View><AppText variant="caption" tone="secondary">Total</AppText><AppText variant="bodyStrong" tabular>{money(invoice.total)}</AppText></View><View style={{ alignItems: 'flex-end' }}><AppText variant="caption" tone="secondary">Balance</AppText><AppText variant="title3" tabular tone={invoice.balance ? 'warning' : 'success'}>{money(invoice.balance)}</AppText></View></View></Surface>) : <EmptyState title="No invoices" message="Invoices and treatment estimates will appear here." icon={FileText} />}</View>
    <View style={{ gap: spacing[3] }}><SectionHeader title="Payments and receipts" icon={Receipt} />{data.payments.length ? data.payments.map((payment) => { const refundable = Math.max(0, payment.amount - (payment.refundAmount ?? 0)); return <Surface key={payment.id} style={{ gap: spacing[3] }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}><View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: theme.colors.successSoft, alignItems: 'center', justifyContent: 'center' }}><Receipt size={19} color={theme.colors.success} /></View><View style={{ flex: 1 }}><AppText variant="bodyStrong" tabular>{money(payment.amount)}</AppText><AppText variant="caption" tone="secondary">{payment.receiptNumber} · {payment.method}</AppText></View><Badge label={payment.status.replaceAll('-', ' ')} tone={payment.status === 'completed' ? 'success' : payment.status === 'failed' ? 'danger' : 'warning'} /></View><AppText variant="caption" tone="muted" tabular>{dateTime(payment.receivedAt)}{payment.refundAmount ? ` · Refunded ${money(payment.refundAmount)}` : ''}</AppText><View style={{ flexDirection: 'row', gap: spacing[2] }}><Button label="View receipt" icon={Receipt} size="small" tone="secondary" onPress={() => onReceipt(payment)} style={{ flex: 1 }} />{refundable > 0 && payment.status !== 'failed' ? <Button label="Refund" size="small" tone="ghost" onPress={() => onRefund(payment)} style={{ flex: 1 }} /> : null}</View></Surface>; }) : <AppText tone="secondary">No payments recorded.</AppText>}</View>
  </View>;
}

function ActionGrid({ actions }: { actions: Array<{ label: string; icon: typeof CalendarDays; action: () => void }> }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>{actions.map(({ label, icon: Icon, action }) => <PressableSurface key={label} accessibilityLabel={label} onPress={action} style={{ width: '47.5%', padding: spacing[4], minHeight: 104, justifyContent: 'space-between' }}><Icon size={22} color={theme.colors.clinical} /><AppText variant="bodyStrong">{label}</AppText></PressableSurface>)}</View>;
}

function ActionCallout({ title, detail, button, onPress, tone }: { title: string; detail: string; button: string; onPress: () => void; tone: 'clinical' | 'warning' | 'danger' }) {
  return <Surface tone={tone} style={{ gap: spacing[3] }}><AppText variant="bodyStrong">{title}</AppText><AppText tone="secondary">{detail}</AppText><Button label={button} tone={tone === 'clinical' ? 'clinical' : tone === 'danger' ? 'danger' : 'secondary'} onPress={onPress} /></Surface>;
}

function SnapshotRow({ icon: Icon, title, detail }: { icon: typeof CalendarDays; title: string; detail: string }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', gap: spacing[3], alignItems: 'center', minHeight: 54 }}><View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: theme.colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color={theme.colors.primary} /></View><View style={{ flex: 1 }}><AppText variant="bodyStrong">{title}</AppText><AppText variant="caption" tone="secondary">{detail}</AppText></View></View>;
}

function MediaTile({ media }: { media: ClinicalMedia }) {
  const theme = useTheme(); const Icon = media.kind === 'audio' ? Mic : media.kind === 'document' ? FileText : FileImage;
  return <View style={{ flex: 1, minHeight: 116, borderRadius: radii.lg, backgroundColor: theme.colors.surfaceSecondary, borderWidth: 1, borderColor: theme.colors.border, padding: spacing[3], justifyContent: 'space-between' }}><Icon size={22} color={theme.colors.clinical} /><View><AppText variant="caption" numberOfLines={2}>{media.title}</AppText><AppText variant="tiny" tone="muted">{media.kind}</AppText></View></View>;
}

import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { addDays, addMinutes, format, setHours, setMinutes } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppointments, useBranches, useBranchProcedurePrices, useChairs, useCreateAppointment, usePatients, useProcedures, useStaff } from '@/hooks/useClinicQueries';
import { CalendarDays, Check, ChevronRight, Clock3, ContactRound, MessageCircle, Stethoscope } from '@/ui/icons';
import { AppText, Badge, Button, Chip, ErrorState, Field, LoadingState, PageHeader, ProgressBar, Screen, SectionHeader, Surface } from '@/ui/components';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';
import { useUIStore } from '@/store/uiStore';
import { useSessionStore } from '@/store/sessionStore';

const times = ['08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];

export function AppointmentBookingScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ patientId?: string }>();
  const toast = useUIStore((s) => s.showToast);
  const [step, setStep] = useState(0);
  const [patientId, setPatientId] = useState(params.patientId ?? '');
  const [patientSearch, setPatientSearch] = useState('');
  const [procedureId, setProcedureId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const activeBranchId = useSessionStore((state) => state.activeBranchId);
  const setActiveBranch = useSessionStore((state) => state.setActiveBranch);
  const [branchId, setBranchId] = useState(activeBranchId ?? '');
  const [chairId, setChairId] = useState('');
  const [selectedDate, setSelectedDate] = useState(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [note, setNote] = useState('');
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [requestDeposit, setRequestDeposit] = useState(false);
  const [deposit, setDeposit] = useState('');
  const patients = usePatients(); const procedures = useProcedures(); const staff = useStaff(); const branches = useBranches();
  const defaultBranchId = branches.data?.[0]?.id ?? '';
  const selectedBranchId = branchId || defaultBranchId;
  const branchPrices = useBranchProcedurePrices(selectedBranchId); const chairs = useChairs(selectedBranchId || undefined); const create = useCreateAppointment();
  const selectedChairId = chairs.data?.some((chair) => chair.id === chairId) ? chairId : (chairs.data?.[0]?.id ?? '');
  useEffect(() => { if (!activeBranchId && defaultBranchId) setActiveBranch(defaultBranchId); }, [activeBranchId, defaultBranchId, setActiveBranch]);
  const startsAt = useMemo(() => { const [h,m] = selectedTime.split(':').map(Number); return setMinutes(setHours(selectedDate, h || 0), m || 0); }, [selectedDate, selectedTime]);
  const appointments = useAppointments({ date: format(selectedDate, 'yyyy-MM-dd') });
  const procedure = procedures.data?.find((p) => p.id === procedureId);
  const branchPrice = branchPrices.data?.find((item) => item.procedureTypeId === procedureId && item.active);
  const duration = branchPrice?.durationMinutes ?? procedure?.defaultDurationMinutes ?? 30;
  const effectiveFee = branchPrice?.fee ?? procedure?.defaultFee ?? 0;
  const doctor = staff.data?.find((s) => s.id === doctorId);
  const patient = patients.data?.find((p) => p.id === patientId);
  const conflict = appointments.data?.some((a) => (a.doctorId === doctorId || a.chairId === selectedChairId) && startsAt.toISOString() < a.endsAt && addMinutes(startsAt, duration).toISOString() > a.startsAt);
  const canContinue = [Boolean(patientId), Boolean(procedureId), Boolean(doctorId && selectedTime && !conflict), true][step];
  const steps = ['Patient', 'Treatment', 'Availability', 'Confirm'];

  if (patients.isLoading || procedures.isLoading || staff.isLoading || branches.isLoading || chairs.isLoading || (Boolean(selectedBranchId) && branchPrices.isLoading)) return <Screen><LoadingState label="Preparing appointment workflow…" /></Screen>;
  if (patients.isError || procedures.isError || staff.isError || branches.isError || chairs.isError || branchPrices.isError) return <Screen><ErrorState onRetry={() => { patients.refetch(); procedures.refetch(); staff.refetch(); branches.refetch(); branchPrices.refetch(); chairs.refetch(); }} /></Screen>;

  const submit = async () => {
    if (!patient || !procedure || !doctor) return;
    try {
      const result = await create.mutateAsync({ patientId, procedureTypeId: procedureId, doctorId, chairId: selectedChairId, startsAt: startsAt.toISOString(), durationMinutes: duration, internalNote: note || undefined, sendWhatsapp, requestDeposit, depositAmount: requestDeposit ? Number(deposit || 0) : undefined });
      toast('Appointment created and workflow started', 'success');
      router.replace(`/appointment/${result.id}`);
    } catch (error) { toast(error instanceof Error ? error.message : 'Unable to create appointment', 'danger'); }
  };

  return <Screen>
    <PageHeader title="New appointment" subtitle={`${steps[step]} · Step ${step + 1} of 4`} onBack={() => step ? setStep(step - 1) : router.back()} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[4] }}>
      <ProgressBar value={(step + 1) * 25} tone="primary" />
      <View style={{ flexDirection: 'row', gap: spacing[2] }}>{steps.map((label, i) => <View key={label} style={{ flex: 1, alignItems: 'center', gap: 5 }}><View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: i <= step ? theme.colors.primary : theme.colors.surfaceTertiary, alignItems: 'center', justifyContent: 'center' }}>{i < step ? <Check size={15} color={theme.colors.textInverse} /> : <AppText variant="tiny" style={{ color: i <= step ? theme.colors.textInverse : theme.colors.textMuted }}>{i + 1}</AppText>}</View><AppText variant="tiny" tone={i === step ? 'primary' : 'muted'}>{label}</AppText></View>)}</View>

      {step === 0 ? <Surface style={{ gap: spacing[3] }}><SectionHeader title="Choose patient" subtitle="Search existing records or create a new intake" icon={ContactRound} /><Field label="Search patients" value={patientSearch} onChangeText={setPatientSearch} placeholder="Name, phone or patient number" /><View style={{ gap: spacing[2] }}>{patients.data?.filter((p) => [p.displayName, p.phone, p.patientNumber].join(' ').toLowerCase().includes(patientSearch.toLowerCase())).slice(0, 12).map((p) => <Pressable key={p.id} accessibilityRole="radio" accessibilityState={{ selected: patientId === p.id }} onPress={() => setPatientId(p.id)} style={{ minHeight: 58, padding: spacing[3], borderRadius: 14, borderWidth: patientId === p.id ? 2 : 1, borderColor: patientId === p.id ? theme.colors.primary : theme.colors.border, backgroundColor: patientId === p.id ? theme.colors.primarySoft : theme.colors.surface, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}><View style={{ flex: 1 }}><AppText variant="bodyStrong">{p.displayName}</AppText><AppText variant="caption" tone="secondary">{p.patientNumber} · {p.phone}</AppText></View>{p.medicalAlerts.length ? <Badge label="Medical alert" tone="danger" /> : null}</Pressable>)}</View><Button label="Create new patient" tone="secondary" onPress={() => router.push('/patient/new')} /></Surface> : null}

      {step === 1 ? <Surface style={{ gap: spacing[3] }}><SectionHeader title="Treatment and duration" subtitle="Smart defaults remain editable at confirmation" icon={Stethoscope} /><View style={{ gap: spacing[2] }}>{procedures.data?.map((p) => <Pressable key={p.id} accessibilityRole="radio" accessibilityState={{ selected: procedureId === p.id }} onPress={() => setProcedureId(p.id)} style={{ padding: spacing[4], borderRadius: 14, borderWidth: procedureId === p.id ? 2 : 1, borderColor: procedureId === p.id ? theme.colors.clinical : theme.colors.border, backgroundColor: procedureId === p.id ? theme.colors.clinicalSoft : theme.colors.surface, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}><View style={{ flex: 1 }}><AppText variant="bodyStrong">{p.name}</AppText><AppText variant="caption" tone="secondary">{p.category} · {(branchPrices.data?.find((price) => price.procedureTypeId === p.id && price.active)?.durationMinutes ?? p.defaultDurationMinutes)} min</AppText></View><Badge label={`₹${(branchPrices.data?.find((price) => price.procedureTypeId === p.id && price.active)?.fee ?? p.defaultFee).toLocaleString('en-IN')}`} tone={branchPrices.data?.some((price) => price.procedureTypeId === p.id && price.active) ? 'info' : 'neutral'} /></Pressable>)}</View></Surface> : null}

      {step === 2 ? <View style={{ gap: spacing[4] }}><Surface style={{ gap: spacing[3] }}><SectionHeader title="Select clinician" subtitle="Only available clinical staff are shown" icon={Stethoscope} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>{staff.data?.filter((s) => (s.role === 'dentist' || s.role === 'owner') && s.active).map((s) => <Chip key={s.id} label={`${s.name}${s.availability === 'busy' ? ' · Busy' : ''}`} selected={doctorId === s.id} onPress={() => setDoctorId(s.id)} />)}</View></Surface><Surface style={{ gap: spacing[3] }}><SectionHeader title="Date and time" subtitle="Conflicts are checked before confirmation" icon={Clock3} /><View style={{ flexDirection: 'row', gap: spacing[2] }}>{Array.from({ length: 5 }, (_, i) => addDays(new Date(), i + 1)).map((d) => <Pressable key={d.toISOString()} accessibilityRole="radio" accessibilityLabel={`Choose ${format(d, 'EEEE d MMMM')}`} accessibilityState={{ selected: format(d,'yyyy-MM-dd') === format(selectedDate,'yyyy-MM-dd') }} onPress={() => setSelectedDate(d)} style={{ flex: 1, minHeight: 64, borderRadius: 12, backgroundColor: format(d,'yyyy-MM-dd') === format(selectedDate,'yyyy-MM-dd') ? theme.colors.primary : theme.colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }}><AppText variant="tiny" style={{ color: format(d,'yyyy-MM-dd') === format(selectedDate,'yyyy-MM-dd') ? theme.colors.textInverse : theme.colors.textMuted }}>{format(d,'EEE')}</AppText><AppText variant="bodyStrong" style={{ color: format(d,'yyyy-MM-dd') === format(selectedDate,'yyyy-MM-dd') ? theme.colors.textInverse : theme.colors.text }}>{format(d,'d')}</AppText></Pressable>)}</View><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>{times.map((t) => { const [h,m] = t.split(':').map(Number); const start = setMinutes(setHours(selectedDate,h||0),m||0); const blocked = appointments.data?.some((a) => a.doctorId === doctorId && start.toISOString() < a.endsAt && addMinutes(start,duration).toISOString() > a.startsAt); return <Chip key={t} label={t} selected={selectedTime === t} disabled={blocked} onPress={() => setSelectedTime(t)} />; })}</View>{conflict ? <Surface tone="danger"><AppText variant="bodyStrong">This clinician already has an overlapping visit.</AppText><AppText tone="secondary">Choose another time or clinician before continuing.</AppText></Surface> : null}<View style={{ gap: spacing[2] }}><AppText variant="label">Branch</AppText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>{branches.data?.map((branch) => <Chip key={branch.id} label={branch.name} selected={selectedBranchId===branch.id} onPress={() => { setBranchId(branch.id); setActiveBranch(branch.id); setChairId(''); }} />)}</View><AppText variant="label">Chair or room</AppText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>{chairs.data?.map((chair) => <Chip key={chair.id} label={chair.room ? `${chair.name} · ${chair.room}` : chair.name} selected={selectedChairId===chair.id} onPress={() => setChairId(chair.id)} />)}</View></View></Surface></View> : null}

      {step === 3 ? <View style={{ gap: spacing[4] }}><Surface style={{ gap: spacing[3] }}><SectionHeader title="Appointment summary" subtitle="Verify before creating the workflow" icon={CalendarDays} /><Summary label="Patient" value={patient?.displayName ?? '—'} /><Summary label="Treatment" value={`${procedure?.name ?? '—'} · ${duration} min`} /><Summary label="Clinician" value={doctor?.name ?? '—'} /><Summary label="Time" value={format(startsAt, 'EEEE, d MMMM · h:mm a')} /><Summary label="Chair" value={chairs.data?.find((chair) => chair.id === selectedChairId)?.name ?? '—'} /><Summary label="Estimated fee" value={`₹${effectiveFee.toLocaleString('en-IN')}`} /></Surface><Surface style={{ gap: spacing[3] }}><SectionHeader title="Patient confirmation" subtitle="Use approved templates and recorded consent" icon={MessageCircle} /><ToggleRow label="Send WhatsApp confirmation" detail="Includes confirmation, reschedule and cancellation actions" value={sendWhatsapp} onPress={() => setSendWhatsapp(!sendWhatsapp)} /><ToggleRow label="Request deposit" detail="Payment link is prepared after booking" value={requestDeposit} onPress={() => setRequestDeposit(!requestDeposit)} />{requestDeposit ? <Field label="Deposit amount" value={deposit} onChangeText={setDeposit} keyboardType="numeric" placeholder="0" /> : null}<Field label="Internal preparation note" value={note} onChangeText={setNote} placeholder="Equipment, lab case or accessibility preparation" multiline /></Surface></View> : null}

      <View style={{ flexDirection: 'row', gap: spacing[3], paddingBottom: spacing[6] }}>{step > 0 ? <Button label="Back" tone="secondary" onPress={() => setStep(step - 1)} style={{ flex: 1 }} /> : null}<Button label={step === 3 ? 'Create appointment' : 'Continue'} icon={step === 3 ? Check : ChevronRight} disabled={!canContinue} loading={create.isPending} onPress={() => step === 3 ? submit() : setStep(step + 1)} style={{ flex: 2 }} /></View>
    </View>
  </Screen>;
}
function Summary({ label, value }: { label: string; value: string }) { return <View style={{ flexDirection: 'row', gap: spacing[3] }}><AppText tone="secondary" style={{ width: 105 }}>{label}</AppText><AppText variant="bodyStrong" tabular style={{ flex: 1 }}>{value}</AppText></View>; }
function ToggleRow({ label, detail, value, onPress }: { label: string; detail: string; value: boolean; onPress: () => void }) { const theme = useTheme(); return <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: 58 }}><View style={{ flex: 1 }}><AppText variant="bodyStrong">{label}</AppText><AppText variant="caption" tone="secondary">{detail}</AppText></View><View style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: value ? theme.colors.clinical : theme.colors.surfaceTertiary, padding: 3, alignItems: value ? 'flex-end' : 'flex-start' }}><View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.surface }} /></View></Pressable>; }

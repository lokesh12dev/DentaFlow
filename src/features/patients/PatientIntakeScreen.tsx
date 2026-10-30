import React, { useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, Check, ChevronLeft, ChevronRight, HeartPulse, Mail, Phone, ShieldCheck, UserRound, UsersRound } from '@/ui/icons';
import { AppText, Button, Chip, Field, PageHeader, ProgressBar, Screen, Surface } from '@/ui/components';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';
import { patientIntakeSchema } from '@/domain/validation';
import type { z } from 'zod';
import { useCreatePatient, useSetBookingRequestStatus } from '@/hooks/useClinicQueries';
import { useUIStore } from '@/store/uiStore';

type FormValues = z.infer<typeof patientIntakeSchema>;
const steps = ['Identity', 'Contact', 'Medical', 'Consent'] as const;

export function PatientIntakeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ firstName?: string; lastName?: string; phone?: string; email?: string; bookingRequestId?: string }>();
  const theme = useTheme();
  const createPatient = useCreatePatient();
  const updateBookingRequest = useSetBookingRequestStatus();
  const showToast = useUIStore((state) => state.showToast);
  const [step, setStep] = useState(0);
  const { control, handleSubmit, trigger, watch, setValue, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(patientIntakeSchema), defaultValues: { firstName: params.firstName ?? '', lastName: params.lastName ?? '', dateOfBirth: '', gender: 'undisclosed', phone: params.phone ?? '', email: params.email ?? '', preferredLanguage: 'English', preferredContact: 'whatsapp', whatsappConsent: false, photoConsent: false, medicalConditions: '', allergies: '', medications: '', emergencyName: '', emergencyRelationship: '', emergencyPhone: '' } });

  const next = async () => {
    const fields: Array<Array<keyof FormValues>> = [['firstName', 'lastName', 'dateOfBirth', 'gender'], ['phone', 'email', 'preferredLanguage', 'preferredContact'], ['medicalConditions', 'allergies', 'medications'], ['whatsappConsent', 'photoConsent']];
    if (!(await trigger(fields[step]!))) return;
    if (step < steps.length - 1) setStep((value) => value + 1); else handleSubmit(submit)();
  };

  const submit = async (values: FormValues) => {
    try {
      const patient = await createPatient.mutateAsync(values);
      if (params.bookingRequestId) {
        await updateBookingRequest.mutateAsync({ id: params.bookingRequestId, status: 'converted', patientId: patient.id });
      }
      showToast(`${patient.displayName} was added. Medical history still requires clinician verification.`, 'success');
      router.replace(`/patient/${patient.id}` as never);
    } catch (error) {
      const supabaseError = error as { code?: string; message?: string };
      if (supabaseError.code === '23505' || supabaseError.message?.includes('may already exist')) {
        showToast('A patient with this name and phone may already exist. Search existing patients before creating a new record.', 'warning');
        return;
      }
      showToast(error instanceof Error ? error.message : 'Patient could not be created.', 'danger');
    }
  };

  return <Screen bottomInset={false}>
    <PageHeader title="New patient intake" subtitle={`${steps[step]} · Step ${step + 1} of ${steps.length}`} onBack={() => router.back()} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[5] }}>
      <ProgressBar value={((step + 1) / steps.length) * 100} tone="clinical" label={steps[step]} />

      {step === 0 ? <Surface style={{ gap: spacing[4] }}><View style={{ gap: 2 }}><AppText variant="title2">Who is the patient?</AppText><AppText tone="secondary">Use legal identity details where available. These can be corrected later with an audit trail.</AppText></View><Controller control={control} name="firstName" render={({ field }) => <Field label="First name" value={field.value} onChangeText={field.onChange} icon={UserRound} error={errors.firstName?.message} />} /><Controller control={control} name="lastName" render={({ field }) => <Field label="Last name" value={field.value} onChangeText={field.onChange} icon={UserRound} error={errors.lastName?.message} />} /><Controller control={control} name="dateOfBirth" render={({ field }) => <Field label="Date of birth" value={field.value} onChangeText={field.onChange} placeholder="YYYY-MM-DD" icon={CalendarDays} error={errors.dateOfBirth?.message} />} /><View style={{ gap: spacing[2] }}><AppText variant="label">Gender</AppText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>{(['female', 'male', 'nonbinary', 'undisclosed'] as const).map((value) => <Chip key={value} label={value === 'undisclosed' ? 'Prefer not to say' : value[0]!.toUpperCase() + value.slice(1)} selected={watch('gender') === value} onPress={() => setValue('gender', value)} />)}</View></View></Surface> : null}

      {step === 1 ? <Surface style={{ gap: spacing[4] }}><View style={{ gap: 2 }}><AppText variant="title2">How should the clinic reach them?</AppText><AppText tone="secondary">Communication preference drives reminders, follow-ups, and fallback routing.</AppText></View><Controller control={control} name="phone" render={({ field }) => <Field label="Primary phone" value={field.value} onChangeText={field.onChange} icon={Phone} keyboardType="phone-pad" error={errors.phone?.message} />} /><Controller control={control} name="email" render={({ field }) => <Field label="Email" value={field.value} onChangeText={field.onChange} icon={Mail} keyboardType="email-address" autoCapitalize="none" error={errors.email?.message} />} /><Controller control={control} name="preferredLanguage" render={({ field }) => <Field label="Preferred language" value={field.value} onChangeText={field.onChange} helper="Used for message templates and consent documents." />} /><View style={{ gap: spacing[2] }}><AppText variant="label">Preferred contact</AppText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>{(['whatsapp', 'call', 'email', 'sms'] as const).map((value) => <Chip key={value} label={value === 'sms' ? 'SMS' : value[0]!.toUpperCase() + value.slice(1)} selected={watch('preferredContact') === value} onPress={() => setValue('preferredContact', value)} />)}</View></View><AppText variant="title3">Emergency contact</AppText><Controller control={control} name="emergencyName" render={({ field }) => <Field label="Name" value={field.value ?? ''} onChangeText={field.onChange} icon={UsersRound} />} /><Controller control={control} name="emergencyRelationship" render={({ field }) => <Field label="Relationship" value={field.value ?? ''} onChangeText={field.onChange} />} /><Controller control={control} name="emergencyPhone" render={({ field }) => <Field label="Emergency phone" value={field.value ?? ''} onChangeText={field.onChange} icon={Phone} keyboardType="phone-pad" />} /></Surface> : null}

      {step === 2 ? <Surface style={{ gap: spacing[4] }}><View style={{ gap: 2 }}><AppText variant="title2">Record safety-critical information</AppText><AppText tone="secondary">Reception can collect this information, but a clinician must verify it before treatment.</AppText></View><Controller control={control} name="allergies" render={({ field }) => <Field label="Allergies" value={field.value ?? ''} onChangeText={field.onChange} placeholder="Medication, latex, food, or other allergies" icon={HeartPulse} multiline />} /><Controller control={control} name="medicalConditions" render={({ field }) => <Field label="Medical conditions" value={field.value ?? ''} onChangeText={field.onChange} placeholder="Diabetes, hypertension, cardiac history…" icon={HeartPulse} multiline />} /><Controller control={control} name="medications" render={({ field }) => <Field label="Current medications" value={field.value ?? ''} onChangeText={field.onChange} placeholder="Separate medicines with commas" multiline />} /><Surface tone="warning"><View style={{ flexDirection: 'row', gap: spacing[3] }}><ShieldCheck size={21} color={theme.colors.warning} /><AppText tone="secondary" style={{ flex: 1 }}>This intake is saved as patient-reported information. DentaFlow keeps the verification state visible until a clinician confirms it.</AppText></View></Surface></Surface> : null}

      {step === 3 ? <Surface style={{ gap: spacing[4] }}><View style={{ gap: 2 }}><AppText variant="title2">Communication and media consent</AppText><AppText tone="secondary">Record only the permissions the patient actually grants. Consent can be withdrawn later.</AppText></View><ConsentToggle label="WhatsApp appointment communication" description="Send booking confirmations, reminders, intake links, receipts, and requested follow-ups." selected={watch('whatsappConsent')} onPress={() => setValue('whatsappConsent', !watch('whatsappConsent'))} /><ConsentToggle label="Clinical photography" description="Allow clinical photographs to be stored in the protected patient record." selected={watch('photoConsent')} onPress={() => setValue('photoConsent', !watch('photoConsent'))} /><Surface tone="secondary"><AppText variant="bodyStrong">What happens next</AppText><AppText tone="secondary">The app creates a patient number, marks medical history for verification, and opens the patient command centre. Procedure-specific consent remains separate.</AppText></Surface></Surface> : null}

      <View style={{ flexDirection: 'row', gap: spacing[3], paddingBottom: spacing[6] }}>
        {step > 0 ? <Button label="Back" tone="secondary" icon={ChevronLeft} onPress={() => setStep((value) => value - 1)} style={{ flex: 1 }} /> : null}
        <Button label={step === steps.length - 1 ? 'Create patient' : 'Continue'} icon={step === steps.length - 1 ? Check : ChevronRight} onPress={next} loading={createPatient.isPending} style={{ flex: 1 }} />
      </View>
    </View>
  </Screen>;
}

function ConsentToggle({ label, description, selected, onPress }: { label: string; description: string; selected: boolean; onPress: () => void }) {
  return <Surface tone={selected ? 'clinical' : 'secondary'}><Button label={selected ? 'Granted' : 'Not granted'} tone={selected ? 'clinical' : 'secondary'} icon={selected ? Check : ShieldCheck} onPress={onPress} /><AppText variant="bodyStrong">{label}</AppText><AppText tone="secondary">{description}</AppText></Surface>;
}

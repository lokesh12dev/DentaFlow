import { Share } from 'react-native';
import { requireSupabase } from '@/core/supabase';
import { useSessionStore } from '@/store/sessionStore';

export type PatientPortalScope = 'intake' | 'appointment-response' | 'payment' | 'consent';

export async function createPatientPortalLink(input: {
  patientId: string;
  appointmentId?: string;
  scope: PatientPortalScope;
  expiresInMinutes?: number;
}): Promise<{ url: string; expiresAt: string }> {
  const clinicId = useSessionStore.getState().activeClinicId;
  if (!clinicId) throw new Error('No active clinic is selected.');
  const { data, error } = await requireSupabase().functions.invoke('patient-link-create', {
    body: { clinicId, ...input }
  });
  if (error) throw error;
  if (!data?.url) throw new Error('A secure patient link could not be created.');
  return data as { url: string; expiresAt: string };
}

export async function sharePatientPortalLink(input: {
  patientName: string;
  patientId: string;
  appointmentId?: string;
  scope: PatientPortalScope;
  expiresInMinutes?: number;
}): Promise<{ url: string; expiresAt: string }> {
  const result = await createPatientPortalLink(input);
  const label = input.scope === 'intake' ? 'complete your secure patient intake' : input.scope === 'appointment-response' ? 'review your appointment' : input.scope === 'payment' ? 'review your payment request' : 'review your consent document';
  await Share.share({ message: `Hello ${input.patientName}, please ${label}: ${result.url}` });
  return result;
}

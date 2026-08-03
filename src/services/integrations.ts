import { requireSupabase } from '@/core/supabase';
import { openWhatsApp } from '@/core/linking';
import type { CommunicationChannel } from '@/domain/types';

export async function sendProviderMessage(input: {
  clinicId: string;
  patientId: string;
  channel: Exclude<CommunicationChannel, 'call' | 'internal'>;
  templateId?: string;
  body?: string;
  subject?: string;
  attachmentPath?: string;
  relatedAppointmentId?: string;
  requiresFollowUp?: boolean;
  followUpAt?: string;
  idempotencyKey?: string;
}): Promise<{ providerMessageId?: string; communicationId?: string; status: string }> {
  const functionName = input.channel === 'whatsapp' ? 'whatsapp-send' : input.channel === 'email' ? 'email-send' : 'sms-send';
  const { data, error } = await requireSupabase().functions.invoke(functionName, { body: input });
  if (error) throw error;
  return data as { providerMessageId?: string; communicationId?: string; status: string };
}

export async function startPhoneCall(input: {
  clinicId: string;
  patientId: string;
  phone: string;
  useCloudTelephony: boolean;
  body?: string;
  relatedAppointmentId?: string;
  requiresFollowUp?: boolean;
  followUpAt?: string;
}): Promise<void> {
  if (!input.useCloudTelephony) {
    const { callPhone } = await import('@/core/linking');
    await callPhone(input.phone);
    return;
  }
  const { error } = await requireSupabase().functions.invoke('telephony-call', { body: input });
  if (error) throw error;
}

export async function fallbackWhatsApp(phone: string, body: string): Promise<void> {
  await openWhatsApp(phone, body);
}

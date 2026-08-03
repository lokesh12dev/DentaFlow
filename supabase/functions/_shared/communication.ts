import type { RequestContext } from './auth.ts';
import { HttpError } from './http.ts';

export interface ProviderCommunicationInput {
  patientId: string;
  channel: 'call' | 'whatsapp' | 'email' | 'sms';
  status: 'queued' | 'sent' | 'completed';
  providerName: string;
  providerMessageId: string;
  phone?: string;
  email?: string;
  subject?: string;
  body?: string;
  relatedAppointmentId?: string;
  requiresFollowUp?: boolean;
  followUpAt?: string;
  idempotencyKey?: string;
}

export async function recordProviderCommunication(ctx: RequestContext, input: ProviderCommunicationInput): Promise<Record<string, unknown>> {
  const { data, error } = await ctx.serviceClient.rpc('record_provider_communication', {
    p_payload: {
      clinicId: ctx.clinicId,
      patientId: input.patientId,
      memberId: ctx.member.id,
      createdBy: ctx.user.id,
      channel: input.channel,
      status: input.status,
      providerName: input.providerName,
      providerMessageId: input.providerMessageId,
      phone: input.phone,
      email: input.email,
      subject: input.subject,
      body: input.body,
      relatedAppointmentId: input.relatedAppointmentId,
      requiresFollowUp: input.requiresFollowUp ?? false,
      followUpAt: input.followUpAt,
      idempotencyKey: input.idempotencyKey ?? input.providerMessageId
    }
  });
  if (error || !data) throw new HttpError(500, 'Delivery succeeded but the clinical communication transaction failed.', 'persistence_error');
  return data as Record<string, unknown>;
}

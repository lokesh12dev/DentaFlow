import { preflight, json, handleError, HttpError } from '../_shared/http.ts';
import { requireContext } from '../_shared/auth.ts';
import { fetchWithTimeout } from '../_shared/provider.ts';
import { recordProviderCommunication } from '../_shared/communication.ts';

Deno.serve(async (req) => {
  const options = preflight(req); if (options) return options;
  try {
    const body = await req.json();
    const ctx = await requireContext(req, body.clinicId, ['owner','manager','dentist','receptionist','assistant','billing']);
    const key = Deno.env.get('RESEND_API_KEY'); const from = Deno.env.get('EMAIL_FROM');
    if (!key || !from) throw new HttpError(503, 'Transactional email is not configured.', 'integration_not_configured');
    const { data: patient, error: patientError } = await ctx.userClient.from('patients').select('id,email,display_name').eq('clinic_id', ctx.clinicId).eq('id', body.patientId).single();
    if (patientError || !patient?.email) throw new HttpError(409, 'The patient does not have a valid email address.', 'missing_contact');
    const idempotencyKey = String(body.idempotencyKey ?? crypto.randomUUID());
    const response = await fetchWithTimeout('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ from, to: [patient.email], subject: String(body.subject ?? 'Message from your dental clinic').slice(0, 200), text: String(body.body ?? '').slice(0, 20000), attachments: body.attachments ?? undefined })
    });
    const result = await response.json();
    if (!result.id) throw new HttpError(502, 'Email provider did not return a delivery identifier.', 'provider_error');
    const communication = await recordProviderCommunication(ctx, {
      patientId: patient.id, channel: 'email', status: 'sent', providerName: 'resend', providerMessageId: result.id,
      email: patient.email, subject: body.subject, body: body.body, relatedAppointmentId: body.relatedAppointmentId,
      requiresFollowUp: body.requiresFollowUp, followUpAt: body.followUpAt, idempotencyKey
    });
    return json({ status: 'sent', providerMessageId: result.id, communicationId: communication.id });
  } catch (error) { return handleError(error); }
});

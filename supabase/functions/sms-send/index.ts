import { preflight, json, handleError, HttpError } from '../_shared/http.ts';
import { requireContext } from '../_shared/auth.ts';
import { fetchWithTimeout } from '../_shared/provider.ts';
import { recordProviderCommunication } from '../_shared/communication.ts';

Deno.serve(async (req) => {
  const options = preflight(req); if (options) return options;
  try {
    const body = await req.json();
    const ctx = await requireContext(req, body.clinicId, ['owner','manager','dentist','receptionist','assistant','billing']);
    const sid = Deno.env.get('TWILIO_ACCOUNT_SID'); const token = Deno.env.get('TWILIO_AUTH_TOKEN'); const from = Deno.env.get('TWILIO_FROM_NUMBER');
    if (!sid || !token || !from) throw new HttpError(503, 'SMS delivery is not configured.', 'integration_not_configured');
    const { data: patient, error: patientError } = await ctx.userClient.from('patients').select('id,phone,display_name').eq('clinic_id', ctx.clinicId).eq('id', body.patientId).single();
    if (patientError || !patient?.phone) throw new HttpError(409, 'The patient does not have a valid phone number.', 'missing_contact');
    const text = String(body.body ?? '').trim().slice(0, 1500);
    if (!text) throw new HttpError(400, 'SMS content is required.', 'invalid_request');
    const callback = `${Deno.env.get('SUPABASE_URL')}/functions/v1/provider-webhook?provider=twilio-message&clinicId=${ctx.clinicId}`;
    const params = new URLSearchParams({ To: patient.phone, From: from, Body: text, StatusCallback: callback });
    const response = await fetchWithTimeout(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST', headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString()
    });
    const result = await response.json();
    if (!result.sid) throw new HttpError(502, 'SMS provider did not return a delivery identifier.', 'provider_error');
    const communication = await recordProviderCommunication(ctx, {
      patientId: patient.id, channel: 'sms', status: 'queued', providerName: 'twilio-message', providerMessageId: result.sid,
      phone: patient.phone, body: text, relatedAppointmentId: body.relatedAppointmentId,
      requiresFollowUp: body.requiresFollowUp, followUpAt: body.followUpAt, idempotencyKey: body.idempotencyKey ?? result.sid
    });
    return json({ status: 'queued', providerMessageId: result.sid, communicationId: communication.id });
  } catch (error) { return handleError(error); }
});

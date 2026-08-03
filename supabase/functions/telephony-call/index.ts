import { preflight, json, handleError, HttpError } from '../_shared/http.ts';
import { requireContext } from '../_shared/auth.ts';
import { fetchWithTimeout } from '../_shared/provider.ts';
import { recordProviderCommunication } from '../_shared/communication.ts';

Deno.serve(async (req) => {
  const options = preflight(req); if (options) return options;
  try {
    const body = await req.json();
    const ctx = await requireContext(req, body.clinicId, ['owner','manager','dentist','receptionist','assistant','billing']);
    const sid = Deno.env.get('TWILIO_ACCOUNT_SID'); const token = Deno.env.get('TWILIO_AUTH_TOKEN'); const from = Deno.env.get('TWILIO_FROM_NUMBER'); const twimlUrl = Deno.env.get('TWILIO_TWIML_URL');
    if (!sid || !token || !from || !twimlUrl) throw new HttpError(503, 'Cloud telephony is not configured.', 'integration_not_configured');
    const { data: patient, error: patientError } = await ctx.userClient.from('patients').select('id,phone,display_name').eq('clinic_id', ctx.clinicId).eq('id', body.patientId).single();
    if (patientError || !patient) throw new HttpError(404, 'Patient was not found.', 'not_found');
    const params = new URLSearchParams({
      To: patient.phone, From: from, Url: twimlUrl,
      StatusCallback: `${Deno.env.get('SUPABASE_URL')}/functions/v1/provider-webhook?provider=twilio&clinicId=${ctx.clinicId}`,
      StatusCallbackEvent: 'initiated ringing answered completed'
    });
    const response = await fetchWithTimeout(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
      method: 'POST', headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString()
    });
    const result = await response.json();
    if (!result.sid) throw new HttpError(502, 'Telephony provider did not return a call identifier.', 'provider_error');
    const communication = await recordProviderCommunication(ctx, {
      patientId: patient.id, channel: 'call', status: 'queued', providerName: 'twilio', providerMessageId: result.sid,
      phone: patient.phone, body: body.body, relatedAppointmentId: body.relatedAppointmentId,
      requiresFollowUp: body.requiresFollowUp, followUpAt: body.followUpAt, idempotencyKey: body.idempotencyKey ?? result.sid
    });
    return json({ status: 'queued', providerCallId: result.sid, communicationId: communication.id });
  } catch (error) { return handleError(error); }
});

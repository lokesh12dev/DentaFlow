import { preflight, json, handleError, HttpError } from '../_shared/http.ts';
import { requireContext } from '../_shared/auth.ts';
import { fetchWithTimeout } from '../_shared/provider.ts';
import { recordProviderCommunication } from '../_shared/communication.ts';

Deno.serve(async (req) => {
  const options = preflight(req); if (options) return options;
  try {
    const body = await req.json();
    const ctx = await requireContext(req, body.clinicId, ['owner','manager','dentist','receptionist','assistant','billing']);
    const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    if (!token || !phoneId) throw new HttpError(503, 'WhatsApp Business is not configured.', 'integration_not_configured');
    const { data: patient, error: patientError } = await ctx.userClient.from('patients').select('id,phone,display_name,whatsapp_consent').eq('clinic_id', ctx.clinicId).eq('id', body.patientId).single();
    if (patientError || !patient) throw new HttpError(404, 'Patient was not found.', 'not_found');
    if (!patient.whatsapp_consent) throw new HttpError(409, 'WhatsApp consent is not recorded for this patient.', 'consent_required');
    if (!body.templateName && !String(body.body ?? '').trim()) throw new HttpError(400, 'Message content is required.', 'invalid_request');

    const to = String(patient.phone).replace(/\D/g, '');
    let providerBody: Record<string, unknown> = { messaging_product: 'whatsapp', to, type: 'text', text: { preview_url: false, body: String(body.body ?? '').slice(0, 4096) } };
    if (body.templateName) providerBody = { messaging_product: 'whatsapp', to, type: 'template', template: { name: body.templateName, language: { code: body.language ?? 'en' }, components: body.components ?? [] } };

    const response = await fetchWithTimeout(`https://graph.facebook.com/v23.0/${phoneId}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(providerBody)
    });
    const result = await response.json();
    const providerMessageId = result?.messages?.[0]?.id;
    if (!providerMessageId) throw new HttpError(502, 'WhatsApp did not return a delivery identifier.', 'provider_error');
    const communication = await recordProviderCommunication(ctx, {
      patientId: patient.id, channel: 'whatsapp', status: 'sent', providerName: 'meta', providerMessageId,
      phone: patient.phone, body: body.body, relatedAppointmentId: body.relatedAppointmentId,
      requiresFollowUp: body.requiresFollowUp, followUpAt: body.followUpAt, idempotencyKey: body.idempotencyKey
    });
    return json({ status: 'sent', providerMessageId, communicationId: communication.id });
  } catch (error) { return handleError(error); }
});

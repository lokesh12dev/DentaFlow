import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { preflight, json, handleError, HttpError } from '../_shared/http.ts';
import { hmacHex, timingSafeEqual, validateTwilioSignature } from '../_shared/security.ts';

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get('provider');
    const clinicId = url.searchParams.get('clinicId');
    if (provider === 'meta' && req.method === 'GET') {
      const token = url.searchParams.get('hub.verify_token');
      if (token !== Deno.env.get('WHATSAPP_VERIFY_TOKEN')) throw new HttpError(403, 'Verification token does not match.', 'forbidden');
      return new Response(url.searchParams.get('hub.challenge') ?? '', { status: 200 });
    }
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.', 'method_not_allowed');
    if (!provider || !clinicId) throw new HttpError(400, 'Provider and clinicId are required.', 'invalid_request');
    if (!['meta', 'twilio', 'twilio-message'].includes(provider)) throw new HttpError(400, 'Unsupported provider.', 'invalid_request');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !service) throw new HttpError(500, 'Server configuration is incomplete.', 'server_configuration');
    const db = createClient(supabaseUrl, service, { auth: { persistSession: false } });
    const raw = await req.text();

    if (provider === 'meta') {
      const secret = Deno.env.get('META_APP_SECRET');
      const provided = req.headers.get('x-hub-signature-256')?.replace('sha256=', '');
      if (!secret || !provided || !timingSafeEqual(await hmacHex(secret, raw), provided)) throw new HttpError(401, 'Webhook signature is invalid.', 'invalid_signature');
    }
    if (provider === 'twilio' || provider === 'twilio-message') {
      const token = Deno.env.get('TWILIO_AUTH_TOKEN');
      const provided = req.headers.get('x-twilio-signature');
      if (!token || !provided) throw new HttpError(401, 'Webhook signature is missing.', 'invalid_signature');
      const form = new URLSearchParams(raw);
      const publicBase = Deno.env.get('TWILIO_WEBHOOK_PUBLIC_URL');
      const publicUrl = publicBase ? `${publicBase}?provider=${provider}&clinicId=${clinicId}` : req.url;
      if (!await validateTwilioSignature(token, publicUrl, form, provided)) throw new HttpError(401, 'Webhook signature is invalid.', 'invalid_signature');
    }

    const payload = raw.startsWith('{') ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw));
    const eventId = provider === 'meta'
      ? payload?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.id ?? payload?.entry?.[0]?.id
      : provider === 'twilio-message' ? payload.MessageSid : payload.CallSid;
    if (!eventId) throw new HttpError(400, 'Provider event identifier is missing.', 'invalid_request');
    const eventType = provider === 'meta' ? 'whatsapp.status' : provider === 'twilio-message' ? `twilio-message.${payload.MessageStatus ?? 'event'}` : `twilio.${payload.CallStatus ?? 'event'}`;

    const { data: event, error: eventError } = await db.from('webhook_events').upsert({
      provider, provider_event_id: String(eventId), clinic_id: clinicId, event_type: eventType,
      payload, signature_verified: true, status: 'processing', attempts: 1
    }, { onConflict: 'provider,provider_event_id', ignoreDuplicates: true }).select().maybeSingle();
    if (eventError) throw eventError;
    if (!event) return json({ status: 'duplicate' });

    if (provider === 'meta') {
      const status = payload?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0];
      if (status?.id) {
        const mapped = status.status === 'delivered' ? 'delivered' : status.status === 'read' ? 'read' : status.status === 'failed' ? 'failed' : 'sent';
        await db.from('communications').update({ status: mapped }).eq('clinic_id', clinicId).eq('provider_name', 'meta').eq('provider_message_id', status.id);
      }
    }
    if (provider === 'twilio' && payload.CallSid) {
      const mapped = payload.CallStatus === 'completed' ? 'completed' : payload.CallStatus === 'no-answer' || payload.CallStatus === 'busy' || payload.CallStatus === 'failed' ? 'missed' : 'queued';
      await db.from('communications').update({
        status: mapped,
        call_duration_seconds: Number(payload.CallDuration || 0),
        call_outcome: payload.CallStatus === 'completed' ? 'answered' : payload.CallStatus === 'busy' ? 'busy' : 'no-answer',
        requires_follow_up: mapped === 'missed' ? true : undefined
      }).eq('clinic_id', clinicId).eq('provider_name', 'twilio').eq('provider_message_id', payload.CallSid);
    }
    if (provider === 'twilio-message' && payload.MessageSid) {
      const mapped = ['delivered'].includes(payload.MessageStatus) ? 'delivered' : ['read'].includes(payload.MessageStatus) ? 'read' : ['failed','undelivered'].includes(payload.MessageStatus) ? 'failed' : payload.MessageStatus === 'sent' ? 'sent' : 'queued';
      await db.from('communications').update({ status: mapped }).eq('clinic_id', clinicId).eq('provider_name', 'twilio-message').eq('provider_message_id', payload.MessageSid);
    }

    await db.from('webhook_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', event.id).eq('clinic_id', clinicId);
    return json({ status: 'processed' });
  } catch (error) { return handleError(error); }
});

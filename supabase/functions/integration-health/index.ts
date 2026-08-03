import { json, preflight, handleError, HttpError } from '../_shared/http.ts';
import { requireContext } from '../_shared/auth.ts';

const checks = [
  ['supabase', ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY']],
  ['whatsapp', ['WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_ACCESS_TOKEN','META_APP_SECRET','WHATSAPP_VERIFY_TOKEN']],
  ['email', ['RESEND_API_KEY','EMAIL_FROM']],
  ['telephony', ['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_FROM_NUMBER','TWILIO_WEBHOOK_PUBLIC_URL']],
  ['openrouter', ['OPENROUTER_API_KEY']],
  ['push', ['EXPO_ACCESS_TOKEN']]
] as const;
Deno.serve(async(req)=>{const early=preflight(req);if(early)return early;try{if(req.method!=='POST')throw new HttpError(405,'Method not allowed.','method_not_allowed');const body=await req.json();const ctx=await requireContext(req,String(body.clinicId??''),['owner','manager']);const results=[];for(const[provider,keys]of checks){const missing=keys.filter((key)=>!Deno.env.get(key));const status=missing.length?'disconnected':'connected';await ctx.serviceClient.from('integration_connections').upsert({clinic_id:ctx.clinicId,provider,status,last_checked_at:new Date().toISOString(),last_error:missing.length?`Missing ${missing.length} required secret(s)`:null,public_config:{required_secret_count:keys.length}},{onConflict:'clinic_id,provider'});results.push({provider,status,missingCount:missing.length,lastCheckedAt:new Date().toISOString()})}return json({integrations:results})}catch(error){return handleError(error)}});

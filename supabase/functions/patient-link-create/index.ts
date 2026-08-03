import { preflight,json,handleError,HttpError } from '../_shared/http.ts';
import { requireContext } from '../_shared/auth.ts';

Deno.serve(async(req)=>{const options=preflight(req);if(options)return options;try{
 const body=await req.json();const ctx=await requireContext(req,body.clinicId,['owner','manager','dentist','assistant','receptionist','billing']);const scope=String(body.scope??'');if(!['intake','appointment-response','payment','consent'].includes(scope))throw new HttpError(400,'Invalid portal scope.','invalid_scope');
 const {data:patient}=await ctx.userClient.from('patients').select('id').eq('clinic_id',ctx.clinicId).eq('id',body.patientId).maybeSingle();if(!patient)throw new HttpError(404,'Patient not found.','not_found');
 if(body.appointmentId){const {data:appointment}=await ctx.userClient.from('appointments').select('id').eq('clinic_id',ctx.clinicId).eq('patient_id',patient.id).eq('id',body.appointmentId).maybeSingle();if(!appointment)throw new HttpError(400,'Appointment does not belong to this patient.','invalid_request');}
 const bytes=crypto.getRandomValues(new Uint8Array(32));const token=btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');const hashBuffer=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));const tokenHash=[...new Uint8Array(hashBuffer)].map(v=>v.toString(16).padStart(2,'0')).join('');const expiresAt=new Date(Date.now()+Math.min(Math.max(Number(body.expiresInMinutes)||1440,15),10080)*60000).toISOString();
 const {error}=await ctx.serviceClient.from('patient_portal_tokens').insert({clinic_id:ctx.clinicId,patient_id:patient.id,appointment_id:body.appointmentId||null,token_hash:tokenHash,scope,expires_at:expiresAt,created_by:ctx.user.id});if(error)throw error;
 const base=Deno.env.get('PATIENT_PORTAL_URL')||Deno.env.get('APP_PUBLIC_URL')||'https://portal.example.com';return json({url:`${base.replace(/\/$/,'')}/${scope}?token=${encodeURIComponent(token)}`,expiresAt});
}catch(error){return handleError(error)}});

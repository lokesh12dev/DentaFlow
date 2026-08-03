import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { preflight, json, handleError, HttpError } from '../_shared/http.ts';

const phonePattern=/^[+0-9 ()-]{8,24}$/;
Deno.serve(async(req)=>{const options=preflight(req);if(options)return options;try{
  if(req.method!=='POST')throw new HttpError(405,'Method not allowed.','method_not_allowed');
  const body=await req.json(); if(body.company||body.website) return json({accepted:true},202);
  const publicSlug=String(body.publicSlug??'').trim();const requestedName=String(body.name??'').trim();const phone=String(body.phone??'').trim();
  if(publicSlug.length<3||requestedName.length<2||!phonePattern.test(phone)||body.consentToContact!==true)throw new HttpError(400,'Name, valid phone and contact consent are required.','invalid_request');
  const url=Deno.env.get('SUPABASE_URL');const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!url||!service)throw new HttpError(500,'Function environment is incomplete.','server_configuration');
  const client=createClient(url,service,{auth:{persistSession:false}});const {data:clinic,error:clinicError}=await client.from('clinics').select('id').eq('public_slug',publicSlug).eq('active',true).maybeSingle();if(clinicError||!clinic)throw new HttpError(404,'Clinic was not found.','not_found');
  const rawIp=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${rawIp}:${Deno.env.get('BOOKING_RATE_SALT')||'dentaflow'}`));const ipHash=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
  const since=new Date(Date.now()-3600000).toISOString();const {count}=await client.from('booking_requests').select('id',{count:'exact',head:true}).eq('ip_hash',ipHash).gte('created_at',since);if((count??0)>=8)throw new HttpError(429,'Too many booking requests. Please contact the clinic directly.','rate_limited');
  let branchId:string|undefined;if(body.branchId){const {data:branch}=await client.from('branches').select('id').eq('id',body.branchId).eq('clinic_id',clinic.id).eq('active',true).maybeSingle();branchId=branch?.id;}
  const payload={clinic_id:clinic.id,branch_id:branchId,requested_name:requestedName,phone,email:body.email?String(body.email).trim().slice(0,200):null,preferred_date:body.preferredDate||null,preferred_window:body.preferredWindow?String(body.preferredWindow).slice(0,100):null,reason:body.reason?String(body.reason).slice(0,2000):null,source:['website','whatsapp','qr','referral'].includes(body.source)?body.source:'website',consent_to_contact:true,ip_hash:ipHash,user_agent:(req.headers.get('user-agent')||'').slice(0,500)};
  const {data,error}=await client.from('booking_requests').insert(payload).select('id').single();if(error)throw error;
  const {data:assignee}=await client.from('clinic_members').select('id').eq('clinic_id',clinic.id).in('role',['receptionist','manager','owner']).eq('active',true).limit(1).maybeSingle();if(assignee)await client.from('tasks').insert({clinic_id:clinic.id,title:`New booking request: ${requestedName}`,description:payload.reason,assigned_to:assignee.id,priority:'normal',status:'open',category:'callback',due_at:new Date(Date.now()+30*60000).toISOString()});
  return json({accepted:true,requestId:data.id},202);
}catch(error){return handleError(error)}});

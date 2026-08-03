import { preflight, json, handleError, HttpError } from '../_shared/http.ts';
import { requireContext } from '../_shared/auth.ts';
import { deidentifyText } from '../_shared/security.ts';
import { fetchWithTimeout } from '../_shared/provider.ts';

type Action = 'structure-note'|'extract-document'|'summarize-history'|'check-missing-fields'|'history-question';
const allowed = new Set<Action>(['structure-note','extract-document','summarize-history','check-missing-fields','history-question']);

Deno.serve(async (req) => {
  const options = preflight(req); if (options) return options;
  try {
    const body = await req.json();
    const action = body.action as Action;
    if (!allowed.has(action)) throw new HttpError(400, 'Unsupported clinical assistant action.', 'invalid_action');
    const ctx = await requireContext(req, body.clinicId, ['owner','manager','dentist','assistant']);
    if (!body.patientId) throw new HttpError(400, 'patientId is required.', 'invalid_request');
    const { data: record, error } = await ctx.userClient.rpc('get_patient_record', { p_clinic_id: ctx.clinicId, p_patient_id: body.patientId });
    if (error || !record) throw new HttpError(404, 'Patient record was not found.', 'not_found');
    const patient = record.patient as Record<string, unknown>;
    const media = await loadClinicalMedia(ctx, body.patientId, body.mediaIds);
    const sources = [...buildSources(record), ...media.map((item) => ({ id:item.id, label:item.title, occurredAt:item.capturedAt }))];
    const sourceText = buildClinicalContext(record, action, body.text, body.question);
    const deidentified = deidentifyText(sourceText, String(patient.display_name ?? patient.displayName ?? ''));
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) throw new HttpError(503, 'OpenRouter is not configured for this clinic deployment.', 'integration_not_configured');
    const model = media.length ? (Deno.env.get('OPENROUTER_MULTIMODAL_MODEL') || Deno.env.get('OPENROUTER_MODEL') || 'openrouter/free') : (Deno.env.get('OPENROUTER_MODEL') || 'openrouter/free');
    const userContent: any[] = [{ type:'text', text:promptFor(action, deidentified, String(body.question ?? '')) }];
    for (const item of media) {
      if (item.inputType === 'image') userContent.push({ type:'image_url', image_url:{ url:item.url, detail:'high' } });
      if (item.inputType === 'audio') userContent.push({ type:'input_audio', input_audio:{ data:item.base64, format:item.format } });
      userContent.push({ type:'text', text:`Source media ${item.id}: ${item.title}. Treat extracted content as unverified until clinician review.` });
    }
    const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
      method:'POST', headers:{ Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','HTTP-Referer':Deno.env.get('APP_PUBLIC_URL')||'https://dentaflow.local','X-Title':'DentaFlow Clinical Documentation' },
      body:JSON.stringify({
        model, temperature:0.1, max_tokens:1600,
        provider:{ data_collection:'deny', zdr:true, allow_fallbacks:true },
        messages:[
          { role:'system', content:'You are a clinical documentation assistant for a licensed dental professional. Do not diagnose, prescribe, invent facts, or make treatment decisions. Use only supplied evidence. Mark uncertainty. Any OCR or media interpretation is a draft. Return strict JSON only.' },
          { role:'user', content:userContent }
        ],
        response_format:{ type:'json_object' }
      })
    }, 45_000);
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new HttpError(502, 'The clinical model returned an invalid response.', 'provider_response');
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(content); } catch { throw new HttpError(502, 'The clinical model response was not valid JSON.', 'provider_response'); }
    if (media.length) await ctx.serviceClient.from('clinical_media').update({ ai_status:'ready', ai_extracted_text:typeof parsed.extractedText==='string'?parsed.extractedText:null, ai_summary:typeof parsed.summary==='string'?parsed.summary:null }).eq('clinic_id',ctx.clinicId).eq('patient_id',body.patientId).in('id',media.map((item)=>item.id));
    if (action === 'history-question') return json({ answer:String(parsed.answer ?? 'No supported answer was returned.'), confidence:String(parsed.confidence ?? 'low'), sources:selectSources(sources, parsed.sourceIds), disclaimer:'Clinician verification required.' });
    return json({ ...parsed, uncertainties:Array.isArray(parsed.uncertainties)?parsed.uncertainties:[], sourceIds:selectSources(sources, parsed.sourceIds).map((s)=>s.id), reviewRequired:true, model });
  } catch (error) { return handleError(error); }
});

function buildSources(record: any) {
  return [
    ...(record.notes ?? []).map((x:any)=>({id:x.id,label:x.procedure_performed||x.procedurePerformed||x.findings||'Clinical note',occurredAt:x.created_at||x.createdAt})),
    ...(record.appointments ?? []).map((x:any)=>({id:x.id,label:`${x.procedure_name||x.procedureName} appointment`,occurredAt:x.starts_at||x.startsAt})),
    ...(record.consents ?? []).map((x:any)=>({id:x.id,label:x.template_name||x.templateName,occurredAt:x.signed_at||x.sent_at||x.created_at})),
    ...(record.payments ?? []).map((x:any)=>({id:x.id,label:x.receipt_number||x.receiptNumber,occurredAt:x.received_at||x.receivedAt}))
  ].filter((x:any)=>x.id&&x.occurredAt).slice(0,80);
}
function buildClinicalContext(record:any, action:Action, text?:string, question?:string){
  const safe={medicalAlerts:record.patient?.medical_alerts??record.patient?.medicalAlerts,medications:record.patient?.medications,notes:(record.notes??[]).slice(0,30),appointments:(record.appointments??[]).slice(0,30),teeth:record.teeth??[],treatmentPlans:record.treatment_plans??record.treatmentPlans??[],consents:record.consents??[],prescriptions:record.prescriptions??[]};
  return JSON.stringify({action,question,text,record:safe});
}
function promptFor(action:Action, context:string, question:string){
  if(action==='history-question') return `Answer this question using only the evidence. Question: ${question}\nEvidence: ${context}\nReturn {"answer":"...","confidence":"high|medium|low","sourceIds":["uuid"],"uncertainties":["..."]}.`;
  return `Perform ${action} on the evidence below. Do not infer diagnosis. Return keys chiefComplaint, medicalUpdate, examination, findings, assessment, procedurePerformed, anaesthetic, materials, medication, advice, followUp, uncertainties, sourceIds. Every unknown value must be an empty string or listed as an uncertainty. Evidence: ${context}`;
}
function selectSources(sources:any[], requested:unknown){const ids=Array.isArray(requested)?new Set(requested.map(String)):new Set<string>();const selected=sources.filter((s)=>ids.has(s.id));return (selected.length?selected:sources.slice(0,4)).slice(0,8);}

async function loadClinicalMedia(ctx:any, patientId:string, requested:unknown) {
  const ids=Array.isArray(requested)?requested.map(String).filter(Boolean).slice(0,4):[]; if(!ids.length)return [];
  const {data,error}=await ctx.serviceClient.from('clinical_media').select('id,title,storage_path,mime_type,size_bytes,captured_at').eq('clinic_id',ctx.clinicId).eq('patient_id',patientId).in('id',ids);
  if(error)throw new HttpError(400,'Clinical media could not be loaded.','media_error');
  const inputs:any[]=[];
  for(const row of data??[]){
    if(Number(row.size_bytes)>12*1024*1024)throw new HttpError(413,'A clinical source is too large for analysis.','media_too_large');
    if(String(row.mime_type).startsWith('image/')){const {data:signed,error:signedError}=await ctx.serviceClient.storage.from('clinical-media').createSignedUrl(row.storage_path,300);if(signedError||!signed?.signedUrl)throw new HttpError(400,'Clinical image could not be prepared.','media_error');inputs.push({id:row.id,title:row.title,capturedAt:row.captured_at,inputType:'image',url:signed.signedUrl});continue;}
    if(String(row.mime_type).startsWith('audio/')){const {data:file,error:downloadError}=await ctx.serviceClient.storage.from('clinical-media').download(row.storage_path);if(downloadError||!file)throw new HttpError(400,'Clinical audio could not be prepared.','media_error');const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);const mime=String(row.mime_type);inputs.push({id:row.id,title:row.title,capturedAt:row.captured_at,inputType:'audio',base64:btoa(binary),format:mime.includes('mpeg')?'mp3':mime.includes('wav')?'wav':'m4a'});continue;}
    throw new HttpError(400,'Only image and audio sources can be sent to the configured clinical model.','unsupported_media');
  }
  return inputs;
}

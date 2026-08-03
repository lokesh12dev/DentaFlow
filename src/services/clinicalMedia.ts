import * as Crypto from 'expo-crypto';
import { env } from '@/core/env';
import { requireSupabase } from '@/core/supabase';
import { useSessionStore } from '@/store/sessionStore';

export interface LocalClinicalSource { uri: string; kind: 'photo'|'document'|'audio'; mimeType?: string; title?: string; toothNumbers?: number[]; }
export async function uploadClinicalSources(patientId: string, appointmentId: string | undefined, sources: LocalClinicalSource[]): Promise<string[]> {
  if (!sources.length) return [];
  if (env.demoMode) return sources.map(() => Crypto.randomUUID());
  const clinicId=useSessionStore.getState().activeClinicId;if(!clinicId)throw new Error('No active clinic selected.');
  const supabase=requireSupabase();const user=(await supabase.auth.getUser()).data.user;if(!user)throw new Error('Authentication is required.');
  const member=(await supabase.from('clinic_members').select('id').eq('clinic_id',clinicId).eq('user_id',user.id).eq('active',true).single()).data;if(!member)throw new Error('Clinical membership was not found.');
  const ids:string[]=[];
  for(const source of sources){
    const id=Crypto.randomUUID();const mime=source.mimeType??(source.kind==='audio'?'audio/mp4':'image/jpeg');const ext=mime.includes('png')?'png':mime.includes('heic')?'heic':mime.includes('pdf')?'pdf':mime.includes('audio')?'m4a':'jpg';const path=`${clinicId}/${patientId}/${id}.${ext}`;
    const bytes=await fetch(source.uri).then((response)=>{if(!response.ok)throw new Error('Unable to read the selected clinical source.');return response.arrayBuffer()});
    const {error:uploadError}=await supabase.storage.from('clinical-media').upload(path,bytes,{contentType:mime,upsert:false,cacheControl:'3600'});if(uploadError)throw uploadError;
    const {error:insertError}=await supabase.from('clinical_media').insert({id,clinic_id:clinicId,patient_id:patientId,appointment_id:appointmentId,kind:source.kind,title:source.title??(source.kind==='audio'?'Visit voice note':'Clinical photograph'),storage_path:path,mime_type:mime,size_bytes:bytes.byteLength,tooth_numbers:source.toothNumbers??[],captured_by:member.id,ai_status:'queued',source_preserved:true});
    if(insertError){await supabase.storage.from('clinical-media').remove([path]);throw insertError;}ids.push(id);
  }
  return ids;
}

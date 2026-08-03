import { requireSupabase } from '@/core/supabase';

export interface ClinicalDraft {
  chiefComplaint?: string;
  medicalUpdate?: string;
  examination?: string;
  findings?: string;
  assessment?: string;
  procedurePerformed?: string;
  anaesthetic?: string;
  materials?: string;
  medication?: string;
  advice?: string;
  followUp?: string;
  uncertainties: string[];
  sourceIds: string[];
}

export async function generateClinicalDraft(input: {
  clinicId: string;
  patientId: string;
  appointmentId?: string;
  text?: string;
  mediaIds?: string[];
  action: 'structure-note' | 'extract-document' | 'summarize-history' | 'check-missing-fields';
}): Promise<ClinicalDraft> {
  const { data, error } = await requireSupabase().functions.invoke('openrouter-clinical-assist', { body: input });
  if (error) throw error;
  return data as ClinicalDraft;
}

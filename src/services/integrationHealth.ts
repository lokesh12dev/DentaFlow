import { env } from '@/core/env';
import { requireSupabase } from '@/core/supabase';
import { useSessionStore } from '@/store/sessionStore';
export interface IntegrationHealth { provider: string; status: 'connected'|'disconnected'|'degraded'|'error'; missingCount: number; lastCheckedAt: string; }
export async function checkIntegrationHealth(): Promise<IntegrationHealth[]> {
  if (env.demoMode) return [
    {provider:'supabase',status:'disconnected',missingCount:2,lastCheckedAt:new Date().toISOString()},
    {provider:'whatsapp',status:'disconnected',missingCount:4,lastCheckedAt:new Date().toISOString()},
    {provider:'email',status:'disconnected',missingCount:2,lastCheckedAt:new Date().toISOString()},
    {provider:'telephony',status:'disconnected',missingCount:4,lastCheckedAt:new Date().toISOString()},
    {provider:'openrouter',status:'disconnected',missingCount:1,lastCheckedAt:new Date().toISOString()},
    {provider:'push',status:'disconnected',missingCount:1,lastCheckedAt:new Date().toISOString()}
  ];
  const clinicId=useSessionStore.getState().activeClinicId;if(!clinicId)throw new Error('No active clinic selected.');
  const {data,error}=await requireSupabase().functions.invoke('integration-health',{body:{clinicId}});if(error)throw error;return data.integrations as IntegrationHealth[];
}

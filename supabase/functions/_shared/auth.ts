import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2';
import { HttpError } from './http.ts';

export interface RequestContext {
  user: User;
  userClient: SupabaseClient;
  serviceClient: SupabaseClient;
  clinicId: string;
  member: { id: string; role: string; name: string };
}

export async function requireContext(req: Request, clinicId?: string, allowedRoles?: string[]): Promise<RequestContext> {
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = req.headers.get('Authorization');
  if (!url || !anon || !service) throw new HttpError(500, 'Supabase function environment is incomplete.', 'server_configuration');
  if (!authorization?.startsWith('Bearer ')) throw new HttpError(401, 'Authentication is required.', 'unauthorized');
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) throw new HttpError(401, 'The session is invalid or expired.', 'unauthorized');
  if (!clinicId) throw new HttpError(400, 'clinicId is required.', 'invalid_request');
  const { data: member, error: memberError } = await userClient.from('clinic_members').select('id,role,name').eq('clinic_id', clinicId).eq('user_id', authData.user.id).eq('active', true).maybeSingle();
  if (memberError || !member) throw new HttpError(403, 'Clinic access is not allowed.', 'forbidden');
  if (allowedRoles?.length && !allowedRoles.includes(member.role)) throw new HttpError(403, 'This clinic role cannot perform the requested action.', 'forbidden');
  const serviceClient = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  return { user: authData.user, userClient, serviceClient, clinicId, member };
}

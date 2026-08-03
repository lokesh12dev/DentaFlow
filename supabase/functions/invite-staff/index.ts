import { json, preflight, handleError, HttpError } from '../_shared/http.ts';
import { requireContext } from '../_shared/auth.ts';

const ROLES = ['owner','manager','dentist','receptionist','assistant','billing'];
Deno.serve(async (req) => {
  const early = preflight(req); if (early) return early;
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.', 'method_not_allowed');
    const body = await req.json();
    const clinicId = String(body.clinicId ?? '');
    const ctx = await requireContext(req, clinicId, ['owner','manager']);
    const email = String(body.email ?? '').trim().toLowerCase();
    const name = String(body.name ?? '').trim();
    const role = String(body.role ?? '');
    if (!/^\S+@\S+\.\S+$/.test(email) || name.length < 2 || !ROLES.includes(role)) throw new HttpError(400, 'A valid name, email and role are required.', 'invalid_request');
    if (role === 'owner' && ctx.member.role !== 'owner') throw new HttpError(403, 'Only an owner can invite another owner.', 'forbidden');
    const redirectTo = Deno.env.get('STAFF_INVITE_REDIRECT_URL') ?? 'dentaflow://auth/callback';
    const { data: invited, error: inviteError } = await ctx.serviceClient.auth.admin.inviteUserByEmail(email, { redirectTo, data: { name, clinic_id: clinicId, clinic_role: role } });
    if (inviteError) throw inviteError;
    if (!invited.user) throw new HttpError(500, 'The invitation did not create a user.', 'invite_failed');
    await ctx.serviceClient.from('profiles').upsert({ id: invited.user.id, display_name: name, phone: body.phone ?? null }, { onConflict: 'id' });
    const initials = name.split(/\s+/).map((part: string) => part[0]).join('').slice(0,2).toUpperCase();
    const { data: member, error: memberError } = await ctx.serviceClient.from('clinic_members').upsert({ clinic_id: clinicId, user_id: invited.user.id, role, name, phone: body.phone ?? null, email, initials, active: true, invited_by: ctx.user.id }, { onConflict: 'clinic_id,user_id' }).select().single();
    if (memberError) throw memberError;
    return json(member, 201);
  } catch (error) { return handleError(error); }
});

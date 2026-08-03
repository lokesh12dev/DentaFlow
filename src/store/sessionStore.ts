import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { env } from '@/core/env';
import { secureStorage } from '@/core/secureStorage';
import { supabase } from '@/core/supabase';

interface SessionState {
  bootstrapped: boolean;
  session: Session | null;
  user: User | null;
  activeClinicId: string | null;
  activeBranchId: string | null;
  demoMode: boolean;
  configurationError: string | null;
  setActiveClinic: (id: string) => void;
  setActiveBranch: (id: string | null) => void;
  bootstrap: () => Promise<void>;
  signOut: () => Promise<void>;
}

const DEMO_CLINIC_ID = '10000000-0000-4000-8000-000000000001';

export const useSessionStore = create<SessionState>((set, get) => ({
  bootstrapped: false,
  session: null,
  user: null,
  activeClinicId: null,
  activeBranchId: null,
  demoMode: env.demoMode,
  configurationError: null,
  setActiveClinic: (id) => {
    void secureStorage.set('active-clinic-id', id);
    set({ activeClinicId: id });
  },
  setActiveBranch: (id) => {
    if (id) void secureStorage.set('active-branch-id', id);
    else void secureStorage.remove('active-branch-id');
    set({ activeBranchId: id });
  },
  bootstrap: async () => {
    if (get().bootstrapped) return;
    const [savedClinicId, savedBranchId] = await Promise.all([
      secureStorage.get('active-clinic-id'),
      secureStorage.get('active-branch-id')
    ]);
    if (!env.isSupabaseConfigured && !env.demoMode) {
      set({ bootstrapped: true, configurationError: env.configurationErrors.join(' '), demoMode: false });
      return;
    }
    if (env.demoMode || !supabase) {
      await secureStorage.set('active-clinic-id', DEMO_CLINIC_ID);
      set({ bootstrapped: true, activeClinicId: DEMO_CLINIC_ID, activeBranchId: savedBranchId, demoMode: true, configurationError: null });
      return;
    }
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    let activeClinicId = savedClinicId;
    if (session && !activeClinicId) {
      const membership = await supabase.from('clinic_members').select('clinic_id').eq('user_id', session.user.id).eq('active', true).order('created_at').limit(1).maybeSingle();
      activeClinicId = membership.data?.clinic_id ?? null;
      if (activeClinicId) await secureStorage.set('active-clinic-id', activeClinicId);
    }
    set({ bootstrapped: true, session, user: session?.user ?? null, activeClinicId, activeBranchId: savedBranchId, demoMode: false, configurationError: null });
    supabase.auth.onAuthStateChange((_event, nextSession) => set({ session: nextSession, user: nextSession?.user ?? null }));
  },
  signOut: async () => {
    if (supabase) await supabase.auth.signOut();
    await Promise.all([secureStorage.remove('active-clinic-id'), secureStorage.remove('active-branch-id')]);
    set({ session: null, user: null, activeClinicId: null, activeBranchId: null });
  }
}));

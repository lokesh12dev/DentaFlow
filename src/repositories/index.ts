import { env } from '@/core/env';
import type { ClinicRepository } from './clinicRepository';
import { demoRepository } from './demoRepository';
import { supabaseRepository } from './supabaseRepository';

export const clinicRepository: ClinicRepository = env.demoMode ? demoRepository : supabaseRepository;
export * from './clinicRepository';

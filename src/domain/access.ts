import type { ClinicRole } from './types';

export type Permission =
  | 'patient.read' | 'patient.create' | 'patient.manage'
  | 'appointment.read' | 'appointment.manage'
  | 'waiting.read' | 'waiting.manage'
  | 'communication.read' | 'communication.compose' | 'communication.manage'
  | 'clinical.read' | 'clinical.draft' | 'clinical.sign' | 'prescription.create'
  | 'consent.read' | 'consent.manage' | 'media.read' | 'media.manage'
  | 'treatment.read' | 'treatment.manage'
  | 'billing.read' | 'billing.manage' | 'refund.create'
  | 'recall.read' | 'recall.manage'
  | 'laboratory.read' | 'laboratory.manage'
  | 'inventory.read' | 'inventory.manage'
  | 'task.read' | 'task.manage'
  | 'template.read' | 'template.manage'
  | 'report.read' | 'team.manage' | 'branch.manage'
  | 'automation.manage' | 'integration.manage' | 'audit.read' | 'settings.manage';

const allRoles: ClinicRole[] = ['owner', 'manager', 'dentist', 'receptionist', 'assistant', 'billing'];
const administrators: ClinicRole[] = ['owner', 'manager'];
const clinical: ClinicRole[] = ['owner', 'manager', 'dentist', 'assistant'];
const operators: ClinicRole[] = ['owner', 'manager', 'dentist', 'receptionist', 'assistant'];

const grants: Record<Permission, readonly ClinicRole[]> = {
  'patient.read': allRoles,
  'patient.create': ['owner', 'manager', 'receptionist'],
  'patient.manage': ['owner', 'manager', 'receptionist'],
  'appointment.read': allRoles,
  'appointment.manage': operators,
  'waiting.read': allRoles,
  'waiting.manage': operators,
  'communication.read': allRoles,
  'communication.compose': allRoles,
  'communication.manage': allRoles,
  'clinical.read': clinical,
  'clinical.draft': ['dentist', 'assistant'],
  'clinical.sign': ['dentist'],
  'prescription.create': ['dentist'],
  'consent.read': operators,
  'consent.manage': operators,
  'media.read': clinical,
  'media.manage': ['dentist', 'assistant'],
  'treatment.read': allRoles,
  'treatment.manage': ['owner', 'manager', 'dentist', 'assistant'],
  'billing.read': ['owner', 'manager', 'dentist', 'receptionist', 'billing'],
  'billing.manage': ['owner', 'manager', 'receptionist', 'billing'],
  'refund.create': ['owner', 'manager', 'billing'],
  'recall.read': allRoles,
  'recall.manage': allRoles,
  'laboratory.read': ['owner', 'manager', 'dentist', 'receptionist', 'assistant'],
  'laboratory.manage': ['owner', 'manager', 'dentist', 'assistant'],
  'inventory.read': ['owner', 'manager', 'dentist', 'assistant'],
  'inventory.manage': ['owner', 'manager', 'assistant'],
  'task.read': allRoles,
  'task.manage': allRoles,
  'template.read': ['owner', 'manager', 'dentist', 'receptionist', 'assistant'],
  'template.manage': ['owner', 'manager', 'dentist'],
  'report.read': ['owner', 'manager', 'dentist', 'billing'],
  'team.manage': administrators,
  'branch.manage': administrators,
  'automation.manage': administrators,
  'integration.manage': administrators,
  'audit.read': administrators,
  'settings.manage': administrators,
};

export const can = (role: ClinicRole, permission: Permission) => grants[permission].includes(role);

export type StaffHomeProfile = {
  title: string;
  focus: 'reception' | 'clinical' | 'assistant' | 'billing' | 'oversight';
  context: (input: { appointments: number; chair?: string; overdue: string; branch: string }) => string;
};

export const STAFF_HOME: Record<ClinicRole, StaffHomeProfile> = {
  receptionist: { title: 'Today', focus: 'reception', context: ({ branch }) => branch },
  dentist: { title: 'Your day', focus: 'clinical', context: ({ appointments, chair }) => `${appointments} appointments${chair ? ` · ${chair}` : ''}` },
  assistant: { title: 'Chair prep', focus: 'assistant', context: ({ appointments }) => `${appointments} visits to prepare` },
  billing: { title: 'Collections', focus: 'billing', context: ({ overdue }) => `${overdue} overdue` },
  manager: { title: 'Clinic pulse', focus: 'oversight', context: ({ branch }) => branch },
  owner: { title: 'Clinic pulse', focus: 'oversight', context: ({ branch }) => branch },
};

export const MODULE_PERMISSION_BY_PATH: Record<string, Permission> = {
  '/waiting-room': 'waiting.read',
  '/tasks': 'task.read',
  '/recalls': 'recall.read',
  '/treatment-pipeline': 'treatment.read',
  '/billing': 'billing.read',
  '/reports': 'report.read',
  '/laboratory': 'laboratory.read',
  '/inventory': 'inventory.read',
  '/templates': 'template.read',
  '/team': 'team.manage',
  '/branches': 'branch.manage',
  '/automations': 'automation.manage',
  '/integrations': 'integration.manage',
  '/audit': 'audit.read',
  '/settings': 'settings.manage',
};

export function requiredPermissionForPath(pathname: string): Permission | undefined {
  const normalized = pathname.replace(/^\/\(modules\)/, '').replace(/\/$/, '') || '/';
  return MODULE_PERMISSION_BY_PATH[normalized];
}

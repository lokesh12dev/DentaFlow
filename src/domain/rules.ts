import type { AppointmentReadiness, AppointmentStatus, InvoiceItem, InvoiceStatus, MedicalAlert, Payment, RiskLevel, TreatmentPlanItem } from './types';

export const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  draft: ['requested', 'awaiting-confirmation', 'confirmed', 'cancelled'],
  requested: ['awaiting-confirmation', 'confirmed', 'cancelled'],
  'awaiting-confirmation': ['confirmed', 'cancelled', 'no-show'],
  confirmed: ['checked-in', 'cancelled', 'no-show'],
  'checked-in': ['waiting', 'in-chair', 'cancelled'],
  waiting: ['in-chair', 'cancelled', 'no-show'],
  'in-chair': ['paused', 'completed', 'needs-follow-up'],
  paused: ['in-chair', 'needs-follow-up', 'cancelled'],
  completed: ['needs-follow-up'],
  'needs-follow-up': ['completed'],
  cancelled: [],
  'no-show': ['requested', 'confirmed']
};

export function canTransitionAppointment(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return APPOINTMENT_TRANSITIONS[from].includes(to);
}

export function getNextAppointmentActions(status: AppointmentStatus): AppointmentStatus[] {
  return [...APPOINTMENT_TRANSITIONS[status]];
}

type LineTotalInput =
  | Pick<InvoiceItem, 'quantity' | 'unitPrice' | 'discount' | 'tax'>
  | Pick<TreatmentPlanItem, 'quantity' | 'unitFee' | 'discount' | 'tax'>;

export function calculateLineTotal(input: LineTotalInput): number {
  const unit = 'unitPrice' in input ? input.unitPrice : input.unitFee;
  const subtotal = Math.max(0, input.quantity) * Math.max(0, unit);
  const afterDiscount = Math.max(0, subtotal - Math.max(0, input.discount));
  return roundMoney(afterDiscount + Math.max(0, input.tax));
}

export function calculateInvoiceBalance(total: number, payments: Pick<Payment, 'amount' | 'status' | 'refundAmount'>[]): number {
  const paid = payments.reduce((sum, payment) => {
    if (payment.status !== 'completed' && payment.status !== 'partially-refunded') return sum;
    return sum + payment.amount - (payment.refundAmount ?? 0);
  }, 0);
  return roundMoney(Math.max(0, total - paid));
}

export function deriveInvoiceStatus(total: number, balance: number, dueAt?: string, now = new Date()): InvoiceStatus {
  if (total <= 0) return 'draft';
  if (balance <= 0) return 'paid';
  if (balance < total) return dueAt && new Date(dueAt) < now ? 'overdue' : 'partial';
  return dueAt && new Date(dueAt) < now ? 'overdue' : 'issued';
}

export function readinessScore(readiness: AppointmentReadiness): number {
  const values = Object.values(readiness);
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

export function highestMedicalRisk(alerts: MedicalAlert[]): RiskLevel {
  const score: Record<RiskLevel, number> = { none: 0, low: 1, moderate: 2, high: 3, critical: 4 };
  return alerts.reduce<RiskLevel>((current, alert) => (score[alert.severity] > score[current] ? alert.severity : current), 'none');
}

export function requiresClinicalVerification(readiness: AppointmentReadiness): boolean {
  return !readiness.medicalHistoryVerified || !readiness.intakeComplete;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function normalizePhone(input: string, defaultCountryCode = '+91'): string {
  const stripped = input.replace(/[^\d+]/g, '');
  if (stripped.startsWith('+')) return stripped;
  if (stripped.startsWith('0')) return `${defaultCountryCode}${stripped.slice(1)}`;
  return `${defaultCountryCode}${stripped}`;
}

export function maskPatientName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1)}${'*'.repeat(Math.max(1, part.length - 1))}`)
    .join(' ');
}

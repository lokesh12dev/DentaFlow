import type { Appointment, AppointmentReadiness, AppointmentStatus, ClinicalNoteStatus, ConsentStatus, Invoice, InvoiceItem, InvoiceStatus, MedicalAlert, Patient, Payment, RiskLevel, Task, TreatmentPlan, TreatmentPlanItem } from './types';

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

export type AnalyticsRangeKey = '7d' | '30d' | '90d' | 'all-loaded';

export const ANALYTICS_RANGE_LABELS: Record<AnalyticsRangeKey, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  'all-loaded': 'All loaded records'
};

export function analyticsWindow(range: AnalyticsRangeKey, now = new Date()): { start: Date | null; end: Date; label: string } {
  if (range === 'all-loaded') {
    return { start: null, end: now, label: `All records currently loaded, as of ${now.toISOString().slice(0, 10)}` };
  }
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { start, end: now, label: `${ANALYTICS_RANGE_LABELS[range]} ending ${now.toISOString().slice(0, 10)}` };
}

function isInWindow(iso: string | undefined, start: Date | null, end: Date): boolean {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return false;
  if (start && time < start.getTime()) return false;
  return time <= end.getTime();
}

const SCHEDULED_STATUSES: AppointmentStatus[] = [
  'awaiting-confirmation', 'confirmed', 'checked-in', 'waiting', 'in-chair', 'paused', 'completed', 'needs-follow-up', 'cancelled', 'no-show'
];

export function buildClinicAnalytics(input: {
  appointments: Appointment[];
  invoices: Invoice[];
  payments?: Payment[];
  plans: TreatmentPlan[];
  tasks: Task[];
  patients?: Patient[];
  range: AnalyticsRangeKey;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const window = analyticsWindow(input.range, now);
  const appointments = input.appointments.filter((item) => isInWindow(item.startsAt, window.start, window.end) && SCHEDULED_STATUSES.includes(item.status));
  const completed = appointments.filter((item) => item.status === 'completed' || item.status === 'needs-follow-up').length;
  const cancelled = appointments.filter((item) => item.status === 'cancelled').length;
  const noShow = appointments.filter((item) => item.status === 'no-show').length;
  const denominator = appointments.length;
  const utilization = denominator ? (completed / denominator) * 100 : 0;
  const cancellationRate = denominator ? (cancelled / denominator) * 100 : 0;
  const noShowRate = denominator ? (noShow / denominator) * 100 : 0;

  const followUps = input.tasks.filter((task) => ['callback', 'clinical', 'recall'].includes(task.category) && isInWindow(task.dueAt ?? task.createdAt, window.start, window.end));
  const followUpsDone = followUps.filter((task) => task.status === 'done').length;
  const followUpCompletion = followUps.length ? (followUpsDone / followUps.length) * 100 : 0;

  const payments = (input.payments ?? []).filter((payment) => isInWindow(payment.receivedAt, window.start, window.end) && (payment.status === 'completed' || payment.status === 'partially-refunded' || payment.status === 'refunded'));
  const collections = roundMoney(payments.reduce((sum, payment) => sum + payment.amount - (payment.refundAmount ?? 0), 0));
  const outstanding = roundMoney(input.invoices.reduce((sum, invoice) => {
    if (['voided', 'draft'].includes(invoice.status)) return sum;
    return sum + Math.max(0, invoice.balance);
  }, 0));
  const overdue = roundMoney(input.invoices.filter((invoice) => invoice.status === 'overdue').reduce((sum, invoice) => sum + invoice.balance, 0));

  const plans = input.plans.filter((plan) => isInWindow(plan.createdAt, window.start, window.end) || input.range === 'all-loaded');
  const proposedValue = roundMoney(plans.reduce((sum, plan) => sum + plan.total, 0));
  const acceptedPlans = plans.filter((plan) => !['proposed', 'estimate-shared', 'declined'].includes(plan.stage));
  const acceptedValue = roundMoney(acceptedPlans.reduce((sum, plan) => sum + plan.total, 0));
  const declinedValue = roundMoney(plans.filter((plan) => plan.stage === 'declined').reduce((sum, plan) => sum + plan.total, 0));
  const acceptanceRate = proposedValue ? (acceptedValue / proposedValue) * 100 : 0;

  const patients = input.patients ?? [];
  const recallDue = patients.filter((patient) => patient.recallStatus === 'due' || patient.recallStatus === 'overdue' || patient.recallStatus === 'due-soon').length;
  const recallScheduled = patients.filter((patient) => patient.recallStatus === 'scheduled').length;
  const recallCompletion = recallDue + recallScheduled ? (recallScheduled / (recallDue + recallScheduled)) * 100 : 0;

  return {
    window,
    appointmentCount: denominator,
    completed,
    cancelled,
    noShow,
    utilization,
    cancellationRate,
    noShowRate,
    followUps: followUps.length,
    followUpsDone,
    followUpCompletion,
    collections,
    outstanding,
    overdue,
    proposedValue,
    acceptedValue,
    declinedValue,
    acceptanceRate,
    recallDue,
    recallScheduled,
    recallCompletion,
    definitions: {
      utilization: 'Completed or needs-follow-up visits ÷ scheduled appointments that start in the window (excludes draft and unconfirmed requests).',
      cancellationRate: 'Cancelled visits ÷ the same scheduled-appointment denominator.',
      noShowRate: 'No-show visits ÷ the same scheduled-appointment denominator.',
      followUpCompletion: 'Tasks in callback, clinical, or recall categories marked done ÷ those tasks due or created in the window.',
      collections: 'Net payments (amount minus refunds) received in the window with completed, refunded, or partially refunded status.',
      outstanding: 'Point-in-time sum of invoice balances, excluding draft and voided invoices. Not limited to the selected window.',
      acceptanceRate: 'Total value of plans past proposal/estimate/declined ÷ total plan value created in the window (or all loaded plans).',
      recallCompletion: 'Patients currently marked scheduled ÷ patients currently due, due soon, overdue, or scheduled. Point-in-time, not windowed.'
    }
  };
}

export const CLINICAL_NOTE_STATUS_TRANSITIONS: Record<ClinicalNoteStatus, readonly ClinicalNoteStatus[]> = {
  draft: ['review-required', 'signed'],
  'review-required': ['signed'],
  signed: ['amended'],
  amended: [],
};

export const CONSENT_STATUS_TRANSITIONS: Record<ConsentStatus, readonly ConsentStatus[]> = {
  draft: ['sent', 'declined', 'withdrawn'],
  sent: ['signed', 'declined', 'withdrawn', 'expired'],
  signed: ['withdrawn', 'expired'],
  declined: [],
  withdrawn: [],
  expired: [],
};

export function canTransitionClinicalNote(from: ClinicalNoteStatus, to: ClinicalNoteStatus): boolean {
  return CLINICAL_NOTE_STATUS_TRANSITIONS[from].includes(to);
}

export function canTransitionConsent(from: ConsentStatus, to: ConsentStatus): boolean {
  return CONSENT_STATUS_TRANSITIONS[from].includes(to);
}

/** Splits total GST into CGST + SGST (50/50 for intrastate default Tamil Nadu). */
export function computeGstSplit(totalTax: number): { cgst: number; sgst: number } {
  const cgst = roundMoney(totalTax / 2);
  const sgst = roundMoney(totalTax - cgst);
  return { cgst, sgst };
}

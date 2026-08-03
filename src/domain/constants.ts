import type { AppointmentStatus, ClinicRole, CommunicationChannel, PaymentMethod, TreatmentStage } from './types';

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  draft: 'Draft',
  requested: 'Requested',
  'awaiting-confirmation': 'Awaiting confirmation',
  confirmed: 'Confirmed',
  'checked-in': 'Checked in',
  waiting: 'Waiting',
  'in-chair': 'In chair',
  paused: 'Treatment paused',
  completed: 'Completed',
  'needs-follow-up': 'Needs follow-up',
  cancelled: 'Cancelled',
  'no-show': 'No-show'
};

export const ROLE_LABELS: Record<ClinicRole, string> = {
  owner: 'Owner',
  dentist: 'Dentist',
  receptionist: 'Receptionist',
  assistant: 'Dental assistant',
  billing: 'Billing',
  manager: 'Practice manager'
};

export const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  call: 'Call',
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS',
  internal: 'Internal note'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  'bank-transfer': 'Bank transfer',
  'payment-link': 'Payment link',
  insurance: 'Insurance',
  credit: 'Clinic credit',
  installment: 'Installment'
};

export const TREATMENT_STAGE_LABELS: Record<TreatmentStage, string> = {
  proposed: 'Proposed',
  'estimate-shared': 'Estimate shared',
  'awaiting-consent': 'Awaiting consent',
  'awaiting-payment': 'Awaiting payment',
  'not-booked': 'Not booked',
  started: 'Started',
  paused: 'Paused',
  completed: 'Completed',
  declined: 'Declined'
};

export const TOOTH_NUMBERS = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38
] as const;

export const COMMON_PROCEDURES = [
  { code: 'CONSULT', name: 'Consultation', duration: 30 },
  { code: 'CLEAN', name: 'Scaling and polishing', duration: 45 },
  { code: 'FILL', name: 'Composite filling', duration: 45 },
  { code: 'RCT', name: 'Root canal treatment', duration: 75 },
  { code: 'EXTRACT', name: 'Extraction', duration: 45 },
  { code: 'CROWN', name: 'Crown preparation', duration: 60 },
  { code: 'IMPLANT', name: 'Implant consultation', duration: 45 },
  { code: 'ORTHO', name: 'Orthodontic review', duration: 30 },
  { code: 'EMERGENCY', name: 'Emergency pain visit', duration: 30 }
] as const;

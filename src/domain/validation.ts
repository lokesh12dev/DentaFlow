import { z } from 'zod';

export const patientIntakeSchema = z.object({
  firstName: z.string().trim().min(2, 'Enter the first name'),
  lastName: z.string().trim().min(1, 'Enter the last name'),
  dateOfBirth: z.string().min(8, 'Enter a valid date of birth'),
  gender: z.enum(['female', 'male', 'nonbinary', 'undisclosed']),
  phone: z.string().trim().min(8, 'Enter a valid phone number'),
  email: z.string().trim().email('Enter a valid email').or(z.literal('')),
  preferredLanguage: z.string().trim().min(2),
  preferredContact: z.enum(['whatsapp', 'call', 'email', 'sms']),
  whatsappConsent: z.boolean(),
  photoConsent: z.boolean(),
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyRelationship: z.string().optional(),
  emergencyPhone: z.string().optional()
});

export const appointmentSchema = z.object({
  patientId: z.string().uuid(),
  procedureTypeId: z.string().uuid(),
  doctorId: z.string().uuid(),
  chairId: z.string().uuid(),
  startsAt: z.string().datetime(),
  durationMinutes: z.number().int().min(10).max(480),
  internalNote: z.string().max(2000).optional(),
  sendWhatsapp: z.boolean(),
  requestDeposit: z.boolean(),
  depositAmount: z.number().min(0).optional()
});

export const clinicalNoteSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  chiefComplaint: z.string().max(4000).optional(),
  medicalUpdate: z.string().max(4000).optional(),
  examination: z.string().max(8000).optional(),
  findings: z.string().max(8000).optional(),
  assessment: z.string().max(8000).optional(),
  procedurePerformed: z.string().max(8000).optional(),
  anaesthetic: z.string().max(4000).optional(),
  materials: z.string().max(4000).optional(),
  medication: z.string().max(4000).optional(),
  advice: z.string().max(8000).optional(),
  followUp: z.string().max(4000).optional(),
  toothNumbers: z.array(z.number().int().min(11).max(88)),
  status: z.enum(['draft', 'review-required', 'signed'])
});

export const paymentSchema = z.object({
  patientId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  amount: z.number().positive(),
  method: z.enum(['cash', 'card', 'upi', 'bank-transfer', 'payment-link', 'insurance', 'credit', 'installment']),
  reference: z.string().max(200).optional(),
  sendReceipt: z.boolean()
});

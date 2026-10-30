export type UUID = string;
export type ISODate = string;
export type ISODateTime = string;

export type ClinicRole = 'owner' | 'dentist' | 'receptionist' | 'assistant' | 'billing' | 'manager';
export type Gender = 'female' | 'male' | 'nonbinary' | 'undisclosed';
export type ContactPreference = 'whatsapp' | 'call' | 'email' | 'sms';
export type RiskLevel = 'none' | 'low' | 'moderate' | 'high' | 'critical';
export type AppointmentStatus =
  | 'draft'
  | 'requested'
  | 'awaiting-confirmation'
  | 'confirmed'
  | 'checked-in'
  | 'waiting'
  | 'in-chair'
  | 'paused'
  | 'completed'
  | 'needs-follow-up'
  | 'cancelled'
  | 'no-show';
export type AppointmentView = 'day' | 'week' | 'doctor' | 'chair';
export type CommunicationChannel = 'call' | 'whatsapp' | 'email' | 'sms' | 'internal';
export type CommunicationDirection = 'inbound' | 'outbound' | 'internal';
export type CommunicationStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'completed' | 'missed';
export type TaskStatus = 'open' | 'in-progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ClinicalNoteStatus = 'draft' | 'review-required' | 'signed' | 'amended';
export type MediaKind = 'photo' | 'xray' | 'scan' | 'document' | 'audio' | 'receipt' | 'consent';
export type TreatmentStage = 'proposed' | 'estimate-shared' | 'awaiting-consent' | 'awaiting-payment' | 'not-booked' | 'started' | 'paused' | 'completed' | 'declined';
export type InvoiceStatus = 'draft' | 'issued' | 'partial' | 'paid' | 'overdue' | 'voided' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank-transfer' | 'payment-link' | 'insurance' | 'credit' | 'installment';
export type RecallStatus = 'due-soon' | 'due' | 'overdue' | 'contacted' | 'scheduled' | 'declined' | 'inactive' | 'reactivated';
export type LabCaseStatus = 'draft' | 'sent' | 'in-progress' | 'trial-ready' | 'received' | 'fitted' | 'delayed' | 'cancelled';
export type ConsentStatus = 'draft' | 'sent' | 'signed' | 'declined' | 'withdrawn' | 'expired';
export type StockStatus = 'healthy' | 'low' | 'out' | 'expiring';
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'login' | 'logout' | 'send' | 'sign';

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Clinic {
  id: UUID;
  name: string;
  legalName?: string;
  timezone: string;
  currency: string;
  locale: string;
  phone: string;
  email: string;
  address: Address;
  openingTime: string;
  closingTime: string;
  branchCode: string;
  logoUrl?: string;
}

export interface Branch {
  id: UUID;
  clinicId: UUID;
  name: string;
  code: string;
  address: Address;
  phone?: string;
  email?: string;
  active: boolean;
}

export interface Chair {
  id: UUID;
  clinicId: UUID;
  branchId?: UUID;
  name: string;
  room?: string;
  active: boolean;
}

export interface FamilyGroup {
  id: UUID;
  clinicId: UUID;
  name: string;
  primaryPatientId?: UUID;
  billingPatientId?: UUID;
  notes?: string;
  createdAt: ISODateTime;
}

export interface StaffMember {
  id: UUID;
  clinicId: UUID;
  userId?: UUID;
  name: string;
  initials: string;
  role: ClinicRole;
  phone?: string;
  email?: string;
  active: boolean;
  colorToken: 'navy' | 'teal' | 'blue' | 'amber' | 'rose' | 'slate';
  availability: 'available' | 'busy' | 'break' | 'off';
}

export interface MedicalAlert {
  id: UUID;
  label: string;
  detail?: string;
  severity: RiskLevel;
  category: 'allergy' | 'condition' | 'medication' | 'pregnancy' | 'accessibility' | 'other';
  verifiedAt?: ISODateTime;
  verifiedBy?: UUID;
}

export interface Medication {
  id: UUID;
  name: string;
  dosage?: string;
  frequency?: string;
  indication?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Patient {
  id: UUID;
  clinicId: UUID;
  patientNumber: string;
  firstName: string;
  lastName: string;
  displayName: string;
  dateOfBirth: ISODate;
  age: number;
  gender: Gender;
  phone: string;
  alternatePhone?: string;
  email?: string;
  preferredLanguage: string;
  preferredContact: ContactPreference;
  address?: Address;
  emergencyContact?: EmergencyContact;
  guardianPatientId?: UUID;
  familyGroupId?: UUID;
  photoUrl?: string;
  tags: string[];
  medicalAlerts: MedicalAlert[];
  medications: Medication[];
  intakeComplete: boolean;
  intakeVerified: boolean;
  whatsappConsent: boolean;
  photoConsent: boolean;
  marketingConsent: boolean;
  balance: number;
  lifetimeValue: number;
  nextAppointmentAt?: ISODateTime;
  lastVisitAt?: ISODateTime;
  recallDueAt?: ISODate;
  recallStatus?: RecallStatus;
  activeTreatmentStage?: TreatmentStage;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ProcedureType {
  id: UUID;
  clinicId: UUID;
  code: string;
  name: string;
  category: string;
  defaultDurationMinutes: number;
  defaultFee: number;
  requiresConsent: boolean;
  preparationInstructions?: string;
  followUpDays?: number;
  active: boolean;
}

export interface Appointment {
  id: UUID;
  clinicId: UUID;
  patientId: UUID;
  patientName: string;
  doctorId: UUID;
  doctorName: string;
  chairId: UUID;
  chairName: string;
  procedureTypeId?: UUID;
  procedureName: string;
  status: AppointmentStatus;
  startsAt: ISODateTime;
  endsAt: ISODateTime;
  durationMinutes: number;
  reason?: string;
  internalNote?: string;
  source: 'staff' | 'online' | 'whatsapp' | 'phone' | 'walk-in';
  confirmationStatus: 'not-sent' | 'sent' | 'delivered' | 'confirmed' | 'declined';
  reminderStatus: 'not-scheduled' | 'scheduled' | 'sent' | 'failed';
  estimatedFee?: number;
  depositRequired?: number;
  depositPaid?: number;
  checkedInAt?: ISODateTime;
  chairStartedAt?: ISODateTime;
  completedAt?: ISODateTime;
  cancellationReason?: string;
  readiness: AppointmentReadiness;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface AppointmentReadiness {
  intakeComplete: boolean;
  medicalHistoryVerified: boolean;
  consentReady: boolean;
  labCaseReady: boolean;
  paymentReady: boolean;
}

export interface TimelineEvent {
  id: UUID;
  clinicId: UUID;
  patientId: UUID;
  occurredAt: ISODateTime;
  type: 'appointment' | 'clinical' | 'communication' | 'payment' | 'consent' | 'treatment' | 'lab' | 'document' | 'system';
  title: string;
  description?: string;
  actorName?: string;
  sourceId?: UUID;
  sourceType?: string;
  icon: string;
  tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  metadata?: Record<string, unknown>;
}

export interface ClinicalNote {
  id: UUID;
  clinicId: UUID;
  patientId: UUID;
  appointmentId?: UUID;
  authorId: UUID;
  authorName: string;
  status: ClinicalNoteStatus;
  chiefComplaint?: string;
  medicalUpdate?: string;
  examination?: string;
  findings?: string;
  assessment?: string;
  procedurePerformed?: string;
  anaesthetic?: string;
  materials?: string;
  medication?: string;
  advice?: string;
  followUp?: string;
  toothNumbers: number[];
  aiGenerated: boolean;
  aiSourceIds: UUID[];
  signedAt?: ISODateTime;
  amendedFromId?: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ClinicalMedia {
  id: UUID;
  clinicId: UUID;
  patientId: UUID;
  appointmentId?: UUID;
  kind: MediaKind;
  title: string;
  storagePath: string;
  thumbnailPath?: string;
  mimeType: string;
  sizeBytes: number;
  toothNumbers: number[];
  capturedAt: ISODateTime;
  capturedBy: UUID;
  aiExtractedText?: string;
  aiSummary?: string;
  aiStatus?: 'not-requested' | 'queued' | 'ready' | 'failed' | 'reviewed';
  sourcePreserved: boolean;
}

export interface ToothRecord {
  toothNumber: number;
  condition: 'healthy' | 'caries' | 'filled' | 'crown' | 'missing' | 'implant' | 'root-canal' | 'bridge' | 'mobility' | 'watch';
  surfaces: ('M' | 'O' | 'D' | 'B' | 'L')[];
  note?: string;
  updatedAt: ISODateTime;
}

export interface TreatmentPlanItem {
  id: UUID;
  procedureTypeId?: UUID;
  procedureName: string;
  toothNumbers: number[];
  quantity: number;
  unitFee: number;
  discount: number;
  tax: number;
  total: number;
  status: 'proposed' | 'accepted' | 'scheduled' | 'in-progress' | 'completed' | 'declined';
  note?: string;
}

export interface TreatmentPlan {
  id: UUID;
  clinicId: UUID;
  patientId: UUID;
  title: string;
  stage: TreatmentStage;
  items: TreatmentPlanItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  acceptedAt?: ISODateTime;
  declinedReason?: string;
  expiresAt?: ISODate;
  createdBy: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface InvoiceItem {
  id: UUID;
  description: string;
  toothNumbers: number[];
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  taxRateCgst: number;
  taxRateSgst: number;
  hsnCode?: string;
  total: number;
}

export interface Invoice {
  id: UUID;
  clinicId: UUID;
  patientId: UUID;
  invoiceNumber: string;
  status: InvoiceStatus;
  issuedAt: ISODateTime;
  dueAt?: ISODateTime;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  taxRateCgst: number;
  taxRateSgst: number;
  hsnCode?: string;
  total: number;
  paid: number;
  balance: number;
  insuranceContribution: number;
  patientContribution: number;
  notes?: string;
}

export interface Payment {
  id: UUID;
  clinicId: UUID;
  patientId: UUID;
  invoiceId?: UUID;
  receiptNumber: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  receivedAt: ISODateTime;
  receivedBy: UUID;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially-refunded';
  refundAmount?: number;
}

export interface Communication {
  id: UUID;
  clinicId: UUID;
  patientId?: UUID;
  patientName?: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  status: CommunicationStatus;
  subject?: string;
  body?: string;
  phone?: string;
  email?: string;
  providerMessageId?: string;
  callDurationSeconds?: number;
  callOutcome?: 'answered' | 'no-answer' | 'busy' | 'voicemail' | 'wrong-number' | 'converted';
  unread: boolean;
  requiresFollowUp: boolean;
  followUpAt?: ISODateTime;
  assignedTo?: UUID;
  relatedAppointmentId?: UUID;
  occurredAt: ISODateTime;
}

export interface Task {
  id: UUID;
  clinicId: UUID;
  title: string;
  description?: string;
  patientId?: UUID;
  appointmentId?: UUID;
  assignedTo: UUID;
  assignedToName: string;
  createdBy: UUID;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt?: ISODateTime;
  category: 'callback' | 'payment' | 'clinical' | 'lab' | 'recall' | 'admin' | 'inventory';
  completedAt?: ISODateTime;
  createdAt: ISODateTime;
}

export interface Consent {
  id: UUID;
  clinicId: UUID;
  patientId: UUID;
  appointmentId?: UUID;
  templateId: UUID;
  templateName: string;
  version: number;
  language: string;
  status: ConsentStatus;
  signedByName?: string;
  guardianName?: string;
  witnessName?: string;
  signaturePath?: string;
  signatureData?: { strokes: { x: number; y: number }[][]; width: number; height: number; attestation: string };
  sentAt?: ISODateTime;
  signedAt?: ISODateTime;
  withdrawnAt?: ISODateTime;
  expiresAt?: ISODateTime;
}

export interface PrescriptionItem {
  id: UUID;
  medicine: string;
  strength?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: UUID;
  clinicId: UUID;
  patientId: UUID;
  appointmentId?: UUID;
  prescribedBy: UUID;
  prescribedByName: string;
  items: PrescriptionItem[];
  allergyWarningAcknowledged: boolean;
  notes?: string;
  issuedAt: ISODateTime;
}

export interface LabCase {
  id: UUID;
  clinicId: UUID;
  patientId: UUID;
  patientName: string;
  appointmentId?: UUID;
  labName: string;
  caseType: string;
  toothNumbers: number[];
  shade?: string;
  impressionType?: string;
  status: LabCaseStatus;
  sentAt?: ISODateTime;
  trialAt?: ISODateTime;
  dueAt?: ISODateTime;
  receivedAt?: ISODateTime;
  cost?: number;
  note?: string;
  attachmentCount: number;
}

export interface InventoryItem {
  id: UUID;
  clinicId: UUID;
  name: string;
  sku: string;
  category: string;
  supplier?: string;
  unit: string;
  currentQuantity: number;
  minimumQuantity: number;
  reorderQuantity: number;
  batchNumber?: string;
  expiresAt?: ISODate;
  status: StockStatus;
  unitCost?: number;
  location?: string;
}


export interface InventoryMovement {
  id: UUID;
  clinicId: UUID;
  inventoryItemId: UUID;
  appointmentId?: UUID;
  patientId?: UUID;
  type: 'purchase' | 'consumption' | 'adjustment' | 'waste' | 'return';
  quantity: number;
  unitCost?: number;
  reason?: string;
  performedBy: UUID;
  occurredAt: ISODateTime;
}

export interface BranchProcedurePrice {
  id: UUID;
  clinicId: UUID;
  branchId: UUID;
  procedureTypeId: UUID;
  fee: number;
  durationMinutes?: number;
  active: boolean;
}

export interface BookingRequest {
  id: UUID;
  clinicId: UUID;
  branchId?: UUID;
  patientId?: UUID;
  requestedName: string;
  phone: string;
  email?: string;
  preferredDate?: ISODate;
  preferredWindow?: string;
  reason?: string;
  status: 'new' | 'contacted' | 'converted' | 'declined' | 'spam';
  source: 'website' | 'whatsapp' | 'qr' | 'referral';
  createdAt: ISODateTime;
}

export interface AutomationRule {
  id: UUID;
  clinicId: UUID;
  name: string;
  trigger: string;
  action: string;
  channel?: CommunicationChannel;
  enabled: boolean;
  lastRunAt?: ISODateTime;
  runCount: number;
  failureCount: number;
}

export interface MessageTemplate {
  id: UUID;
  clinicId: UUID;
  name: string;
  channel: CommunicationChannel;
  category: string;
  body: string;
  variables: string[];
  providerTemplateId?: string;
  approved: boolean;
  active: boolean;
}

export interface AuditLog {
  id: UUID;
  clinicId: UUID;
  actorId?: UUID;
  actorName?: string;
  action: AuditAction;
  entityType: string;
  entityId?: UUID;
  summary: string;
  occurredAt: ISODateTime;
  ipAddress?: string;
  device?: string;
}

export interface DashboardData {
  clinic: Clinic;
  currentStaff: StaffMember;
  appointments: Appointment[];
  waiting: Appointment[];
  tasks: Task[];
  missedCalls: Communication[];
  labDue: LabCase[];
  overdueInvoices: Invoice[];
  followUps: Task[];
  metrics: {
    appointmentsToday: number;
    confirmed: number;
    waiting: number;
    inChair: number;
    unconfirmed: number;
    collectionsToday: number;
    outstanding: number;
    missedCalls: number;
  };
}

export interface PatientRecord {
  patient: Patient;
  appointments: Appointment[];
  timeline: TimelineEvent[];
  notes: ClinicalNote[];
  media: ClinicalMedia[];
  teeth: ToothRecord[];
  treatmentPlans: TreatmentPlan[];
  invoices: Invoice[];
  payments: Payment[];
  communications: Communication[];
  consents: Consent[];
  prescriptions: Prescription[];
  labCases: LabCase[];
  tasks: Task[];
}

export interface ClinicSnapshot {
  clinic: Clinic;
  branches: Branch[];
  chairs: Chair[];
  familyGroups: FamilyGroup[];
  staff: StaffMember[];
  patients: Patient[];
  procedures: ProcedureType[];
  appointments: Appointment[];
  communications: Communication[];
  tasks: Task[];
  notes: ClinicalNote[];
  media: ClinicalMedia[];
  teeth: ToothRecord[];
  treatmentPlans: TreatmentPlan[];
  invoices: Invoice[];
  payments: Payment[];
  consents: Consent[];
  prescriptions: Prescription[];
  labCases: LabCase[];
  inventory: InventoryItem[];
  automations: AutomationRule[];
  templates: MessageTemplate[];
  auditLogs: AuditLog[];
}

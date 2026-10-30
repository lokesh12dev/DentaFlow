import type {
  Appointment,
  AppointmentStatus,
  AuditLog,
  AutomationRule,
  Branch,
  BranchProcedurePrice,
  BookingRequest,
  Chair,
  Clinic,
  Communication,
  CommunicationChannel,
  Consent,
  DashboardData,
  InventoryItem,
  Invoice,
  LabCase,
  FamilyGroup,
  MessageTemplate,
  Patient,
  PatientRecord,
  Payment,
  Prescription,
  ProcedureType,
  StaffMember,
  Task,
  TreatmentPlan
} from '@/domain/types';

export interface PatientFilters {
  query?: string;
  flag?: 'all' | 'medical-alerts' | 'incomplete-intake' | 'outstanding' | 'recall' | 'pending-treatment';
}

export interface AppointmentFilters {
  date?: string;
  doctorId?: string;
  chairId?: string;
  status?: AppointmentStatus;
}

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Patient['gender'];
  phone: string;
  email?: string;
  preferredLanguage: string;
  preferredContact: Patient['preferredContact'];
  whatsappConsent: boolean;
  photoConsent: boolean;
  medicalConditions?: string;
  allergies?: string;
  medications?: string;
  emergencyName?: string;
  emergencyRelationship?: string;
  emergencyPhone?: string;
}

export interface CreateAppointmentInput {
  patientId: string;
  procedureTypeId: string;
  doctorId: string;
  chairId: string;
  startsAt: string;
  durationMinutes: number;
  internalNote?: string;
  sendWhatsapp: boolean;
  requestDeposit: boolean;
  depositAmount?: number;
}

export interface CreateCommunicationInput {
  patientId?: string;
  channel: CommunicationChannel;
  body?: string;
  subject?: string;
  phone?: string;
  email?: string;
  relatedAppointmentId?: string;
  requiresFollowUp?: boolean;
  followUpAt?: string;
}

export interface CreateClinicalNoteInput {
  patientId: string;
  appointmentId?: string;
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
  status: 'draft' | 'review-required' | 'signed';
  aiGenerated?: boolean;
  aiSourceIds?: string[];
}

export interface RecordPaymentInput {
  patientId: string;
  invoiceId?: string;
  amount: number;
  method: Payment['method'];
  reference?: string;
  sendReceipt: boolean;
}


export interface CreateTaskInput {
  title: string; description?: string; patientId?: string; appointmentId?: string; assignedTo: string; priority: Task['priority']; dueAt?: string; category: Task['category'];
}
export interface CreateTreatmentPlanInput {
  patientId: string; title: string; expiresAt?: string; items: { procedureTypeId?: string; procedureName: string; toothNumbers: number[]; quantity: number; unitFee: number; discount: number; tax: number; note?: string }[];
}
export interface CreateConsentInput { patientId: string; appointmentId?: string; templateName: string; language: string; guardianName?: string; witnessName?: string; expiresAt?: string; }
export interface CreatePrescriptionInput { patientId: string; appointmentId?: string; allergyWarningAcknowledged: boolean; notes?: string; items: { medicine: string; strength?: string; dosage: string; frequency: string; duration: string; instructions?: string }[]; }
export interface CreateLabCaseInput { patientId: string; appointmentId?: string; labName: string; caseType: string; toothNumbers: number[]; shade?: string; impressionType?: string; dueAt?: string; cost?: number; note?: string; }
export interface UpsertInventoryInput { id?: string; name: string; sku: string; category: string; supplier?: string; unit: string; currentQuantity: number; minimumQuantity: number; reorderQuantity: number; batchNumber?: string; expiresAt?: string; unitCost?: number; location?: string; }
export interface CreateAutomationInput { name: string; trigger: string; action: string; channel?: CommunicationChannel; }
export interface CreateTemplateInput { name: string; channel: CommunicationChannel; category: string; body: string; variables: string[]; approved: boolean; }
export interface InviteStaffInput { email: string; name: string; role: StaffMember['role']; phone?: string; }
export interface UpdateStaffInput { id: string; name: string; role: StaffMember['role']; phone?: string; active: boolean; availability: StaffMember['availability']; }
export interface UpdateTemplateInput extends CreateTemplateInput { id: string; active: boolean; }
export interface SignConsentInput { consentId: string; signedByName: string; guardianName?: string; witnessName?: string; attestation: string; signatureData: { strokes: { x: number; y: number }[][]; width: number; height: number; attestation: string }; }
export interface RefundPaymentInput { paymentId: string; amount: number; reason: string; idempotencyKey: string; }
export interface RecordInventoryMovementInput { inventoryItemId: string; appointmentId?: string; patientId?: string; type: 'purchase'|'consumption'|'adjustment'|'waste'|'return'; quantity: number; unitCost?: number; reason?: string; }

export interface UpdateClinicInput {
  name: string; legalName?: string; phone: string; email: string; timezone: string; currency: string; locale: string; openingTime: string; closingTime: string; address: { line1: string; line2?: string; city: string; state: string; postalCode: string; country: string };
}
export interface CreateFamilyGroupInput { name: string; primaryPatientId?: string; billingPatientId?: string; notes?: string; memberPatientIds: string[]; }


export interface UpsertBranchProcedurePriceInput {
  branchId: string;
  procedureTypeId: string;
  fee: number;
  durationMinutes?: number;
  active: boolean;
}

export interface ClinicRepository {
  mode: 'demo' | 'supabase';
  getClinic(): Promise<Clinic>;
  updateClinic(input: UpdateClinicInput): Promise<Clinic>;
  listBranches(): Promise<Branch[]>;
  listChairs(branchId?: string): Promise<Chair[]>;
  listFamilyGroups(): Promise<FamilyGroup[]>;
  createFamilyGroup(input: CreateFamilyGroupInput): Promise<FamilyGroup>;
  listStaff(): Promise<StaffMember[]>;
  listProcedures(): Promise<ProcedureType[]>;
  listBranchProcedurePrices(branchId: string): Promise<BranchProcedurePrice[]>;
  upsertBranchProcedurePrice(input: UpsertBranchProcedurePriceInput): Promise<BranchProcedurePrice>;
  getDashboard(): Promise<DashboardData>;
  listPatients(filters?: PatientFilters): Promise<Patient[]>;
  getPatientRecord(patientId: string): Promise<PatientRecord>;
  createPatient(input: CreatePatientInput): Promise<Patient>;
  listAppointments(filters?: AppointmentFilters): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment>;
  createAppointment(input: CreateAppointmentInput): Promise<Appointment>;
  transitionAppointment(id: string, status: AppointmentStatus): Promise<Appointment>;
  listCommunications(): Promise<Communication[]>;
  listBookingRequests(): Promise<BookingRequest[]>;
  setBookingRequestStatus(id: string, status: BookingRequest['status'], patientId?: string): Promise<void>;
  createCommunication(input: CreateCommunicationInput): Promise<Communication>;
  markCommunicationRead(id: string): Promise<void>;
  createClinicalNote(input: CreateClinicalNoteInput): Promise<void>;
  listTasks(): Promise<Task[]>;
  createTask(input: CreateTaskInput): Promise<Task>;
  setTaskStatus(id: string, status: Task['status']): Promise<void>;
  listInvoices(): Promise<Invoice[]>;
  listPayments(): Promise<Payment[]>;
  recordPayment(input: RecordPaymentInput): Promise<Payment>;
  listTreatmentPlans(): Promise<TreatmentPlan[]>;
  createTreatmentPlan(input: CreateTreatmentPlanInput): Promise<TreatmentPlan>;
  createConsent(input: CreateConsentInput): Promise<Consent>;
  createPrescription(input: CreatePrescriptionInput): Promise<Prescription>;
  listLabCases(): Promise<LabCase[]>;
  createLabCase(input: CreateLabCaseInput): Promise<LabCase>;
  listInventory(): Promise<InventoryItem[]>;
  upsertInventory(input: UpsertInventoryInput): Promise<InventoryItem>;
  listAutomations(): Promise<AutomationRule[]>;
  setAutomationEnabled(id: string, enabled: boolean): Promise<void>;
  createAutomation(input: CreateAutomationInput): Promise<AutomationRule>;
  listTemplates(): Promise<MessageTemplate[]>;
  createTemplate(input: CreateTemplateInput): Promise<MessageTemplate>;
  inviteStaff(input: InviteStaffInput): Promise<StaffMember>;
  updateStaff(input: UpdateStaffInput): Promise<StaffMember>;
  updateTemplate(input: UpdateTemplateInput): Promise<MessageTemplate>;
  signConsent(input: SignConsentInput): Promise<Consent>;
  withdrawConsent(consentId: string, reason: string): Promise<Consent>;
  refundPayment(input: RefundPaymentInput): Promise<Payment>;
  recordInventoryMovement(input: RecordInventoryMovementInput): Promise<InventoryItem>;
  listAuditLogs(): Promise<AuditLog[]>;
  askPatientHistory(patientId: string, question: string): Promise<{ answer: string; sources: { id: string; label: string; occurredAt: string }[] }>;
}

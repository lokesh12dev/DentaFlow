import { requireSupabase } from '@/core/supabase';
import { canTransitionAppointment } from '@/domain/rules';
import { useSessionStore } from '@/store/sessionStore';
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
  DashboardData,
  InventoryItem,
  Invoice,
  LabCase,
  Consent,
  FamilyGroup,
  MessageTemplate,
  Patient,
  PatientRecord,
  Payment,
  Prescription,
  ProcedureType,
  StaffMember,
  Task,
  TimelineEvent,
  TreatmentPlan
} from '@/domain/types';
import type {
  AppointmentFilters,
  ClinicRepository,
  CreateAppointmentInput,
  CreateClinicalNoteInput,
  CreateCommunicationInput,
  CreatePatientInput,
  CreateTaskInput,
  CreateTreatmentPlanInput,
  CreateConsentInput,
  CreatePrescriptionInput,
  CreateLabCaseInput,
  UpsertInventoryInput,
  CreateAutomationInput,
  CreateTemplateInput,
  InviteStaffInput,
  UpdateClinicInput,
  CreateFamilyGroupInput,
  UpdateStaffInput,
  UpdateTemplateInput,
  SignConsentInput,
  RefundPaymentInput,
  RecordInventoryMovementInput,
  UpsertBranchProcedurePriceInput,
  PatientFilters,
  RecordPaymentInput
} from './clinicRepository';

const db = () => requireSupabase();

function requireData<T>(data: T | null, error: { message: string } | null, fallbackMessage: string): T {
  if (error) throw new Error(error.message);
  if (data == null) throw new Error(fallbackMessage);
  return data;
}

function currentClinicId(): string {
  const value = useSessionStore.getState().activeClinicId;
  if (!value) throw new Error('No active clinic is selected.');
  return value;
}

const camel = <T,>(row: Record<string, unknown>): T => {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const next = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    output[next] = Array.isArray(value)
      ? value.map((item) => (item && typeof item === 'object' && !Array.isArray(item) ? camel(item as Record<string, unknown>) : item))
      : value && typeof value === 'object'
        ? camel(value as Record<string, unknown>)
        : value;
  }
  return output as T;
};

function rows<T>(data: unknown[] | null): T[] {
  return (data ?? []).map((item) => camel<T>(item as Record<string, unknown>));
}

function normalizeAppointment(row: Record<string, unknown>): Appointment {
  const value = camel<Record<string, any>>(row);
  return { ...value, doctorId: value.doctorMemberId, readiness: value.readiness ?? { intakeComplete: false, medicalHistoryVerified: false, consentReady: false, labCaseReady: true, paymentReady: true } } as Appointment;
}

function normalizeTask(row: Record<string, unknown>): Task {
  const value = camel<Record<string, any>>(row);
  const joined = value.clinicMembers;
  return { ...value, assignedToName: value.assignedToName ?? joined?.name ?? 'Unassigned' } as Task;
}

function normalizeDashboard(row: Record<string, unknown>): DashboardData {
  const value = camel<Record<string, any>>(row);
  return {
    ...value,
    appointments: (row.appointments as Record<string, unknown>[] | undefined ?? []).map(normalizeAppointment),
    waiting: (row.waiting as Record<string, unknown>[] | undefined ?? []).map(normalizeAppointment),
    tasks: (row.tasks as Record<string, unknown>[] | undefined ?? []).map(normalizeTask),
    followUps: (row.follow_ups as Record<string, unknown>[] | undefined ?? []).map(normalizeTask)
  } as DashboardData;
}

function normalizePatientRecord(row: Record<string, unknown>): PatientRecord {
  const value = camel<Record<string, any>>(row);
  return {
    ...value,
    appointments: (row.appointments as Record<string, unknown>[] | undefined ?? []).map(normalizeAppointment),
    tasks: (row.tasks as Record<string, unknown>[] | undefined ?? []).map(normalizeTask)
  } as PatientRecord;
}

function safeSearchTerm(value: string): string {
  return value.trim().replace(/[\,%()]/g, ' ').replace(/\s+/g, ' ').slice(0, 120);
}

async function getCurrentMember(): Promise<StaffMember> {
  const clinicId = currentClinicId();
  const { data, error } = await db().from('clinic_members').select('*').eq('clinic_id', clinicId).eq('user_id', (await db().auth.getUser()).data.user?.id ?? '').eq('active', true).single();
  return camel<StaffMember>(requireData(data, error, 'Clinic membership was not found.'));
}

export const supabaseRepository: ClinicRepository = {
  mode: 'supabase',
  async getClinic() {
    const { data, error } = await db().from('clinics').select('*').eq('id', currentClinicId()).single();
    return camel<Clinic>(requireData(data, error, 'Clinic was not found.'));
  },
  async updateClinic(input: UpdateClinicInput) {
    const { data, error } = await db().from('clinics').update({ name: input.name, legal_name: input.legalName, phone: input.phone, email: input.email, timezone: input.timezone, currency: input.currency, locale: input.locale, opening_time: input.openingTime, closing_time: input.closingTime, address: input.address }).eq('id', currentClinicId()).select().single();
    return camel<Clinic>(requireData(data, error, 'Clinic profile could not be updated.'));
  },
  async listBranches() {
    const { data, error } = await db().from('branches').select('*').eq('clinic_id', currentClinicId()).eq('active', true).order('name');
    if (error) throw new Error(error.message); return rows<Branch>(data);
  },
  async listChairs(branchId?: string) {
    let query = db().from('chairs').select('*').eq('clinic_id', currentClinicId()).eq('active', true);
    if (branchId) query = query.eq('branch_id', branchId);
    const { data, error } = await query.order('name'); if (error) throw new Error(error.message); return rows<Chair>(data);
  },
  async listFamilyGroups() {
    const { data, error } = await db().from('family_groups').select('*').eq('clinic_id', currentClinicId()).order('name');
    if (error) throw new Error(error.message); return rows<FamilyGroup>(data);
  },
  async createFamilyGroup(input: CreateFamilyGroupInput) {
    const { data, error } = await db().rpc('create_family_group', { p_clinic_id: currentClinicId(), p_payload: input });
    return camel<FamilyGroup>(requireData(data, error, 'Family account could not be created.') as Record<string, unknown>);
  },
  async listStaff() {
    const { data, error } = await db().from('clinic_members').select('*').eq('clinic_id', currentClinicId()).eq('active', true).order('name');
    if (error) throw new Error(error.message);
    return rows<StaffMember>(data);
  },
  async listProcedures() {
    const { data, error } = await db().from('procedure_types').select('*').eq('clinic_id', currentClinicId()).eq('active', true).order('category').order('name');
    if (error) throw new Error(error.message);
    return rows<ProcedureType>(data);
  },
  async listBranchProcedurePrices(branchId: string) {
    const { data, error } = await db().from('branch_procedure_prices').select('*').eq('clinic_id', currentClinicId()).eq('branch_id', branchId).order('procedure_type_id');
    if (error) throw new Error(error.message);
    return rows<BranchProcedurePrice>(data);
  },
  async upsertBranchProcedurePrice(input: UpsertBranchProcedurePriceInput) {
    const payload = { clinic_id: currentClinicId(), branch_id: input.branchId, procedure_type_id: input.procedureTypeId, fee: input.fee, duration_minutes: input.durationMinutes ?? null, active: input.active };
    const { data, error } = await db().from('branch_procedure_prices').upsert(payload, { onConflict: 'branch_id,procedure_type_id' }).select('*').single();
    return camel<BranchProcedurePrice>(requireData(data, error, 'Branch price could not be saved.') as Record<string, unknown>);
  },
  async getDashboard() {
    const { data, error } = await db().rpc('get_dashboard_snapshot', { p_clinic_id: currentClinicId(), p_date: new Date().toISOString().slice(0, 10) });
    const payload = requireData(data, error, 'Dashboard data could not be loaded.') as Record<string, unknown>;
    return normalizeDashboard(payload);
  },
  async listPatients(filters?: PatientFilters) {
    let query = db().from('patients').select('*').eq('clinic_id', currentClinicId()).is('archived_at', null);
    if (filters?.query) { const term = safeSearchTerm(filters.query); if (term) query = query.or(`display_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,patient_number.ilike.%${term}%`); }
    if (filters?.flag === 'incomplete-intake') query = query.or('intake_complete.eq.false,intake_verified.eq.false');
    if (filters?.flag === 'outstanding') query = query.gt('balance', 0);
    if (filters?.flag === 'recall') query = query.in('recall_status', ['due', 'overdue']);
    if (filters?.flag === 'pending-treatment') query = query.not('active_treatment_stage', 'is', null).neq('active_treatment_stage', 'completed');
    const { data, error } = await query.order('display_name').limit(250);
    if (error) throw new Error(error.message);
    const patients = rows<Patient>(data).map((patient) => ({ ...patient, age: Math.max(0, new Date().getFullYear() - Number(patient.dateOfBirth.slice(0, 4))) }));
    return filters?.flag === 'medical-alerts' ? patients.filter((item) => item.medicalAlerts.length > 0) : patients;
  },
  async getPatientRecord(patientId: string) {
    const { data, error } = await db().rpc('get_patient_record', { p_clinic_id: currentClinicId(), p_patient_id: patientId });
    return normalizePatientRecord(requireData(data, error, 'Patient record was not found.') as Record<string, unknown>);
  },
  async createPatient(input: CreatePatientInput) {
    const clinicId = currentClinicId();
    const { data, error } = await db().rpc('create_patient_intake', {
      p_clinic_id: clinicId,
      p_payload: {
        ...input,
        display_name: `${input.firstName} ${input.lastName}`
      }
    });
    return camel<Patient>(requireData(data, error, 'Patient could not be created.') as Record<string, unknown>);
  },
  async listAppointments(filters?: AppointmentFilters) {
    let query = db().from('appointments').select('*').eq('clinic_id', currentClinicId());
    if (filters?.date) query = query.gte('starts_at', `${filters.date}T00:00:00`).lt('starts_at', `${filters.date}T23:59:59.999`);
    if (filters?.doctorId) query = query.eq('doctor_member_id', filters.doctorId);
    if (filters?.chairId) query = query.eq('chair_id', filters.chairId);
    if (filters?.status) query = query.eq('status', filters.status);
    const { data, error } = await query.order('starts_at').limit(300);
    if (error) throw new Error(error.message);
    return (data ?? []).map((item) => normalizeAppointment(item as Record<string, unknown>));
  },
  async getAppointment(id: string) {
    const { data, error } = await db().from('appointments').select('*').eq('clinic_id', currentClinicId()).eq('id', id).single();
    return normalizeAppointment(requireData(data, error, 'Appointment was not found.') as Record<string, unknown>);
  },
  async createAppointment(input: CreateAppointmentInput) {
    const { data, error } = await db().rpc('create_appointment_with_workflow', { p_clinic_id: currentClinicId(), p_payload: input });
    return normalizeAppointment(requireData(data, error, 'Appointment could not be created.') as Record<string, unknown>);
  },
  async transitionAppointment(id: string, status: AppointmentStatus) {
    const current = await this.getAppointment(id);
    if (!canTransitionAppointment(current.status, status)) throw new Error(`Invalid appointment transition: ${current.status} → ${status}`);
    const { data, error } = await db().rpc('transition_appointment', { p_clinic_id: currentClinicId(), p_appointment_id: id, p_next_status: status });
    return normalizeAppointment(requireData(data, error, 'Appointment status could not be updated.') as Record<string, unknown>);
  },
  async listCommunications() {
    const { data, error } = await db().from('communications').select('*').eq('clinic_id', currentClinicId()).order('occurred_at', { ascending: false }).limit(300);
    if (error) throw new Error(error.message);
    return rows<Communication>(data);
  },
  async listBookingRequests() {
    const { data, error } = await db().from('booking_requests').select('*').eq('clinic_id', currentClinicId()).order('created_at', { ascending: false }).limit(200);
    if (error) throw new Error(error.message); return rows<BookingRequest>(data);
  },
  async setBookingRequestStatus(id, status, patientId) {
    const { error } = await db().from('booking_requests').update({ status, patient_id: patientId ?? null }).eq('clinic_id', currentClinicId()).eq('id', id); if(error)throw new Error(error.message);
  },
  async createCommunication(input: CreateCommunicationInput) {
    const { data, error } = await db().rpc('log_communication', { p_clinic_id: currentClinicId(), p_payload: input });
    return camel<Communication>(requireData(data, error, 'Communication could not be logged.') as Record<string, unknown>);
  },
  async markCommunicationRead(id: string) {
    const { error } = await db().from('communications').update({ unread: false }).eq('clinic_id', currentClinicId()).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async createClinicalNote(input: CreateClinicalNoteInput) {
    const member = await getCurrentMember();
    const payload = {
      clinic_id: currentClinicId(), patient_id: input.patientId, appointment_id: input.appointmentId,
      author_member_id: member.id, status: input.status,
      content: {
        chiefComplaint: input.chiefComplaint, medicalUpdate: input.medicalUpdate, examination: input.examination,
        findings: input.findings, assessment: input.assessment, procedurePerformed: input.procedurePerformed,
        anaesthetic: input.anaesthetic, materials: input.materials, medication: input.medication, advice: input.advice,
        followUp: input.followUp
      }, tooth_numbers: input.toothNumbers, ai_generated: input.aiGenerated ?? false,
      ai_source_ids: input.aiSourceIds ?? [], signed_at: input.status === 'signed' ? new Date().toISOString() : null
    };
    const { error } = await db().from('clinical_notes').insert(payload);
    if (error) throw new Error(error.message);
  },
  async createTask(input: CreateTaskInput) {
    const payload = { clinic_id: currentClinicId(), title: input.title, description: input.description, patient_id: input.patientId, appointment_id: input.appointmentId, assigned_to: input.assignedTo, created_by: (await db().auth.getUser()).data.user?.id, priority: input.priority, status: 'open', due_at: input.dueAt, category: input.category };
    const { data, error } = await db().from('tasks').insert(payload).select('*, clinic_members!tasks_assigned_to_fkey(name)').single();
    const row = requireData(data, error, 'Task could not be created.') as any; return camel<Task>({ ...row, assigned_to_name: row.clinic_members?.name });
  },
  async listTasks() {
    const { data, error } = await db().from('tasks').select('*, clinic_members!tasks_assigned_to_fkey(name)').eq('clinic_id', currentClinicId()).not('status', 'in', '(done,cancelled)').order('due_at');
    if (error) throw new Error(error.message);
    return (data ?? []).map((item) => normalizeTask(item as Record<string, unknown>));
  },
  async setTaskStatus(id: string, status: Task['status']) {
    const { error } = await db().from('tasks').update({ status, completed_at: status === 'done' ? new Date().toISOString() : null }).eq('clinic_id', currentClinicId()).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async listInvoices() {
    const { data, error } = await db().from('invoices').select('*, invoice_items(*)').eq('clinic_id', currentClinicId()).order('issued_at', { ascending: false }).limit(300);
    if (error) throw new Error(error.message);
    return rows<any>(data).map((item) => ({ ...item, items: item.invoiceItems ?? [] })) as Invoice[];
  },
  async recordPayment(input: RecordPaymentInput) {
    const { data, error } = await db().rpc('record_payment', { p_clinic_id: currentClinicId(), p_payload: input });
    return camel<Payment>(requireData(data, error, 'Payment could not be recorded.') as Record<string, unknown>);
  },
  async createTreatmentPlan(input: CreateTreatmentPlanInput) {
    const { data, error } = await db().rpc('create_treatment_plan', { p_clinic_id: currentClinicId(), p_payload: input });
    return camel<TreatmentPlan>(requireData(data, error, 'Treatment plan could not be created.') as Record<string, unknown>);
  },
  async createConsent(input: CreateConsentInput) {
    const { data, error } = await db().from('consents').insert({ clinic_id: currentClinicId(), patient_id: input.patientId, appointment_id: input.appointmentId, template_name: input.templateName, language: input.language, status: 'sent', guardian_name: input.guardianName, witness_name: input.witnessName, sent_at: new Date().toISOString(), expires_at: input.expiresAt }).select().single();
    const value = camel<Record<string, any>>(requireData(data, error, 'Consent could not be created.')); return { ...value, templateId: value.templateId ?? value.id } as Consent;
  },
  async createPrescription(input: CreatePrescriptionInput) {
    const { data, error } = await db().rpc('create_prescription', { p_clinic_id: currentClinicId(), p_payload: input });
    return camel<Prescription>(requireData(data, error, 'Prescription could not be created.') as Record<string, unknown>);
  },
  async listTreatmentPlans() {
    const { data, error } = await db().from('treatment_plans').select('*, treatment_plan_items(*)').eq('clinic_id', currentClinicId()).order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return rows<any>(data).map((item) => ({ ...item, items: item.treatmentPlanItems ?? [] })) as TreatmentPlan[];
  },
  async createLabCase(input: CreateLabCaseInput) {
    const patient = await this.getPatientRecord(input.patientId);
    const { data, error } = await db().from('lab_cases').insert({ clinic_id: currentClinicId(), patient_id: input.patientId, patient_name: patient.patient.displayName, appointment_id: input.appointmentId, lab_name: input.labName, case_type: input.caseType, tooth_numbers: input.toothNumbers, shade: input.shade, impression_type: input.impressionType, status: 'draft', due_at: input.dueAt, cost: input.cost, note: input.note }).select().single();
    return camel<LabCase>(requireData(data, error, 'Lab case could not be created.'));
  },
  async listLabCases() {
    const { data, error } = await db().from('lab_cases').select('*').eq('clinic_id', currentClinicId()).order('due_at');
    if (error) throw new Error(error.message);
    return rows<LabCase>(data);
  },
  async upsertInventory(input: UpsertInventoryInput) {
    const payload = { ...(input.id ? { id: input.id } : {}), clinic_id: currentClinicId(), name: input.name, sku: input.sku, category: input.category, supplier: input.supplier, unit: input.unit, current_quantity: input.currentQuantity, minimum_quantity: input.minimumQuantity, reorder_quantity: input.reorderQuantity, batch_number: input.batchNumber, expires_at: input.expiresAt, unit_cost: input.unitCost, location: input.location };
    const { data, error } = await db().from('inventory_items').upsert(payload).select().single();
    return camel<InventoryItem>(requireData(data, error, 'Inventory item could not be saved.'));
  },
  async listInventory() {
    const { data, error } = await db().from('inventory_items').select('*').eq('clinic_id', currentClinicId()).order('name');
    if (error) throw new Error(error.message);
    return rows<InventoryItem>(data);
  },
  async listAutomations() {
    const { data, error } = await db().from('automation_rules').select('*').eq('clinic_id', currentClinicId()).order('name');
    if (error) throw new Error(error.message);
    return rows<AutomationRule>(data);
  },
  async createAutomation(input: CreateAutomationInput) {
    const { data, error } = await db().from('automation_rules').insert({ clinic_id: currentClinicId(), name: input.name, trigger: input.trigger, action: input.action, channel: input.channel, enabled: true }).select().single();
    return camel<AutomationRule>(requireData(data, error, 'Automation could not be created.'));
  },
  async setAutomationEnabled(id: string, enabled: boolean) {
    const { error } = await db().from('automation_rules').update({ enabled }).eq('clinic_id', currentClinicId()).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async createTemplate(input: CreateTemplateInput) {
    const { data, error } = await db().from('message_templates').insert({ clinic_id: currentClinicId(), name: input.name, channel: input.channel, category: input.category, body: input.body, variables: input.variables, approved: input.approved, active: true }).select().single();
    return camel<MessageTemplate>(requireData(data, error, 'Template could not be created.'));
  },
  async inviteStaff(input: InviteStaffInput) {
    const { data, error } = await db().functions.invoke('invite-staff', { body: { clinicId: currentClinicId(), ...input } });
    return camel<StaffMember>(requireData(data, error, 'Staff invitation could not be created.') as Record<string, unknown>);
  },
  async updateStaff(input: UpdateStaffInput) {
    const { data, error } = await db().rpc('update_staff_access', { p_clinic_id: currentClinicId(), p_member_id: input.id, p_payload: input });
    return camel<StaffMember>(requireData(data, error, 'Staff access could not be updated.') as Record<string, unknown>);
  },
  async updateTemplate(input: UpdateTemplateInput) {
    const { data, error } = await db().from('message_templates').update({ name: input.name, channel: input.channel, category: input.category, body: input.body, variables: input.variables, approved: input.approved, active: input.active }).eq('clinic_id', currentClinicId()).eq('id', input.id).select().single();
    return camel<MessageTemplate>(requireData(data, error, 'Template could not be updated.'));
  },
  async signConsent(input: SignConsentInput) {
    const { data, error } = await db().rpc('sign_consent', { p_clinic_id: currentClinicId(), p_payload: input });
    return camel<Consent>(requireData(data, error, 'Consent could not be signed.') as Record<string, unknown>);
  },
  async withdrawConsent(consentId: string, reason: string) {
    const { data, error } = await db().rpc('withdraw_consent', { p_clinic_id: currentClinicId(), p_consent_id: consentId, p_reason: reason });
    return camel<Consent>(requireData(data, error, 'Consent could not be withdrawn.') as Record<string, unknown>);
  },
  async refundPayment(input: RefundPaymentInput) {
    const { data, error } = await db().rpc('refund_payment', { p_clinic_id: currentClinicId(), p_payload: input });
    return camel<Payment>(requireData(data, error, 'Payment could not be refunded.') as Record<string, unknown>);
  },
  async recordInventoryMovement(input: RecordInventoryMovementInput) {
    const { data, error } = await db().rpc('record_inventory_movement', { p_clinic_id: currentClinicId(), p_payload: input });
    return camel<InventoryItem>(requireData(data, error, 'Inventory movement could not be recorded.') as Record<string, unknown>);
  },
  async listTemplates() {
    const { data, error } = await db().from('message_templates').select('*').eq('clinic_id', currentClinicId()).order('name');
    if (error) throw new Error(error.message);
    return rows<MessageTemplate>(data);
  },
  async listAuditLogs() {
    const { data, error } = await db().from('audit_logs').select('*').eq('clinic_id', currentClinicId()).order('occurred_at', { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return rows<AuditLog>(data);
  },
  async askPatientHistory(patientId: string, question: string) {
    const { data, error } = await db().functions.invoke('openrouter-clinical-assist', {
      body: { action: 'history-question', clinicId: currentClinicId(), patientId, question }
    });
    return requireData(data, error, 'History assistant could not answer the question.') as { answer: string; sources: Array<{ id: string; label: string; occurredAt: string }> };
  }
};

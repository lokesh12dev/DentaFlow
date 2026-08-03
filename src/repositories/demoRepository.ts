import { buildDemoSnapshot, buildPatientTimeline } from '@/data/demo';
import { env } from '@/core/env';
import { canTransitionAppointment, calculateInvoiceBalance, deriveInvoiceStatus, normalizePhone } from '@/domain/rules';
import type { Appointment, AppointmentStatus, BookingRequest, BranchProcedurePrice, ClinicSnapshot, Communication, DashboardData, Patient, PatientRecord, Payment } from '@/domain/types';
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

let snapshot: ClinicSnapshot = buildDemoSnapshot();
let demoBookingRequests: BookingRequest[] = [
  { id:'b0000000-0000-4000-8000-000000000001', clinicId:snapshot.clinic.id, requestedName:'Kavya Menon', phone:'+919876500451', email:'kavya@example.com', preferredDate:new Date(Date.now()+86400000).toISOString().slice(0,10), preferredWindow:'Morning', reason:'Pain in lower-left molar', status:'new', source:'website', createdAt:new Date(Date.now()-20*60000).toISOString() },
  { id:'b0000000-0000-4000-8000-000000000002', clinicId:snapshot.clinic.id, requestedName:'Rohit Das', phone:'+919876500452', preferredDate:new Date(Date.now()+2*86400000).toISOString().slice(0,10), preferredWindow:'After 4 PM', reason:'Cleaning consultation', status:'contacted', source:'whatsapp', createdAt:new Date(Date.now()-3*3600000).toISOString() }
];

let demoBranchProcedurePrices: BranchProcedurePrice[] = [];
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const id = () => `${Math.random().toString(16).slice(2, 10)}-0000-4000-8000-${Date.now().toString().slice(-12)}`;

function currentStaff() {
  return snapshot.staff.find((item) => item.role === env.demoRole) ?? snapshot.staff.find((item) => item.role === 'owner') ?? snapshot.staff[0]!;
}

function patientRecord(patientId: string): PatientRecord {
  const patient = snapshot.patients.find((item) => item.id === patientId);
  if (!patient) throw new Error('Patient not found');
  return {
    patient,
    appointments: snapshot.appointments.filter((item) => item.patientId === patientId).sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    timeline: buildPatientTimeline(snapshot, patientId),
    notes: snapshot.notes.filter((item) => item.patientId === patientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    media: snapshot.media.filter((item) => item.patientId === patientId).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)),
    teeth: snapshot.teeth,
    treatmentPlans: snapshot.treatmentPlans.filter((item) => item.patientId === patientId),
    invoices: snapshot.invoices.filter((item) => item.patientId === patientId).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    payments: snapshot.payments.filter((item) => item.patientId === patientId).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
    communications: snapshot.communications.filter((item) => item.patientId === patientId).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    consents: snapshot.consents.filter((item) => item.patientId === patientId),
    prescriptions: snapshot.prescriptions.filter((item) => item.patientId === patientId),
    labCases: snapshot.labCases.filter((item) => item.patientId === patientId),
    tasks: snapshot.tasks.filter((item) => item.patientId === patientId)
  };
}

export const demoRepository: ClinicRepository = {
  mode: 'demo',
  async getClinic() { return clone(snapshot.clinic); },
  async updateClinic(input: UpdateClinicInput) { snapshot.clinic = { ...snapshot.clinic, ...input }; return clone(snapshot.clinic); },
  async listBranches() { return clone(snapshot.branches.filter((item) => item.active)); },
  async listChairs(branchId?: string) { return clone(snapshot.chairs.filter((item) => item.active && (!branchId || item.branchId === branchId))); },
  async listFamilyGroups() { return clone(snapshot.familyGroups); },
  async createFamilyGroup(input: CreateFamilyGroupInput) {
    const group = { id: id(), clinicId: snapshot.clinic.id, name: input.name, primaryPatientId: input.primaryPatientId, billingPatientId: input.billingPatientId, notes: input.notes, createdAt: new Date().toISOString() };
    snapshot.familyGroups.unshift(group);
    for (const patient of snapshot.patients) if (input.memberPatientIds.includes(patient.id)) patient.familyGroupId = group.id;
    return clone(group);
  },
  async listStaff() { return clone(snapshot.staff); },
  async listProcedures() { return clone(snapshot.procedures); },
  async listBranchProcedurePrices(branchId: string) { return clone(demoBranchProcedurePrices.filter((item) => item.branchId === branchId)); },
  async upsertBranchProcedurePrice(input: UpsertBranchProcedurePriceInput) {
    const existing = demoBranchProcedurePrices.find((item) => item.branchId === input.branchId && item.procedureTypeId === input.procedureTypeId);
    if (existing) { Object.assign(existing, input); return clone(existing); }
    const price: BranchProcedurePrice = { id: id(), clinicId: snapshot.clinic.id, ...input };
    demoBranchProcedurePrices.push(price);
    return clone(price);
  },
  async getDashboard() {
    const today = new Date().toISOString().slice(0, 10);
    const appointments = snapshot.appointments.filter((item) => item.startsAt.slice(0, 10) === today).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const waiting = appointments.filter((item) => ['checked-in', 'waiting', 'in-chair'].includes(item.status));
    const tasks = snapshot.tasks.filter((item) => item.status !== 'done' && item.status !== 'cancelled').sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''));
    const missedCalls = snapshot.communications.filter((item) => item.channel === 'call' && item.status === 'missed' && item.requiresFollowUp);
    const labDue = snapshot.labCases.filter((item) => item.dueAt?.slice(0, 10) === today || item.status === 'delayed');
    const overdueInvoices = snapshot.invoices.filter((item) => item.status === 'overdue');
    const followUps = tasks.filter((item) => ['callback', 'clinical', 'recall'].includes(item.category));
    const collectionsToday = snapshot.payments.filter((item) => item.receivedAt.slice(0, 10) === today && item.status === 'completed').reduce((sum, item) => sum + item.amount, 0);
    const outstanding = snapshot.invoices.reduce((sum, item) => sum + item.balance, 0);
    const data: DashboardData = {
      clinic: snapshot.clinic,
      currentStaff: currentStaff(),
      appointments,
      waiting,
      tasks,
      missedCalls,
      labDue,
      overdueInvoices,
      followUps,
      metrics: {
        appointmentsToday: appointments.length,
        confirmed: appointments.filter((item) => item.status === 'confirmed').length,
        waiting: appointments.filter((item) => item.status === 'waiting' || item.status === 'checked-in').length,
        inChair: appointments.filter((item) => item.status === 'in-chair').length,
        unconfirmed: appointments.filter((item) => item.status === 'awaiting-confirmation' || item.status === 'requested').length,
        collectionsToday,
        outstanding,
        missedCalls: missedCalls.length
      }
    };
    return clone(data);
  },
  async listPatients(filters?: PatientFilters) {
    let rows = [...snapshot.patients];
    if (filters?.query) {
      const query = filters.query.toLowerCase();
      rows = rows.filter((item) => [item.displayName, item.phone, item.email, item.patientNumber, ...item.tags].filter(Boolean).join(' ').toLowerCase().includes(query));
    }
    if (filters?.flag === 'medical-alerts') rows = rows.filter((item) => item.medicalAlerts.length > 0);
    if (filters?.flag === 'incomplete-intake') rows = rows.filter((item) => !item.intakeComplete || !item.intakeVerified);
    if (filters?.flag === 'outstanding') rows = rows.filter((item) => item.balance > 0);
    if (filters?.flag === 'recall') rows = rows.filter((item) => item.recallStatus === 'due' || item.recallStatus === 'overdue');
    if (filters?.flag === 'pending-treatment') rows = rows.filter((item) => item.activeTreatmentStage && item.activeTreatmentStage !== 'completed');
    return clone(rows.sort((a, b) => a.displayName.localeCompare(b.displayName)));
  },
  async getPatientRecord(patientId: string) { return clone(patientRecord(patientId)); },
  async createPatient(input: CreatePatientInput) {
    const now = new Date().toISOString();
    const patient: Patient = {
      id: id(), clinicId: snapshot.clinic.id, patientNumber: `DF-${String(1041 + snapshot.patients.length).padStart(5, '0')}`,
      firstName: input.firstName, lastName: input.lastName, displayName: `${input.firstName} ${input.lastName}`,
      dateOfBirth: input.dateOfBirth, age: Math.max(0, new Date().getFullYear() - Number(input.dateOfBirth.slice(0, 4))), gender: input.gender,
      phone: normalizePhone(input.phone), email: input.email || undefined, preferredLanguage: input.preferredLanguage,
      preferredContact: input.preferredContact, tags: ['New patient'], medicalAlerts: [
        ...(input.allergies ? [{ id: id(), label: input.allergies, severity: 'high' as const, category: 'allergy' as const }] : []),
        ...(input.medicalConditions ? [{ id: id(), label: input.medicalConditions, severity: 'moderate' as const, category: 'condition' as const }] : [])
      ], medications: input.medications ? input.medications.split(',').map((name) => ({ id: id(), name: name.trim() })) : [],
      intakeComplete: true, intakeVerified: false, whatsappConsent: input.whatsappConsent, photoConsent: input.photoConsent,
      marketingConsent: false, balance: 0, lifetimeValue: 0, createdAt: now, updatedAt: now,
      emergencyContact: input.emergencyName && input.emergencyPhone ? { name: input.emergencyName, relationship: input.emergencyRelationship || 'Emergency contact', phone: normalizePhone(input.emergencyPhone) } : undefined
    };
    snapshot.patients.unshift(patient);
    return clone(patient);
  },
  async listAppointments(filters?: AppointmentFilters) {
    let rows = [...snapshot.appointments];
    if (filters?.date) rows = rows.filter((item) => item.startsAt.slice(0, 10) === filters.date);
    if (filters?.doctorId) rows = rows.filter((item) => item.doctorId === filters.doctorId);
    if (filters?.chairId) rows = rows.filter((item) => item.chairId === filters.chairId);
    if (filters?.status) rows = rows.filter((item) => item.status === filters.status);
    return clone(rows.sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
  },
  async getAppointment(appointmentId: string) {
    const appointment = snapshot.appointments.find((item) => item.id === appointmentId);
    if (!appointment) throw new Error('Appointment not found');
    return clone(appointment);
  },
  async createAppointment(input: CreateAppointmentInput) {
    const patient = snapshot.patients.find((item) => item.id === input.patientId);
    const doctor = snapshot.staff.find((item) => item.id === input.doctorId);
    const procedure = snapshot.procedures.find((item) => item.id === input.procedureTypeId);
    if (!patient || !doctor || !procedure) throw new Error('Patient, doctor, or procedure was not found');
    const starts = new Date(input.startsAt);
    const ends = new Date(starts.getTime() + input.durationMinutes * 60_000);
    const appointment: Appointment = {
      id: id(), clinicId: snapshot.clinic.id, patientId: patient.id, patientName: patient.displayName,
      doctorId: doctor.id, doctorName: doctor.name, chairId: input.chairId, chairName: `Chair ${input.chairId.slice(-1)}`,
      procedureTypeId: procedure.id, procedureName: procedure.name, status: input.sendWhatsapp ? 'awaiting-confirmation' : 'confirmed',
      startsAt: starts.toISOString(), endsAt: ends.toISOString(), durationMinutes: input.durationMinutes, internalNote: input.internalNote,
      source: 'staff', confirmationStatus: input.sendWhatsapp ? 'sent' : 'confirmed', reminderStatus: 'scheduled', estimatedFee: procedure.defaultFee,
      depositRequired: input.requestDeposit ? input.depositAmount ?? 0 : 0, depositPaid: 0,
      readiness: { intakeComplete: patient.intakeComplete, medicalHistoryVerified: patient.intakeVerified, consentReady: !procedure.requiresConsent, labCaseReady: true, paymentReady: patient.balance < 10000 },
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    snapshot.appointments.push(appointment);
    patient.nextAppointmentAt = appointment.startsAt;
    if (input.sendWhatsapp) {
      snapshot.communications.unshift({ id: id(), clinicId: snapshot.clinic.id, patientId: patient.id, patientName: patient.displayName, channel: 'whatsapp', direction: 'outbound', status: 'queued', body: `Appointment confirmation for ${appointment.startsAt}`, unread: false, requiresFollowUp: false, relatedAppointmentId: appointment.id, occurredAt: new Date().toISOString() });
    }
    return clone(appointment);
  },
  async transitionAppointment(appointmentId: string, status: AppointmentStatus) {
    const appointment = snapshot.appointments.find((item) => item.id === appointmentId);
    if (!appointment) throw new Error('Appointment not found');
    if (!canTransitionAppointment(appointment.status, status)) throw new Error(`Cannot move appointment from ${appointment.status} to ${status}`);
    appointment.status = status;
    appointment.updatedAt = new Date().toISOString();
    if (status === 'checked-in') appointment.checkedInAt = appointment.updatedAt;
    if (status === 'in-chair') appointment.chairStartedAt = appointment.updatedAt;
    if (status === 'completed') appointment.completedAt = appointment.updatedAt;
    return clone(appointment);
  },
  async listCommunications() { return clone([...snapshot.communications].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))); },
  async listBookingRequests() { return clone([...demoBookingRequests].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))); },
  async setBookingRequestStatus(requestId, status, patientId) { const item=demoBookingRequests.find((row)=>row.id===requestId); if(item){item.status=status;item.patientId=patientId;} },
  async createCommunication(input: CreateCommunicationInput) {
    const patient = input.patientId ? snapshot.patients.find((item) => item.id === input.patientId) : undefined;
    const item: Communication = {
      id: id(), clinicId: snapshot.clinic.id, patientId: input.patientId, patientName: patient?.displayName,
      channel: input.channel, direction: 'outbound', status: input.channel === 'call' ? 'completed' : 'queued',
      subject: input.subject, body: input.body, phone: input.phone ?? patient?.phone, email: input.email ?? patient?.email,
      unread: false, requiresFollowUp: input.requiresFollowUp ?? false, followUpAt: input.followUpAt,
      assignedTo: input.requiresFollowUp ? currentStaff().id : undefined, relatedAppointmentId: input.relatedAppointmentId,
      occurredAt: new Date().toISOString(), callOutcome: input.channel === 'call' ? 'answered' : undefined
    };
    snapshot.communications.unshift(item);
    return clone(item);
  },
  async markCommunicationRead(communicationId: string) {
    const item = snapshot.communications.find((row) => row.id === communicationId);
    if (item) item.unread = false;
  },
  async createClinicalNote(input: CreateClinicalNoteInput) {
    snapshot.notes.unshift({
      id: id(), clinicId: snapshot.clinic.id, patientId: input.patientId, appointmentId: input.appointmentId,
      authorId: currentStaff().id, authorName: currentStaff().name, status: input.status,
      chiefComplaint: input.chiefComplaint, medicalUpdate: input.medicalUpdate, examination: input.examination,
      findings: input.findings, assessment: input.assessment, procedurePerformed: input.procedurePerformed,
      anaesthetic: input.anaesthetic, materials: input.materials, medication: input.medication, advice: input.advice,
      followUp: input.followUp, toothNumbers: input.toothNumbers, aiGenerated: input.aiGenerated ?? false,
      aiSourceIds: input.aiSourceIds ?? [], signedAt: input.status === 'signed' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });
  },
  async listTasks() { return clone([...snapshot.tasks].sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''))); },
  async createTask(input: CreateTaskInput) {
    const assignee = snapshot.staff.find((item) => item.id === input.assignedTo) ?? currentStaff();
    const task = { id: id(), clinicId: snapshot.clinic.id, title: input.title, description: input.description, patientId: input.patientId, appointmentId: input.appointmentId, assignedTo: assignee.id, assignedToName: assignee.name, createdBy: currentStaff().id, priority: input.priority, status: 'open' as const, dueAt: input.dueAt, category: input.category, createdAt: new Date().toISOString() };
    snapshot.tasks.unshift(task); return clone(task);
  },
  async setTaskStatus(taskId: string, status: 'open' | 'in-progress' | 'done' | 'cancelled') {
    const task = snapshot.tasks.find((item) => item.id === taskId);
    if (task) { task.status = status; task.completedAt = status === 'done' ? new Date().toISOString() : undefined; }
  },
  async listInvoices() { return clone([...snapshot.invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))); },
  async recordPayment(input: RecordPaymentInput) {
    const invoice = input.invoiceId ? snapshot.invoices.find((item) => item.id === input.invoiceId) : undefined;
    const payment: Payment = {
      id: id(), clinicId: snapshot.clinic.id, patientId: input.patientId, invoiceId: input.invoiceId,
      receiptNumber: `RCPT-${new Date().getFullYear()}-${2300 + snapshot.payments.length + 1}`,
      amount: input.amount, method: input.method, reference: input.reference, receivedAt: new Date().toISOString(),
      receivedBy: currentStaff().id, status: 'completed'
    };
    snapshot.payments.unshift(payment);
    if (invoice) {
      const relatedPayments = snapshot.payments.filter((item) => item.invoiceId === invoice.id);
      invoice.paid = relatedPayments.reduce((sum, item) => sum + item.amount - (item.refundAmount ?? 0), 0);
      invoice.balance = calculateInvoiceBalance(invoice.total, relatedPayments);
      invoice.status = deriveInvoiceStatus(invoice.total, invoice.balance, invoice.dueAt);
    }
    const patient = snapshot.patients.find((item) => item.id === input.patientId);
    if (patient) patient.balance = snapshot.invoices.filter((item) => item.patientId === patient.id).reduce((sum, item) => sum + item.balance, 0);
    return clone(payment);
  },
  async listTreatmentPlans() { return clone(snapshot.treatmentPlans); },
  async createTreatmentPlan(input: CreateTreatmentPlanInput) {
    const items = input.items.map((item) => ({ ...item, id: id(), total: Math.max(0, item.quantity * item.unitFee - item.discount + item.tax), status: 'proposed' as const }));
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitFee, 0); const discount = items.reduce((sum, item) => sum + item.discount, 0); const tax = items.reduce((sum, item) => sum + item.tax, 0);
    const plan = { id: id(), clinicId: snapshot.clinic.id, patientId: input.patientId, title: input.title, stage: 'proposed' as const, items, subtotal, discount, tax, total: subtotal - discount + tax, expiresAt: input.expiresAt, createdBy: currentStaff().id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    snapshot.treatmentPlans.unshift(plan); const patient = snapshot.patients.find((p) => p.id === input.patientId); if (patient) patient.activeTreatmentStage = 'proposed'; return clone(plan);
  },
  async createConsent(input: CreateConsentInput) {
    const consent = { id: id(), clinicId: snapshot.clinic.id, patientId: input.patientId, appointmentId: input.appointmentId, templateId: id(), templateName: input.templateName, version: 1, language: input.language, status: 'sent' as const, guardianName: input.guardianName, witnessName: input.witnessName, sentAt: new Date().toISOString(), expiresAt: input.expiresAt };
    snapshot.consents.unshift(consent); return clone(consent);
  },
  async createPrescription(input: CreatePrescriptionInput) {
    const prescription = { id: id(), clinicId: snapshot.clinic.id, patientId: input.patientId, appointmentId: input.appointmentId, prescribedBy: currentStaff().id, prescribedByName: currentStaff().name, items: input.items.map((item) => ({ ...item, id: id() })), allergyWarningAcknowledged: input.allergyWarningAcknowledged, notes: input.notes, issuedAt: new Date().toISOString() };
    snapshot.prescriptions.unshift(prescription); return clone(prescription);
  },
  async listLabCases() { return clone(snapshot.labCases); },
  async createLabCase(input: CreateLabCaseInput) {
    const patient = snapshot.patients.find((p) => p.id === input.patientId); if (!patient) throw new Error('Patient not found');
    const lab = { id: id(), clinicId: snapshot.clinic.id, patientId: input.patientId, patientName: patient.displayName, appointmentId: input.appointmentId, labName: input.labName, caseType: input.caseType, toothNumbers: input.toothNumbers, shade: input.shade, impressionType: input.impressionType, status: 'draft' as const, dueAt: input.dueAt, cost: input.cost, note: input.note, attachmentCount: 0 };
    snapshot.labCases.unshift(lab); return clone(lab);
  },
  async listInventory() { return clone(snapshot.inventory); },
  async upsertInventory(input: UpsertInventoryInput) {
    const existing = input.id ? snapshot.inventory.find((item) => item.id === input.id) : undefined;
    const status = input.currentQuantity <= 0 ? 'out' as const : input.currentQuantity <= input.minimumQuantity ? 'low' as const : input.expiresAt && new Date(input.expiresAt) <= new Date(Date.now() + 30 * 86400000) ? 'expiring' as const : 'healthy' as const;
    const value = { id: existing?.id ?? id(), clinicId: snapshot.clinic.id, ...input, status };
    if (existing) Object.assign(existing, value); else snapshot.inventory.unshift(value); return clone(value);
  },
  async listAutomations() { return clone(snapshot.automations); },
  async createAutomation(input: CreateAutomationInput) {
    const item = { id: id(), clinicId: snapshot.clinic.id, name: input.name, trigger: input.trigger, action: input.action, channel: input.channel, enabled: true, runCount: 0, failureCount: 0 };
    snapshot.automations.unshift(item); return clone(item);
  },
  async setAutomationEnabled(automationId: string, enabled: boolean) {
    const item = snapshot.automations.find((row) => row.id === automationId);
    if (item) item.enabled = enabled;
  },
  async listTemplates() { return clone(snapshot.templates); },
  async createTemplate(input: CreateTemplateInput) {
    const item = { id: id(), clinicId: snapshot.clinic.id, name: input.name, channel: input.channel, category: input.category, body: input.body, variables: input.variables, approved: input.approved, active: true };
    snapshot.templates.unshift(item); return clone(item);
  },
  async inviteStaff(input: InviteStaffInput) {
    const item = { id: id(), clinicId: snapshot.clinic.id, name: input.name, initials: input.name.split(/\s+/).map((p) => p[0]).join('').slice(0,2).toUpperCase(), role: input.role, phone: input.phone, email: input.email, active: true, colorToken: 'slate' as const, availability: 'off' as const };
    snapshot.staff.push(item); return clone(item);
  },
  async updateStaff(input: UpdateStaffInput) {
    const member = snapshot.staff.find((item) => item.id === input.id); if (!member) throw new Error('Staff member not found');
    Object.assign(member, { name: input.name, initials: input.name.split(/\s+/).map((part) => part[0]).join('').slice(0,2).toUpperCase(), role: input.role, phone: input.phone, active: input.active, availability: input.availability });
    return clone(member);
  },
  async updateTemplate(input: UpdateTemplateInput) {
    const item = snapshot.templates.find((row) => row.id === input.id); if (!item) throw new Error('Template not found');
    Object.assign(item, { name: input.name, channel: input.channel, category: input.category, body: input.body, variables: input.variables, approved: input.approved, active: input.active }); return clone(item);
  },
  async signConsent(input: SignConsentInput) {
    const consent = snapshot.consents.find((row) => row.id === input.consentId); if (!consent) throw new Error('Consent not found');
    Object.assign(consent, { status: 'signed' as const, signedByName: input.signedByName, guardianName: input.guardianName, witnessName: input.witnessName, signatureData: input.signatureData, signedAt: new Date().toISOString() }); return clone(consent);
  },
  async withdrawConsent(consentId: string, reason: string) {
    const consent = snapshot.consents.find((row) => row.id === consentId); if (!consent) throw new Error('Consent not found');
    if (!['signed','sent','draft'].includes(consent.status)) throw new Error('Consent cannot be withdrawn from its current state');
    Object.assign(consent, { status: 'withdrawn' as const, withdrawnAt: new Date().toISOString(), withdrawalReason: reason }); return clone(consent);
  },
  async refundPayment(input: RefundPaymentInput) {
    const payment = snapshot.payments.find((row) => row.id === input.paymentId); if (!payment) throw new Error('Payment not found');
    if (input.amount <= 0 || input.amount > payment.amount - (payment.refundAmount ?? 0)) throw new Error('Refund amount exceeds the refundable balance.');
    payment.refundAmount = (payment.refundAmount ?? 0) + input.amount; payment.status = payment.refundAmount >= payment.amount ? 'refunded' : 'partially-refunded';
    const invoice = payment.invoiceId ? snapshot.invoices.find((row) => row.id === payment.invoiceId) : undefined;
    if (invoice) { const related = snapshot.payments.filter((row) => row.invoiceId === invoice.id); invoice.paid = related.reduce((sum,row)=>sum+row.amount-(row.refundAmount??0),0); invoice.balance=calculateInvoiceBalance(invoice.total,related); invoice.status=deriveInvoiceStatus(invoice.total,invoice.balance,invoice.dueAt); }
    const patient=snapshot.patients.find((row)=>row.id===payment.patientId); if(patient) patient.balance=snapshot.invoices.filter((row)=>row.patientId===patient.id).reduce((sum,row)=>sum+row.balance,0);
    return clone(payment);
  },
  async recordInventoryMovement(input: RecordInventoryMovementInput) {
    const item=snapshot.inventory.find((row)=>row.id===input.inventoryItemId); if(!item) throw new Error('Inventory item not found');
    const positive=input.type==='purchase'||input.type==='return'; item.currentQuantity=Math.max(0,item.currentQuantity+(positive?input.quantity:-input.quantity));
    item.status=item.currentQuantity<=0?'out':item.currentQuantity<=item.minimumQuantity?'low':item.expiresAt&&new Date(item.expiresAt)<=new Date(Date.now()+30*86400000)?'expiring':'healthy'; return clone(item);
  },
  async listAuditLogs() { return clone([...snapshot.auditLogs].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))); },
  async askPatientHistory(patientId: string, question: string) {
    const record = patientRecord(patientId);
    const q = question.toLowerCase();
    if (q.includes('allerg')) {
      const alerts = record.patient.medicalAlerts.filter((item) => item.category === 'allergy');
      return { answer: alerts.length ? alerts.map((item) => `${item.label}${item.detail ? ` — ${item.detail}` : ''}`).join('\n') : 'No allergy is recorded in the current patient record.', sources: alerts.map((item) => ({ id: item.id, label: 'Verified medical alert', occurredAt: item.verifiedAt ?? record.patient.updatedAt })) };
    }
    if (q.includes('balance') || q.includes('unpaid') || q.includes('payment')) {
      return { answer: `The current outstanding balance is ₹${record.patient.balance.toLocaleString('en-IN')}.`, sources: record.invoices.filter((item) => item.balance > 0).map((item) => ({ id: item.id, label: `${item.invoiceNumber} — ₹${item.balance.toLocaleString('en-IN')} due`, occurredAt: item.issuedAt })) };
    }
    if (q.includes('tooth') || /\b[1-4][1-8]\b/.test(q)) {
      const tooth = Number(q.match(/\b[1-4][1-8]\b/)?.[0]);
      const notes = tooth ? record.notes.filter((item) => item.toothNumbers.includes(tooth)) : record.notes;
      return { answer: notes.length ? notes.map((item) => `${item.createdAt.slice(0, 10)}: ${item.procedurePerformed || item.findings || item.chiefComplaint}`).join('\n') : 'No matching tooth-specific history was found.', sources: notes.map((item) => ({ id: item.id, label: item.authorName, occurredAt: item.createdAt })) };
    }
    const latest = record.timeline.slice(0, 5);
    return { answer: latest.length ? `The latest relevant history includes: ${latest.map((item) => item.title).join('; ')}.` : 'No matching history was found.', sources: latest.map((item) => ({ id: item.id, label: item.title, occurredAt: item.occurredAt })) };
  }
};

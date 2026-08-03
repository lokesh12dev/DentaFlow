import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clinicRepository, type AppointmentFilters, type CreateAppointmentInput, type CreateClinicalNoteInput, type CreateCommunicationInput, type CreatePatientInput, type PatientFilters, type RecordPaymentInput, type CreateTaskInput, type CreateTreatmentPlanInput, type CreateConsentInput, type CreatePrescriptionInput, type CreateLabCaseInput, type UpsertInventoryInput, type CreateAutomationInput, type CreateTemplateInput, type InviteStaffInput, type UpdateClinicInput, type CreateFamilyGroupInput, type UpdateStaffInput, type UpdateTemplateInput, type SignConsentInput, type RefundPaymentInput, type RecordInventoryMovementInput, type UpsertBranchProcedurePriceInput } from '@/repositories';
import type { AppointmentStatus, Task } from '@/domain/types';

export const queryKeys = {
  clinic: ['clinic'] as const,
  staff: ['staff'] as const,
  branches: ['branches'] as const,
  chairs: (branchId?: string) => ['chairs', branchId ?? 'all'] as const,
  families: ['families'] as const,
  procedures: ['procedures'] as const,
  branchProcedurePrices: (branchId: string) => ['branch-procedure-prices', branchId] as const,
  dashboard: ['dashboard'] as const,
  patients: (filters?: PatientFilters) => ['patients', filters ?? {}] as const,
  patient: (id: string) => ['patient', id] as const,
  appointments: (filters?: AppointmentFilters) => ['appointments', filters ?? {}] as const,
  appointment: (id: string) => ['appointment', id] as const,
  communications: ['communications'] as const,
  bookingRequests: ['booking-requests'] as const,
  tasks: ['tasks'] as const,
  invoices: ['invoices'] as const,
  treatmentPlans: ['treatment-plans'] as const,
  labs: ['labs'] as const,
  inventory: ['inventory'] as const,
  automations: ['automations'] as const,
  templates: ['templates'] as const,
  audit: ['audit'] as const
};

const invalidateCore = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    queryClient.invalidateQueries({ queryKey: ['patients'] }),
    queryClient.invalidateQueries({ queryKey: ['appointments'] }),
    queryClient.invalidateQueries({ queryKey: ['patient'] })
  ]);
};

export const useClinic = () => useQuery({ queryKey: queryKeys.clinic, queryFn: () => clinicRepository.getClinic() });
export const useBranches = () => useQuery({ queryKey: queryKeys.branches, queryFn: () => clinicRepository.listBranches(), staleTime: 1000 * 60 * 15 });
export const useChairs = (branchId?: string) => useQuery({ queryKey: queryKeys.chairs(branchId), queryFn: () => clinicRepository.listChairs(branchId), staleTime: 1000 * 60 * 15 });
export const useFamilyGroups = () => useQuery({ queryKey: queryKeys.families, queryFn: () => clinicRepository.listFamilyGroups() });
export const useStaff = () => useQuery({ queryKey: queryKeys.staff, queryFn: () => clinicRepository.listStaff() });
export const useProcedures = () => useQuery({ queryKey: queryKeys.procedures, queryFn: () => clinicRepository.listProcedures(), staleTime: 1000 * 60 * 30 });
export const useBranchProcedurePrices = (branchId: string) => useQuery({ queryKey: queryKeys.branchProcedurePrices(branchId), queryFn: () => clinicRepository.listBranchProcedurePrices(branchId), enabled: Boolean(branchId), staleTime: 1000 * 60 * 10 });
export const useDashboard = () => useQuery({ queryKey: queryKeys.dashboard, queryFn: () => clinicRepository.getDashboard(), refetchInterval: 60_000 });
export const usePatients = (filters?: PatientFilters) => useQuery({ queryKey: queryKeys.patients(filters), queryFn: () => clinicRepository.listPatients(filters) });
export const usePatientRecord = (id: string) => useQuery({ queryKey: queryKeys.patient(id), queryFn: () => clinicRepository.getPatientRecord(id), enabled: Boolean(id) });
export const useAppointments = (filters?: AppointmentFilters) => useQuery({ queryKey: queryKeys.appointments(filters), queryFn: () => clinicRepository.listAppointments(filters) });
export const useAppointment = (id: string) => useQuery({ queryKey: queryKeys.appointment(id), queryFn: () => clinicRepository.getAppointment(id), enabled: Boolean(id) });
export const useCommunications = () => useQuery({ queryKey: queryKeys.communications, queryFn: () => clinicRepository.listCommunications(), refetchInterval: 45_000 });
export const useBookingRequests = () => useQuery({ queryKey: queryKeys.bookingRequests, queryFn: () => clinicRepository.listBookingRequests(), refetchInterval: 60_000 });
export const useTasks = () => useQuery({ queryKey: queryKeys.tasks, queryFn: () => clinicRepository.listTasks() });
export const useInvoices = () => useQuery({ queryKey: queryKeys.invoices, queryFn: () => clinicRepository.listInvoices() });
export const useTreatmentPlans = () => useQuery({ queryKey: queryKeys.treatmentPlans, queryFn: () => clinicRepository.listTreatmentPlans() });
export const useLabCases = () => useQuery({ queryKey: queryKeys.labs, queryFn: () => clinicRepository.listLabCases() });
export const useInventory = () => useQuery({ queryKey: queryKeys.inventory, queryFn: () => clinicRepository.listInventory() });
export const useAutomations = () => useQuery({ queryKey: queryKeys.automations, queryFn: () => clinicRepository.listAutomations() });
export const useTemplates = () => useQuery({ queryKey: queryKeys.templates, queryFn: () => clinicRepository.listTemplates() });
export const useAuditLogs = () => useQuery({ queryKey: queryKeys.audit, queryFn: () => clinicRepository.listAuditLogs() });

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreatePatientInput) => clinicRepository.createPatient(input), onSuccess: () => invalidateCore(qc) });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateAppointmentInput) => clinicRepository.createAppointment(input), onSuccess: () => invalidateCore(qc) });
}

export function useTransitionAppointment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => clinicRepository.transitionAppointment(id, status), onSuccess: async (_, variables) => { await invalidateCore(qc); await qc.invalidateQueries({ queryKey: queryKeys.appointment(variables.id) }); } });
}

export function useCreateCommunication() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateCommunicationInput) => clinicRepository.createCommunication(input), onSuccess: async () => { await qc.invalidateQueries({ queryKey: queryKeys.communications }); await qc.invalidateQueries({ queryKey: ['patient'] }); await qc.invalidateQueries({ queryKey: queryKeys.dashboard }); } });
}

export function useMarkCommunicationRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => clinicRepository.markCommunicationRead(id), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.communications }) });
}

export function useCreateClinicalNote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateClinicalNoteInput) => clinicRepository.createClinicalNote(input), onSuccess: async (_, input) => { await qc.invalidateQueries({ queryKey: queryKeys.patient(input.patientId) }); await qc.invalidateQueries({ queryKey: queryKeys.dashboard }); } });
}

export function useSetTaskStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: Task['status'] }) => clinicRepository.setTaskStatus(id, status), onSuccess: async () => { await qc.invalidateQueries({ queryKey: queryKeys.tasks }); await qc.invalidateQueries({ queryKey: queryKeys.dashboard }); } });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: RecordPaymentInput) => clinicRepository.recordPayment(input), onSuccess: async (_, input) => { await qc.invalidateQueries({ queryKey: queryKeys.invoices }); await qc.invalidateQueries({ queryKey: queryKeys.patient(input.patientId) }); await qc.invalidateQueries({ queryKey: queryKeys.dashboard }); } });
}

export function useSetAutomationEnabled() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => clinicRepository.setAutomationEnabled(id, enabled), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.automations }) });
}

export function usePatientHistoryQuestion(patientId: string) {
  return useMutation({ mutationFn: (question: string) => clinicRepository.askPatientHistory(patientId, question) });
}


export function useUpdateClinic() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpdateClinicInput) => clinicRepository.updateClinic(input), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.clinic }) });
}
export function useCreateFamilyGroup() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateFamilyGroupInput) => clinicRepository.createFamilyGroup(input), onSuccess: async () => { await qc.invalidateQueries({ queryKey: queryKeys.families }); await qc.invalidateQueries({ queryKey: ['patients'] }); } });
}
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateTaskInput) => clinicRepository.createTask(input), onSuccess: async () => { await qc.invalidateQueries({ queryKey: queryKeys.tasks }); await qc.invalidateQueries({ queryKey: queryKeys.dashboard }); } });
}
export function useCreateTreatmentPlan() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateTreatmentPlanInput) => clinicRepository.createTreatmentPlan(input), onSuccess: async (_, input) => { await qc.invalidateQueries({ queryKey: queryKeys.treatmentPlans }); await qc.invalidateQueries({ queryKey: queryKeys.patient(input.patientId) }); } });
}
export function useCreateConsent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateConsentInput) => clinicRepository.createConsent(input), onSuccess: async (_, input) => qc.invalidateQueries({ queryKey: queryKeys.patient(input.patientId) }) });
}
export function useCreatePrescription() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreatePrescriptionInput) => clinicRepository.createPrescription(input), onSuccess: async (_, input) => qc.invalidateQueries({ queryKey: queryKeys.patient(input.patientId) }) });
}
export function useCreateLabCase() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateLabCaseInput) => clinicRepository.createLabCase(input), onSuccess: async (_, input) => { await qc.invalidateQueries({ queryKey: queryKeys.labs }); await qc.invalidateQueries({ queryKey: queryKeys.patient(input.patientId) }); } });
}
export function useUpsertInventory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpsertInventoryInput) => clinicRepository.upsertInventory(input), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.inventory }) });
}
export function useCreateAutomation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateAutomationInput) => clinicRepository.createAutomation(input), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.automations }) });
}
export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateTemplateInput) => clinicRepository.createTemplate(input), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.templates }) });
}
export function useInviteStaff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: InviteStaffInput) => clinicRepository.inviteStaff(input), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.staff }) });
}


export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpdateStaffInput) => clinicRepository.updateStaff(input), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.staff }) });
}
export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpdateTemplateInput) => clinicRepository.updateTemplate(input), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.templates }) });
}
export function useSignConsent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: SignConsentInput) => clinicRepository.signConsent(input), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['patient'] }); await qc.invalidateQueries({ queryKey: ['appointments'] }); } });
}
export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: RefundPaymentInput) => clinicRepository.refundPayment(input), onSuccess: async () => { await qc.invalidateQueries({ queryKey: queryKeys.invoices }); await qc.invalidateQueries({ queryKey: ['patient'] }); await qc.invalidateQueries({ queryKey: queryKeys.dashboard }); } });
}
export function useRecordInventoryMovement() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: RecordInventoryMovementInput) => clinicRepository.recordInventoryMovement(input), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.inventory }) });
}

export function useSetBookingRequestStatus() {
  const qc=useQueryClient(); return useMutation({mutationFn:({id,status,patientId}:{id:string;status:import('@/domain/types').BookingRequest['status'];patientId?:string})=>clinicRepository.setBookingRequestStatus(id,status,patientId),onSuccess:async()=>{await qc.invalidateQueries({queryKey:queryKeys.bookingRequests});await qc.invalidateQueries({queryKey:queryKeys.dashboard});}});
}

export function useUpsertBranchProcedurePrice() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpsertBranchProcedurePriceInput) => clinicRepository.upsertBranchProcedurePrice(input), onSuccess: async (_, input) => { await qc.invalidateQueries({ queryKey: queryKeys.branchProcedurePrices(input.branchId) }); await qc.invalidateQueries({ queryKey: queryKeys.procedures }); } });
}

export function useWithdrawConsent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ consentId, reason }: { consentId: string; reason: string }) => clinicRepository.withdrawConsent(consentId, reason), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['patient'] }); await qc.invalidateQueries({ queryKey: ['appointments'] }); } });
}

import type {
  Appointment,
  AuditLog,
  AutomationRule,
  Branch,
  Chair,
  ClinicSnapshot,
  ClinicalMedia,
  ClinicalNote,
  Communication,
  Consent,
  FamilyGroup,
  InventoryItem,
  Invoice,
  LabCase,
  MessageTemplate,
  Patient,
  Payment,
  Prescription,
  ProcedureType,
  StaffMember,
  Task,
  TimelineEvent,
  ToothRecord,
  TreatmentPlan
} from '@/domain/types';

const clinicId = '10000000-0000-4000-8000-000000000001';
const staffIds = {
  owner: '20000000-0000-4000-8000-000000000001',
  dentist: '20000000-0000-4000-8000-000000000002',
  dentist2: '20000000-0000-4000-8000-000000000003',
  reception: '20000000-0000-4000-8000-000000000004',
  assistant: '20000000-0000-4000-8000-000000000005',
  billing: '20000000-0000-4000-8000-000000000006'
};

const patientIds = [
  '30000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000003',
  '30000000-0000-4000-8000-000000000004',
  '30000000-0000-4000-8000-000000000005',
  '30000000-0000-4000-8000-000000000006',
  '30000000-0000-4000-8000-000000000007',
  '30000000-0000-4000-8000-000000000008',
  '30000000-0000-4000-8000-000000000009',
  '30000000-0000-4000-8000-000000000010'
] as const;
const procedureIds = Array.from({ length: 9 }, (_, index) => `40000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
const appointmentIds = Array.from({ length: 14 }, (_, index) => `50000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);

function at(days: number, hour: number, minute = 0): string {
  const value = new Date();
  value.setDate(value.getDate() + days);
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
}

function day(days: number): string {
  return at(days, 12).slice(0, 10);
}

function uid(prefix: string, index: number): string {
  const safe = prefix.replace(/[^a-f0-9]/gi, '').slice(0, 8).padEnd(8, 'a');
  return `${safe}-0000-4000-8000-${String(index).padStart(12, '0')}`;
}


const branches: Branch[] = [
  { id: '11000000-0000-4000-8000-000000000001', clinicId, name: 'ECR Main Clinic', code: 'ECR-01', address: { line1: '18 Beach Road', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600041', country: 'India' }, phone: '+914424441122', email: 'care@harbourdental.demo', active: true },
  { id: '11000000-0000-4000-8000-000000000002', clinicId, name: 'Adyar Consultation Centre', code: 'ADY-02', address: { line1: '42 First Avenue', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600020', country: 'India' }, phone: '+914424441133', active: true }
];
const chairs: Chair[] = [
  { id: '12000000-0000-4000-8000-000000000001', clinicId, branchId: branches[0]!.id, name: 'Chair 1', room: 'Operatory A', active: true },
  { id: '12000000-0000-4000-8000-000000000002', clinicId, branchId: branches[0]!.id, name: 'Chair 2', room: 'Operatory B', active: true },
  { id: '12000000-0000-4000-8000-000000000003', clinicId, branchId: branches[0]!.id, name: 'Surgery', room: 'Surgical suite', active: true },
  { id: '12000000-0000-4000-8000-000000000004', clinicId, branchId: branches[1]!.id, name: 'Consult 1', room: 'Consultation room', active: true }
];
const familyGroups: FamilyGroup[] = [
  { id: '13000000-0000-4000-8000-000000000001', clinicId, name: 'Iyer family', primaryPatientId: patientIds[0], billingPatientId: patientIds[0], notes: 'Shared family billing and guardian contact.', createdAt: at(-190, 10) }
];

const staff: StaffMember[] = [
  { id: staffIds.owner, clinicId, name: 'Dr. Maya Raman', initials: 'MR', role: 'owner', phone: '+919840000001', email: 'maya@dentaflow.demo', active: true, colorToken: 'navy', availability: 'available' },
  { id: staffIds.dentist, clinicId, name: 'Dr. Arjun Nair', initials: 'AN', role: 'dentist', phone: '+919840000002', email: 'arjun@dentaflow.demo', active: true, colorToken: 'teal', availability: 'busy' },
  { id: staffIds.dentist2, clinicId, name: 'Dr. Sara Khan', initials: 'SK', role: 'dentist', phone: '+919840000003', email: 'sara@dentaflow.demo', active: true, colorToken: 'blue', availability: 'available' },
  { id: staffIds.reception, clinicId, name: 'Priya Joseph', initials: 'PJ', role: 'receptionist', phone: '+919840000004', email: 'frontdesk@dentaflow.demo', active: true, colorToken: 'amber', availability: 'available' },
  { id: staffIds.assistant, clinicId, name: 'Nila Varghese', initials: 'NV', role: 'assistant', phone: '+919840000005', email: 'nila@dentaflow.demo', active: true, colorToken: 'rose', availability: 'busy' },
  { id: staffIds.billing, clinicId, name: 'Karthik S', initials: 'KS', role: 'billing', phone: '+919840000006', email: 'billing@dentaflow.demo', active: true, colorToken: 'slate', availability: 'available' }
];

const procedures: ProcedureType[] = [
  ['CONSULT', 'Consultation', 'Examination', 30, 600, false],
  ['CLEAN', 'Scaling and polishing', 'Preventive', 45, 1800, false],
  ['FILL', 'Composite filling', 'Restorative', 45, 2400, true],
  ['RCT', 'Root canal treatment', 'Endodontics', 75, 8500, true],
  ['EXTRACT', 'Extraction', 'Oral surgery', 45, 3500, true],
  ['CROWN', 'Crown preparation', 'Prosthodontics', 60, 12000, true],
  ['IMPLANT', 'Implant consultation', 'Implantology', 45, 800, false],
  ['ORTHO', 'Orthodontic review', 'Orthodontics', 30, 1200, false],
  ['EMERGENCY', 'Emergency pain visit', 'Emergency', 30, 900, false]
].map((row, index) => ({
  id: procedureIds[index]!, clinicId, code: row[0] as string, name: row[1] as string, category: row[2] as string,
  defaultDurationMinutes: row[3] as number, defaultFee: row[4] as number, requiresConsent: row[5] as boolean,
  preparationInstructions: index === 3 ? 'Eat before the visit unless the dentist instructs otherwise.' : undefined,
  followUpDays: index === 3 || index === 4 ? 7 : undefined, active: true
}));

function patient(index: number, data: Partial<Patient> & Pick<Patient, 'firstName' | 'lastName' | 'dateOfBirth' | 'phone'>): Patient {
  const id = patientIds[index]!;
  const displayName = `${data.firstName} ${data.lastName}`;
  return {
    id, clinicId, patientNumber: `DF-${String(index + 1041).padStart(5, '0')}`,
    firstName: data.firstName, lastName: data.lastName, displayName, dateOfBirth: data.dateOfBirth,
    age: new Date().getFullYear() - Number(data.dateOfBirth.slice(0, 4)), gender: data.gender ?? 'undisclosed',
    phone: data.phone, email: data.email, preferredLanguage: data.preferredLanguage ?? 'English',
    preferredContact: data.preferredContact ?? 'whatsapp', tags: data.tags ?? [], medicalAlerts: data.medicalAlerts ?? [],
    medications: data.medications ?? [], intakeComplete: data.intakeComplete ?? true, intakeVerified: data.intakeVerified ?? true,
    whatsappConsent: data.whatsappConsent ?? true, photoConsent: data.photoConsent ?? false, marketingConsent: false,
    balance: data.balance ?? 0, lifetimeValue: data.lifetimeValue ?? 0, nextAppointmentAt: data.nextAppointmentAt,
    lastVisitAt: data.lastVisitAt, recallDueAt: data.recallDueAt, recallStatus: data.recallStatus,
    activeTreatmentStage: data.activeTreatmentStage, createdAt: at(-260 + index * 11, 10), updatedAt: at(-index, 12),
    alternatePhone: data.alternatePhone, address: data.address, emergencyContact: data.emergencyContact,
    guardianPatientId: data.guardianPatientId, familyGroupId: data.familyGroupId, photoUrl: data.photoUrl
  };
}

const patients: Patient[] = [
  patient(0, { firstName: 'Ananya', lastName: 'Iyer', dateOfBirth: '1992-04-18', phone: '+919884211420', email: 'ananya@example.com', gender: 'female', tags: ['VIP', 'Anxious patient'], medicalAlerts: [{ id: uid('alert', 1), label: 'Penicillin allergy', detail: 'Reported facial swelling in 2019', severity: 'critical', category: 'allergy', verifiedAt: at(-40, 11), verifiedBy: staffIds.dentist }], medications: [{ id: uid('med', 1), name: 'Levothyroxine', dosage: '50 mcg', frequency: 'Once daily' }], balance: 4500, lifetimeValue: 41200, nextAppointmentAt: at(0, 9, 30), lastVisitAt: at(-18, 10), recallDueAt: day(120), recallStatus: 'due-soon', activeTreatmentStage: 'started', photoConsent: true }),
  patient(1, { firstName: 'Rohit', lastName: 'Menon', dateOfBirth: '1985-09-03', phone: '+919790441280', email: 'rohit@example.com', gender: 'male', tags: ['Implant'], medicalAlerts: [{ id: uid('alert', 2), label: 'Type 2 diabetes', detail: 'Last HbA1c reported 7.2%', severity: 'high', category: 'condition', verifiedAt: at(-20, 12), verifiedBy: staffIds.dentist2 }], medications: [{ id: uid('med', 2), name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily' }], balance: 18000, lifetimeValue: 68000, nextAppointmentAt: at(0, 10, 30), lastVisitAt: at(-14, 15), recallDueAt: day(90), recallStatus: 'due-soon', activeTreatmentStage: 'awaiting-payment', photoConsent: true }),
  patient(2, { firstName: 'Meera', lastName: 'Thomas', dateOfBirth: '1978-12-11', phone: '+919600111203', email: 'meera@example.com', gender: 'female', tags: ['Recall overdue'], medicalAlerts: [{ id: uid('alert', 3), label: 'Hypertension', detail: 'Controlled with medication', severity: 'moderate', category: 'condition', verifiedAt: at(-120, 10), verifiedBy: staffIds.owner }], medications: [{ id: uid('med', 3), name: 'Telmisartan', dosage: '40 mg', frequency: 'Once daily' }], balance: 0, lifetimeValue: 24600, nextAppointmentAt: at(0, 11, 30), lastVisitAt: at(-220, 11), recallDueAt: day(-40), recallStatus: 'overdue' }),
  patient(3, { firstName: 'Vikram', lastName: 'Shah', dateOfBirth: '1999-01-22', phone: '+919840992282', email: 'vikram@example.com', gender: 'male', tags: ['New patient'], intakeComplete: false, intakeVerified: false, balance: 0, lifetimeValue: 0, nextAppointmentAt: at(0, 12, 15), activeTreatmentStage: 'proposed' }),
  patient(4, { firstName: 'Fatima', lastName: 'Rahman', dateOfBirth: '1990-06-16', phone: '+919500340455', email: 'fatima@example.com', gender: 'female', preferredLanguage: 'Tamil', tags: ['Orthodontics'], medicalAlerts: [{ id: uid('alert', 4), label: 'Pregnancy — second trimester', severity: 'high', category: 'pregnancy', verifiedAt: at(-8, 10), verifiedBy: staffIds.dentist2 }], balance: 2400, lifetimeValue: 32700, nextAppointmentAt: at(0, 14), lastVisitAt: at(-31, 14), recallDueAt: day(150), recallStatus: 'scheduled', activeTreatmentStage: 'started', photoConsent: true }),
  patient(5, { firstName: 'Aravind', lastName: 'Kumar', dateOfBirth: '1967-03-28', phone: '+919841556103', email: 'aravind@example.com', gender: 'male', tags: ['Cardiac history'], medicalAlerts: [{ id: uid('alert', 5), label: 'Cardiac stent', detail: 'Stent placed in 2022; antiplatelet therapy', severity: 'critical', category: 'condition', verifiedAt: at(-15, 13), verifiedBy: staffIds.owner }, { id: uid('alert', 6), label: 'Aspirin therapy', severity: 'high', category: 'medication' }], medications: [{ id: uid('med', 4), name: 'Aspirin', dosage: '75 mg', frequency: 'Once daily' }], balance: 1200, lifetimeValue: 19900, nextAppointmentAt: at(0, 15), lastVisitAt: at(-65, 12), activeTreatmentStage: 'awaiting-consent' }),
  patient(6, { firstName: 'Diya', lastName: 'Prakash', dateOfBirth: '2014-08-09', phone: '+919840701702', gender: 'female', preferredContact: 'call', tags: ['Child'], guardianPatientId: patientIds[7], familyGroupId: '31000000-0000-4000-8000-000000000001', intakeComplete: true, balance: 0, lifetimeValue: 6700, nextAppointmentAt: at(1, 9), lastVisitAt: at(-95, 9), recallDueAt: day(1), recallStatus: 'due' }),
  patient(7, { firstName: 'Lakshmi', lastName: 'Prakash', dateOfBirth: '1984-02-01', phone: '+919840701702', email: 'lakshmi@example.com', gender: 'female', tags: ['Family account'], familyGroupId: '31000000-0000-4000-8000-000000000001', balance: 0, lifetimeValue: 9600, nextAppointmentAt: at(2, 16), lastVisitAt: at(-180, 15), recallDueAt: day(-10), recallStatus: 'contacted' }),
  patient(8, { firstName: 'Naveen', lastName: 'Bose', dateOfBirth: '1995-11-30', phone: '+919700013142', email: 'naveen@example.com', gender: 'male', tags: ['Missed call'], intakeComplete: false, intakeVerified: false, balance: 0, lifetimeValue: 0 }),
  patient(9, { firstName: 'Shalini', lastName: 'Rao', dateOfBirth: '1988-07-07', phone: '+919810992123', email: 'shalini@example.com', gender: 'female', tags: ['Cosmetic'], balance: 7500, lifetimeValue: 28400, nextAppointmentAt: at(1, 11), lastVisitAt: at(-29, 10), activeTreatmentStage: 'estimate-shared', photoConsent: true })
];

const appointmentRows: [number, number, number, number, number, string, Appointment['status'], string, string][] = [
  [0, 0, 9, 30, 60, 'Root canal — tooth 46', 'confirmed', staffIds.dentist, 'Chair 1'],
  [1, 0, 10, 30, 45, 'Implant review', 'checked-in', staffIds.owner, 'Chair 2'],
  [2, 0, 11, 30, 45, 'Scaling and polishing', 'waiting', staffIds.dentist2, 'Chair 3'],
  [3, 0, 12, 15, 30, 'New patient consultation', 'awaiting-confirmation', staffIds.owner, 'Chair 1'],
  [4, 0, 14, 0, 30, 'Orthodontic review', 'in-chair', staffIds.dentist2, 'Chair 3'],
  [5, 0, 15, 0, 45, 'Extraction consultation', 'confirmed', staffIds.owner, 'Chair 2'],
  [6, 1, 9, 0, 30, 'Pediatric recall', 'confirmed', staffIds.dentist2, 'Chair 3'],
  [9, 1, 11, 0, 60, 'Veneer preparation', 'confirmed', staffIds.owner, 'Chair 1'],
  [7, 2, 16, 0, 30, 'Recall examination', 'requested', staffIds.dentist, 'Chair 2'],
  [0, -18, 10, 0, 60, 'Root canal access opening', 'completed', staffIds.dentist, 'Chair 1'],
  [1, -14, 15, 0, 45, 'Implant planning', 'completed', staffIds.owner, 'Chair 2'],
  [4, -31, 14, 0, 30, 'Orthodontic adjustment', 'completed', staffIds.dentist2, 'Chair 3'],
  [5, -65, 12, 0, 45, 'Comprehensive examination', 'completed', staffIds.owner, 'Chair 2'],
  [2, -220, 11, 0, 45, 'Routine cleaning', 'completed', staffIds.dentist2, 'Chair 3']
];

const appointments: Appointment[] = appointmentRows.map((row, index) => {
  const [patientIndex, dayOffset, hour, minute, duration, procedureName, status, doctorId, chairName] = row;
  const patientItem = patients[patientIndex]!;
  const doctor = staff.find((item) => item.id === doctorId)!;
  const startsAt = at(dayOffset, hour, minute);
  const ends = new Date(startsAt); ends.setMinutes(ends.getMinutes() + duration);
  return {
    id: appointmentIds[index]!, clinicId, patientId: patientItem.id, patientName: patientItem.displayName,
    doctorId, doctorName: doctor.name, chairId: uid('chair', Number(chairName.slice(-1))), chairName,
    procedureTypeId: procedures.find((item) => procedureName.toLowerCase().includes(item.name.split(' ')[0]!.toLowerCase()))?.id,
    procedureName, status, startsAt, endsAt: ends.toISOString(), durationMinutes: duration,
    source: index === 3 ? 'phone' : index === 6 ? 'whatsapp' : 'staff',
    confirmationStatus: status === 'awaiting-confirmation' ? 'sent' : status === 'requested' ? 'not-sent' : 'confirmed',
    reminderStatus: dayOffset >= 0 ? 'scheduled' : 'sent', estimatedFee: 600 + index * 450,
    depositRequired: index === 7 ? 3000 : 0, depositPaid: index === 7 ? 3000 : 0,
    checkedInAt: ['checked-in', 'waiting', 'in-chair', 'completed'].includes(status) ? at(dayOffset, hour, Math.max(0, minute - 10)) : undefined,
    chairStartedAt: ['in-chair', 'completed'].includes(status) ? startsAt : undefined,
    completedAt: status === 'completed' ? ends.toISOString() : undefined,
    readiness: {
      intakeComplete: patientItem.intakeComplete,
      medicalHistoryVerified: patientItem.intakeVerified,
      consentReady: !['Root canal — tooth 46', 'Extraction consultation', 'Veneer preparation'].includes(procedureName),
      labCaseReady: !procedureName.toLowerCase().includes('veneer'),
      paymentReady: patientItem.balance < 10000
    },
    createdAt: at(dayOffset - 12, 10), updatedAt: at(dayOffset - 1, 12)
  };
});

const communications: Communication[] = [
  { id: uid('comm', 1), clinicId, patientId: patientIds[8], patientName: patients[8]!.displayName, channel: 'call', direction: 'inbound', status: 'missed', phone: patients[8]!.phone, unread: true, requiresFollowUp: true, followUpAt: at(0, 18), assignedTo: staffIds.reception, occurredAt: at(0, 8, 12) },
  { id: uid('comm', 2), clinicId, patientId: patientIds[3], patientName: patients[3]!.displayName, channel: 'whatsapp', direction: 'outbound', status: 'delivered', subject: 'Appointment confirmation', body: 'Please confirm your consultation today at 12:15 PM.', unread: false, requiresFollowUp: true, followUpAt: at(0, 10, 30), relatedAppointmentId: appointmentIds[3], occurredAt: at(-1, 12) },
  { id: uid('comm', 3), clinicId, patientId: patientIds[0], patientName: patients[0]!.displayName, channel: 'whatsapp', direction: 'inbound', status: 'read', body: 'Pain is better today, but I still feel sensitivity.', unread: true, requiresFollowUp: true, assignedTo: staffIds.dentist, occurredAt: at(0, 8, 42) },
  { id: uid('comm', 4), clinicId, patientId: patientIds[1], patientName: patients[1]!.displayName, channel: 'email', direction: 'outbound', status: 'delivered', subject: 'Implant estimate', body: 'Your treatment estimate and staged payment schedule are attached.', unread: false, requiresFollowUp: false, occurredAt: at(-3, 14) },
  { id: uid('comm', 5), clinicId, patientId: patientIds[5], patientName: patients[5]!.displayName, channel: 'call', direction: 'outbound', status: 'completed', phone: patients[5]!.phone, callDurationSeconds: 188, callOutcome: 'answered', unread: false, requiresFollowUp: false, occurredAt: at(-1, 17, 10) },
  { id: uid('comm', 6), clinicId, patientId: patientIds[7], patientName: patients[7]!.displayName, channel: 'sms', direction: 'outbound', status: 'sent', body: 'Your recall is overdue. Reply to book a convenient slot.', unread: false, requiresFollowUp: true, followUpAt: at(2, 10), occurredAt: at(-2, 11) },
  { id: uid('comm', 7), clinicId, patientId: patientIds[9], patientName: patients[9]!.displayName, channel: 'whatsapp', direction: 'inbound', status: 'read', body: 'Can I split the veneer payment into two parts?', unread: true, requiresFollowUp: true, assignedTo: staffIds.billing, occurredAt: at(0, 9, 3) },
  { id: uid('comm', 8), clinicId, channel: 'call', direction: 'inbound', status: 'missed', phone: '+919780001002', unread: true, requiresFollowUp: true, followUpAt: at(0, 17), assignedTo: staffIds.reception, occurredAt: at(0, 9, 18) }
];

const tasks: Task[] = [
  { id: uid('task', 1), clinicId, title: 'Call back Naveen Bose', description: 'Missed inquiry call. Ask about reason for visit and preferred time.', patientId: patientIds[8], assignedTo: staffIds.reception, assignedToName: 'Priya Joseph', createdBy: staffIds.reception, priority: 'urgent', status: 'open', dueAt: at(0, 18), category: 'callback', createdAt: at(0, 8, 14) },
  { id: uid('task', 2), clinicId, title: 'Verify cardiac clearance', description: 'Confirm current antiplatelet instructions before extraction planning.', patientId: patientIds[5], appointmentId: appointmentIds[5], assignedTo: staffIds.owner, assignedToName: 'Dr. Maya Raman', createdBy: staffIds.assistant, priority: 'urgent', status: 'in-progress', dueAt: at(0, 13), category: 'clinical', createdAt: at(-2, 14) },
  { id: uid('task', 3), clinicId, title: 'Collect implant stage payment', patientId: patientIds[1], appointmentId: appointmentIds[1], assignedTo: staffIds.billing, assignedToName: 'Karthik S', createdBy: staffIds.owner, priority: 'high', status: 'open', dueAt: at(0, 10), category: 'payment', createdAt: at(-5, 10) },
  { id: uid('task', 4), clinicId, title: 'Check veneer case delivery', patientId: patientIds[9], assignedTo: staffIds.assistant, assignedToName: 'Nila Varghese', createdBy: staffIds.owner, priority: 'high', status: 'open', dueAt: at(0, 16), category: 'lab', createdAt: at(-7, 15) },
  { id: uid('task', 5), clinicId, title: 'Confirm new-patient intake', patientId: patientIds[3], appointmentId: appointmentIds[3], assignedTo: staffIds.reception, assignedToName: 'Priya Joseph', createdBy: staffIds.reception, priority: 'high', status: 'open', dueAt: at(0, 11), category: 'admin', createdAt: at(-1, 12) },
  { id: uid('task', 6), clinicId, title: 'Contact overdue recalls', description: 'Work through the overdue list and record outcomes.', assignedTo: staffIds.reception, assignedToName: 'Priya Joseph', createdBy: staffIds.owner, priority: 'normal', status: 'open', dueAt: at(1, 17), category: 'recall', createdAt: at(-1, 16) },
  { id: uid('task', 7), clinicId, title: 'Reorder composite capsules', assignedTo: staffIds.assistant, assignedToName: 'Nila Varghese', createdBy: staffIds.assistant, priority: 'normal', status: 'open', dueAt: at(2, 12), category: 'inventory', createdAt: at(-1, 9) }
];

const notes: ClinicalNote[] = [
  { id: uid('note', 1), clinicId, patientId: patientIds[0]!, appointmentId: appointmentIds[9], authorId: staffIds.dentist, authorName: 'Dr. Arjun Nair', status: 'signed', chiefComplaint: 'Spontaneous pain in lower-right posterior region for three days.', examination: 'Deep occlusal caries on 46. Tender to percussion. No swelling.', findings: 'Pulpal involvement suspected. Periapical radiograph reviewed.', assessment: 'Symptomatic irreversible pulpitis with apical periodontitis — clinician assessment.', procedurePerformed: 'Access opening and canal negotiation completed under rubber dam.', anaesthetic: '2% lignocaine with adrenaline, inferior alveolar nerve block.', materials: 'Sodium hypochlorite irrigation; temporary restorative material.', advice: 'Avoid chewing on the treated side and contact the clinic if swelling develops.', followUp: 'Complete biomechanical preparation at the next visit.', toothNumbers: [46], aiGenerated: false, aiSourceIds: [], signedAt: at(-18, 11), createdAt: at(-18, 10, 40), updatedAt: at(-18, 11) },
  { id: uid('note', 2), clinicId, patientId: patientIds[1]!, appointmentId: appointmentIds[10], authorId: staffIds.owner, authorName: 'Dr. Maya Raman', status: 'signed', chiefComplaint: 'Missing lower-left molar; patient requests fixed replacement.', examination: 'Healed ridge at 36 region. Adequate keratinised tissue.', findings: 'CBCT reviewed; bone volume appears suitable pending final measurements.', assessment: 'Potential implant candidate; diabetes control requires confirmation.', procedurePerformed: 'Digital scan and implant planning records.', advice: 'Obtain recent HbA1c report before surgical appointment.', followUp: 'Review investigations and finalise plan.', toothNumbers: [36], aiGenerated: false, aiSourceIds: [], signedAt: at(-14, 16), createdAt: at(-14, 15, 40), updatedAt: at(-14, 16) },
  { id: uid('note', 3), clinicId, patientId: patientIds[4]!, appointmentId: appointmentIds[11], authorId: staffIds.dentist2, authorName: 'Dr. Sara Khan', status: 'signed', examination: 'Alignment progressing. Mild gingival inflammation around lower anterior brackets.', findings: 'Archwire intact. Oral hygiene requires reinforcement.', procedurePerformed: 'Archwire adjustment and elastic instruction.', advice: 'Use interdental brush twice daily. Review immediately if bracket loosens.', followUp: 'Orthodontic review in four weeks.', toothNumbers: [31, 32, 41, 42], aiGenerated: false, aiSourceIds: [], signedAt: at(-31, 14, 28), createdAt: at(-31, 14), updatedAt: at(-31, 14, 28) }
];

const media: ClinicalMedia[] = [
  { id: uid('media', 1), clinicId, patientId: patientIds[0], appointmentId: appointmentIds[9], kind: 'xray', title: 'Pre-operative periapical — tooth 46', storagePath: 'demo/patients/ananya/46-preop.jpg', mimeType: 'image/jpeg', sizeBytes: 420000, toothNumbers: [46], capturedAt: at(-18, 10, 20), capturedBy: staffIds.dentist, aiSummary: 'Deep radiolucency approaching the pulp chamber; clinician review required.', aiStatus: 'reviewed', sourcePreserved: true },
  { id: uid('media', 2), clinicId, patientId: patientIds[1], appointmentId: appointmentIds[10], kind: 'scan', title: 'Implant planning scan — 36 region', storagePath: 'demo/patients/rohit/36-scan.dcm', mimeType: 'application/dicom', sizeBytes: 6800000, toothNumbers: [36], capturedAt: at(-14, 15, 20), capturedBy: staffIds.owner, aiStatus: 'not-requested', sourcePreserved: true },
  { id: uid('media', 3), clinicId, patientId: patientIds[4], appointmentId: appointmentIds[11], kind: 'photo', title: 'Orthodontic progress — frontal', storagePath: 'demo/patients/fatima/ortho-front.jpg', mimeType: 'image/jpeg', sizeBytes: 990000, toothNumbers: [], capturedAt: at(-31, 14, 5), capturedBy: staffIds.dentist2, aiStatus: 'not-requested', sourcePreserved: true },
  { id: uid('media', 4), clinicId, patientId: patientIds[0], appointmentId: appointmentIds[9], kind: 'audio', title: 'Chairside voice note', storagePath: 'demo/patients/ananya/voice-2026.m4a', mimeType: 'audio/m4a', sizeBytes: 850000, toothNumbers: [46], capturedAt: at(-18, 10, 35), capturedBy: staffIds.dentist, aiExtractedText: 'Patient reports severe night pain. Tooth 46 tender. Access opened and temporary restoration placed.', aiStatus: 'reviewed', sourcePreserved: true }
];

const teeth: ToothRecord[] = [
  { toothNumber: 46, condition: 'root-canal', surfaces: ['O'], note: 'RCT in progress', updatedAt: at(-18, 11) },
  { toothNumber: 36, condition: 'missing', surfaces: [], note: 'Implant planned', updatedAt: at(-14, 16) },
  { toothNumber: 16, condition: 'crown', surfaces: [], note: 'PFM crown placed 2023', updatedAt: at(-330, 12) },
  { toothNumber: 26, condition: 'filled', surfaces: ['O', 'D'], updatedAt: at(-210, 12) },
  { toothNumber: 11, condition: 'watch', surfaces: ['B'], note: 'Early white-spot lesion', updatedAt: at(-40, 10) }
];

const treatmentPlans: TreatmentPlan[] = [
  { id: uid('plan', 1), clinicId, patientId: patientIds[0], title: 'Complete endodontic treatment — 46', stage: 'started', items: [{ id: uid('planitem', 1), procedureTypeId: procedureIds[3], procedureName: 'Root canal treatment', toothNumbers: [46], quantity: 1, unitFee: 8500, discount: 0, tax: 0, total: 8500, status: 'in-progress' }, { id: uid('planitem', 2), procedureTypeId: procedureIds[5], procedureName: 'Ceramic crown', toothNumbers: [46], quantity: 1, unitFee: 12000, discount: 1000, tax: 0, total: 11000, status: 'proposed' }], subtotal: 20500, discount: 1000, tax: 0, total: 19500, acceptedAt: at(-20, 12), createdBy: staffIds.dentist, createdAt: at(-20, 11), updatedAt: at(-18, 11) },
  { id: uid('plan', 2), clinicId, patientId: patientIds[1], title: 'Implant-supported crown — 36', stage: 'awaiting-payment', items: [{ id: uid('planitem', 3), procedureName: 'Implant placement', toothNumbers: [36], quantity: 1, unitFee: 42000, discount: 0, tax: 0, total: 42000, status: 'accepted' }, { id: uid('planitem', 4), procedureName: 'Implant crown', toothNumbers: [36], quantity: 1, unitFee: 18000, discount: 2000, tax: 0, total: 16000, status: 'accepted' }], subtotal: 60000, discount: 2000, tax: 0, total: 58000, acceptedAt: at(-12, 10), createdBy: staffIds.owner, createdAt: at(-14, 16), updatedAt: at(-3, 14) },
  { id: uid('plan', 3), clinicId, patientId: patientIds[9], title: 'Anterior veneer enhancement', stage: 'estimate-shared', items: [{ id: uid('planitem', 5), procedureName: 'Ceramic veneer', toothNumbers: [11, 12, 21, 22], quantity: 4, unitFee: 11000, discount: 4000, tax: 0, total: 40000, status: 'proposed' }], subtotal: 44000, discount: 4000, tax: 0, total: 40000, expiresAt: day(14), createdBy: staffIds.owner, createdAt: at(-4, 11), updatedAt: at(-1, 12) }
];

const invoices: Invoice[] = [
  { id: uid('invoice', 1), clinicId, patientId: patientIds[0], invoiceNumber: 'INV-2026-1044', status: 'partial', issuedAt: at(-20, 12), dueAt: at(2, 18), items: [  { id: uid('invitem', 1), description: 'Root canal treatment — 46', toothNumbers: [46], quantity: 1, unitPrice: 8500, discount: 0, tax: 0, taxRateCgst: 0, taxRateSgst: 0, total: 8500 }], subtotal: 8500, discount: 0, tax: 0, taxRateCgst: 0, taxRateSgst: 0, total: 8500, paid: 4000, balance: 4500, insuranceContribution: 0, patientContribution: 8500 },
  { id: uid('invoice', 2), clinicId, patientId: patientIds[1], invoiceNumber: 'INV-2026-1038', status: 'overdue', issuedAt: at(-12, 10), dueAt: at(-3, 18), items: [  { id: uid('invitem', 2), description: 'Implant treatment stage 1', toothNumbers: [36], quantity: 1, unitPrice: 30000, discount: 0, tax: 0, taxRateCgst: 0, taxRateSgst: 0, total: 30000 }], subtotal: 30000, discount: 0, tax: 0, taxRateCgst: 0, taxRateSgst: 0, total: 30000, paid: 12000, balance: 18000, insuranceContribution: 0, patientContribution: 30000 },
  { id: uid('invoice', 3), clinicId, patientId: patientIds[4], invoiceNumber: 'INV-2026-1009', status: 'partial', issuedAt: at(-31, 14), dueAt: at(10, 18), items: [  { id: uid('invitem', 3), description: 'Orthodontic monthly adjustment', toothNumbers: [], quantity: 1, unitPrice: 3600, discount: 0, tax: 0, taxRateCgst: 0, taxRateSgst: 0, total: 3600 }], subtotal: 3600, discount: 0, tax: 0, taxRateCgst: 0, taxRateSgst: 0, total: 3600, paid: 1200, balance: 2400, insuranceContribution: 0, patientContribution: 3600 },
  { id: uid('invoice', 4), clinicId, patientId: patientIds[5], invoiceNumber: 'INV-2026-0992', status: 'overdue', issuedAt: at(-65, 13), dueAt: at(-45, 18), items: [  { id: uid('invitem', 4), description: 'Comprehensive examination and radiographs', toothNumbers: [], quantity: 1, unitPrice: 2400, discount: 0, tax: 0, taxRateCgst: 0, taxRateSgst: 0, total: 2400 }], subtotal: 2400, discount: 0, tax: 0, taxRateCgst: 0, taxRateSgst: 0, total: 2400, paid: 1200, balance: 1200, insuranceContribution: 0, patientContribution: 2400 },
  { id: uid('invoice', 5), clinicId, patientId: patientIds[9], invoiceNumber: 'INV-2026-1048', status: 'partial', issuedAt: at(-2, 12), dueAt: at(5, 18), items: [  { id: uid('invitem', 5), description: 'Veneer booking deposit', toothNumbers: [11, 12, 21, 22], quantity: 1, unitPrice: 10500, discount: 0, tax: 0, taxRateCgst: 0, taxRateSgst: 0, total: 10500 }], subtotal: 10500, discount: 0, tax: 0, taxRateCgst: 0, taxRateSgst: 0, total: 10500, paid: 3000, balance: 7500, insuranceContribution: 0, patientContribution: 10500 }
];

const payments: Payment[] = [
  { id: uid('payment', 1), clinicId, patientId: patientIds[0], invoiceId: invoices[0]!.id, receiptNumber: 'RCPT-2026-2301', amount: 4000, method: 'upi', reference: 'UPI-DF2301', receivedAt: at(-20, 12, 20), receivedBy: staffIds.billing, status: 'completed' },
  { id: uid('payment', 2), clinicId, patientId: patientIds[1], invoiceId: invoices[1]!.id, receiptNumber: 'RCPT-2026-2287', amount: 12000, method: 'card', reference: 'CARD-7712', receivedAt: at(-12, 10, 30), receivedBy: staffIds.billing, status: 'completed' },
  { id: uid('payment', 3), clinicId, patientId: patientIds[4], invoiceId: invoices[2]!.id, receiptNumber: 'RCPT-2026-2202', amount: 1200, method: 'upi', receivedAt: at(-31, 14, 40), receivedBy: staffIds.billing, status: 'completed' },
  { id: uid('payment', 4), clinicId, patientId: patientIds[5], invoiceId: invoices[3]!.id, receiptNumber: 'RCPT-2026-2166', amount: 1200, method: 'cash', receivedAt: at(-65, 13, 20), receivedBy: staffIds.billing, status: 'completed' },
  { id: uid('payment', 5), clinicId, patientId: patientIds[9], invoiceId: invoices[4]!.id, receiptNumber: 'RCPT-2026-2310', amount: 3000, method: 'payment-link', reference: 'PAYLINK-9931', receivedAt: at(-2, 12, 10), receivedBy: staffIds.billing, status: 'completed' }
];

const consents: Consent[] = [
  { id: uid('consent', 1), clinicId, patientId: patientIds[0], appointmentId: appointmentIds[9], templateId: uid('template', 1), templateName: 'Root canal treatment consent', version: 3, language: 'English', status: 'signed', signedByName: patients[0]!.displayName, sentAt: at(-20, 12), signedAt: at(-18, 9, 50) },
  { id: uid('consent', 2), clinicId, patientId: patientIds[1], templateId: uid('template', 2), templateName: 'Implant surgery consent', version: 2, language: 'English', status: 'sent', sentAt: at(-3, 14), expiresAt: at(14, 18) },
  { id: uid('consent', 3), clinicId, patientId: patientIds[5], appointmentId: appointmentIds[5], templateId: uid('template', 3), templateName: 'Extraction consent', version: 4, language: 'Tamil', status: 'draft' }
];

const prescriptions: Prescription[] = [
  { id: uid('rx', 1), clinicId, patientId: patientIds[0], appointmentId: appointmentIds[9], prescribedBy: staffIds.dentist, prescribedByName: 'Dr. Arjun Nair', items: [{ id: uid('rxitem', 1), medicine: 'Ibuprofen', strength: '400 mg', dosage: '1 tablet', frequency: 'After food, when required', duration: '3 days', instructions: 'Stop if gastric discomfort occurs.' }], allergyWarningAcknowledged: true, notes: 'Penicillin allergy visible; no antibiotic prescribed.', issuedAt: at(-18, 11) }
];

const labCases: LabCase[] = [
  { id: uid('labcase', 1), clinicId, patientId: patientIds[9], patientName: patients[9]!.displayName, appointmentId: appointmentIds[7], labName: 'Precision Ceramics', caseType: 'Diagnostic wax-up', toothNumbers: [11, 12, 21, 22], shade: 'BL3', impressionType: 'Digital scan', status: 'delayed', sentAt: at(-8, 12), dueAt: at(0, 16), cost: 2800, note: 'Lab requested one additional lateral image.', attachmentCount: 4 },
  { id: uid('labcase', 2), clinicId, patientId: patientIds[1], patientName: patients[1]!.displayName, labName: 'Nova Implant Lab', caseType: 'Surgical guide', toothNumbers: [36], impressionType: 'CBCT + STL', status: 'in-progress', sentAt: at(-5, 11), dueAt: at(2, 15), cost: 4500, attachmentCount: 3 },
  { id: uid('labcase', 3), clinicId, patientId: patientIds[0], patientName: patients[0]!.displayName, labName: 'Precision Ceramics', caseType: 'Zirconia crown', toothNumbers: [46], shade: 'A2', impressionType: 'Digital scan pending', status: 'draft', dueAt: at(12, 17), cost: 5200, attachmentCount: 0 }
];

const inventory: InventoryItem[] = [
  { id: uid('stock', 1), clinicId, name: 'Composite capsules — A2', sku: 'REST-COMP-A2', category: 'Restorative', supplier: 'DentPro Supplies', unit: 'capsule', currentQuantity: 8, minimumQuantity: 12, reorderQuantity: 30, batchNumber: 'CP-A2-2605', expiresAt: day(210), status: 'low', unitCost: 180, location: 'Operatory store' },
  { id: uid('stock', 2), clinicId, name: 'Lignocaine cartridges', sku: 'ANA-LIGNO-2', category: 'Anaesthetic', supplier: 'MedDental', unit: 'cartridge', currentQuantity: 42, minimumQuantity: 20, reorderQuantity: 50, batchNumber: 'LC-7781', expiresAt: day(42), status: 'expiring', unitCost: 38, location: 'Locked medication cabinet' },
  { id: uid('stock', 3), clinicId, name: 'Nitrile gloves — medium', sku: 'PPE-GLV-M', category: 'PPE', supplier: 'SafeHands', unit: 'box', currentQuantity: 18, minimumQuantity: 8, reorderQuantity: 20, status: 'healthy', unitCost: 420, location: 'Central store' },
  { id: uid('stock', 4), clinicId, name: 'Rubber dam sheets', sku: 'ENDO-RD-6', category: 'Endodontics', supplier: 'DentPro Supplies', unit: 'sheet', currentQuantity: 0, minimumQuantity: 10, reorderQuantity: 30, status: 'out', unitCost: 45, location: 'Chair 1 cabinet' },
  { id: uid('stock', 5), clinicId, name: 'Sodium hypochlorite 3%', sku: 'ENDO-NAOCL', category: 'Endodontics', supplier: 'EndoCare', unit: 'bottle', currentQuantity: 6, minimumQuantity: 3, reorderQuantity: 8, batchNumber: 'NA-2622', expiresAt: day(300), status: 'healthy', unitCost: 260, location: 'Chemical cabinet' }
];

const automations: AutomationRule[] = [
  { id: uid('auto', 1), clinicId, name: 'Appointment confirmation', trigger: 'Appointment created', action: 'Send approved WhatsApp template immediately', channel: 'whatsapp', enabled: true, lastRunAt: at(-1, 12), runCount: 684, failureCount: 7 },
  { id: uid('auto', 2), clinicId, name: '24-hour reminder', trigger: '24 hours before confirmed appointment', action: 'Send WhatsApp; use SMS when delivery fails', channel: 'whatsapp', enabled: true, lastRunAt: at(0, 9), runCount: 1210, failureCount: 18 },
  { id: uid('auto', 3), clinicId, name: 'Missed-call callback task', trigger: 'Inbound call is missed', action: 'Create urgent callback task for reception', channel: 'internal', enabled: true, lastRunAt: at(0, 9, 18), runCount: 193, failureCount: 0 },
  { id: uid('auto', 4), clinicId, name: 'Post-treatment check-in', trigger: '24 hours after extraction or root canal', action: 'Send symptom check and alert doctor on red flags', channel: 'whatsapp', enabled: true, lastRunAt: at(-2, 10), runCount: 322, failureCount: 4 },
  { id: uid('auto', 5), clinicId, name: 'Recall sequence', trigger: 'Recall becomes due', action: 'Send reminder, create call task after 7 days', channel: 'whatsapp', enabled: false, runCount: 0, failureCount: 0 }
];

const templates: MessageTemplate[] = [
  { id: uid('msgtemplate', 1), clinicId, name: 'Appointment confirmed', channel: 'whatsapp', category: 'appointment', body: 'Hello {{patient_first_name}}, your appointment with {{doctor_name}} is confirmed for {{appointment_date}} at {{appointment_time}}. Reply C to confirm or R to request a new time.', variables: ['patient_first_name', 'doctor_name', 'appointment_date', 'appointment_time'], providerTemplateId: 'appointment_confirmed_v3', approved: true, active: true },
  { id: uid('msgtemplate', 2), clinicId, name: 'Appointment confirmed (Tamil)', channel: 'whatsapp', category: 'appointment', body: 'வண "{{patient_first_name}}", உங்கள் அப்பைண்ட்மென்ட் {{doctor_name}} உடன் {{appointment_date}} அன்று {{appointment_time}} அ temu உறுதி செய்யப்பட்டது. உறுதிப்படுத்த C എന്ന് பதிலளிக்க Australia അല്ലെങ്കில் புதிய நேரம் கேட்க R என்ற பதிலளிக்க.', variables: ['patient_first_name', 'doctor_name', 'appointment_date', 'appointment_time'], providerTemplateId: 'appointment_confirmed_tamil_v1', approved: true, active: true },
  { id: uid('msgtemplate', 3), clinicId, name: 'Payment receipt', channel: 'whatsapp', category: 'billing', body: 'Thank you. We received {{amount}} for invoice {{invoice_number}}. Your receipt is attached.', variables: ['amount', 'invoice_number'], providerTemplateId: 'payment_receipt_v2', approved: true, active: true },
  { id: uid('msgtemplate', 4), clinicId, name: 'Payment receipt (Tamil)', channel: 'whatsapp', category: 'billing', body: 'நன்றி. இன்வாய்ஸ் {{invoice_number}} South African {{amount}} பெறப்பட்டது. உங்கள் ரசிதை இணைக்கப்பட்டுள்ளது.', variables: ['amount', 'invoice_number'], providerTemplateId: 'payment_receipt_tamil_v1', approved: true, active: true },
  { id: uid('msgtemplate', 5), clinicId, name: 'Post-operative check-in', channel: 'whatsapp', category: 'clinical', body: 'Hello {{patient_first_name}}, how are you feeling after yesterday’s procedure? Reply with any pain, swelling, bleeding, fever, or other concern.', variables: ['patient_first_name'], providerTemplateId: 'post_op_check_v1', approved: true, active: true },
  { id: uid('msgtemplate', 6), clinicId, name: 'Recall due', channel: 'sms', category: 'recall', body: 'Your dental review is due. Call {{clinic_phone}} or use {{booking_link}} to choose a time.', variables: ['clinic_phone', 'booking_link'], approved: true, active: true },
];

const auditLogs: AuditLog[] = [
  { id: uid('audit', 1), clinicId, actorId: staffIds.dentist, actorName: 'Dr. Arjun Nair', action: 'sign', entityType: 'clinical_note', entityId: notes[0]!.id, summary: 'Signed clinical note for Ananya Iyer', occurredAt: at(-18, 11), device: 'iPad — Chair 1' },
  { id: uid('audit', 2), clinicId, actorId: staffIds.billing, actorName: 'Karthik S', action: 'create', entityType: 'payment', entityId: payments[4]!.id, summary: 'Recorded ₹3,000 payment for Shalini Rao', occurredAt: at(-2, 12, 10), device: 'Reception desktop' },
  { id: uid('audit', 3), clinicId, actorId: staffIds.reception, actorName: 'Priya Joseph', action: 'send', entityType: 'communication', entityId: communications[1]!.id, summary: 'Sent appointment confirmation to Vikram Shah', occurredAt: at(-1, 12), device: 'Reception desktop' },
  { id: uid('audit', 4), clinicId, actorId: staffIds.owner, actorName: 'Dr. Maya Raman', action: 'read', entityType: 'patient', entityId: patientIds[5], summary: 'Viewed protected medical history for Aravind Kumar', occurredAt: at(0, 8, 55), device: 'iPhone' }
];

export function buildDemoSnapshot(): ClinicSnapshot {
  return {
    clinic: {
      id: clinicId, name: 'Harbour Dental Studio', legalName: 'Harbour Dental Studio LLP', timezone: 'Asia/Kolkata', currency: 'INR', locale: 'en-IN',
      phone: '+914424441122', email: 'care@harbourdental.demo', address: { line1: '18 Beach Road', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600041', country: 'India' },
      openingTime: '09:00', closingTime: '19:00', branchCode: 'ECR-01'
    },
    branches, chairs, familyGroups, staff, patients, procedures, appointments, communications, tasks, notes, media, teeth,
    treatmentPlans, invoices, payments, consents, prescriptions, labCases, inventory, automations, templates, auditLogs
  };
}

export function buildPatientTimeline(snapshot: ClinicSnapshot, patientId: string): TimelineEvent[] {
  const patient = snapshot.patients.find((item) => item.id === patientId);
  if (!patient) return [];
  const events: TimelineEvent[] = [];
  snapshot.appointments.filter((item) => item.patientId === patientId).forEach((item) => events.push({ id: `timeline-${item.id}`, clinicId, patientId, occurredAt: item.startsAt, type: 'appointment', title: `${item.procedureName} — ${item.status}`, description: `${item.doctorName}, ${item.chairName}`, sourceId: item.id, sourceType: 'appointment', icon: 'calendar', tone: item.status === 'completed' ? 'success' : item.status === 'cancelled' || item.status === 'no-show' ? 'danger' : 'info' }));
  snapshot.notes.filter((item) => item.patientId === patientId).forEach((item) => events.push({ id: `timeline-${item.id}`, clinicId, patientId, occurredAt: item.createdAt, type: 'clinical', title: item.status === 'signed' ? 'Clinical note signed' : 'Clinical note draft', description: item.procedurePerformed || item.findings || item.chiefComplaint, actorName: item.authorName, sourceId: item.id, sourceType: 'clinical_note', icon: 'clipboard', tone: item.status === 'signed' ? 'success' : 'warning' }));
  snapshot.communications.filter((item) => item.patientId === patientId).forEach((item) => events.push({ id: `timeline-${item.id}`, clinicId, patientId, occurredAt: item.occurredAt, type: 'communication', title: `${item.direction === 'inbound' ? 'Incoming' : 'Outgoing'} ${item.channel}`, description: item.body || item.callOutcome || item.subject, sourceId: item.id, sourceType: 'communication', icon: item.channel, tone: item.status === 'failed' || item.status === 'missed' ? 'danger' : 'neutral' }));
  snapshot.payments.filter((item) => item.patientId === patientId).forEach((item) => events.push({ id: `timeline-${item.id}`, clinicId, patientId, occurredAt: item.receivedAt, type: 'payment', title: `Payment received — ₹${item.amount.toLocaleString('en-IN')}`, description: `${item.method} · ${item.receiptNumber}`, sourceId: item.id, sourceType: 'payment', icon: 'receipt', tone: 'success' }));
  snapshot.consents.filter((item) => item.patientId === patientId).forEach((item) => events.push({ id: `timeline-${item.id}`, clinicId, patientId, occurredAt: item.signedAt || item.sentAt || at(-1, 10), type: 'consent', title: `${item.templateName} — ${item.status}`, description: `Version ${item.version} · ${item.language}`, sourceId: item.id, sourceType: 'consent', icon: 'signature', tone: item.status === 'signed' ? 'success' : item.status === 'declined' || item.status === 'withdrawn' ? 'danger' : 'warning' }));
  snapshot.labCases.filter((item) => item.patientId === patientId).forEach((item) => events.push({ id: `timeline-${item.id}`, clinicId, patientId, occurredAt: item.sentAt || item.dueAt || at(-1, 10), type: 'lab', title: `${item.caseType} — ${item.status}`, description: item.labName, sourceId: item.id, sourceType: 'lab_case', icon: 'flask', tone: item.status === 'delayed' ? 'danger' : item.status === 'received' || item.status === 'fitted' ? 'success' : 'info' }));
  return events.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

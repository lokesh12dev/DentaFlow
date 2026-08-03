from audit_common import *
a=Audit('usability-and-flow')
source='\n'.join(p.read_text(errors='ignore') for p in files('src/features/**/*.tsx'))
flows={
'patient intake':['PatientIntakeScreen','patientIntakeSchema'],
'four-step booking':['AppointmentBookingScreen','const steps','Step ${step + 1} of 4','ProgressBar'],
'appointment lifecycle':['AppointmentDetailScreen','getNextAppointmentActions'],
'clinical documentation':['ClinicalNoteScreen','ToothChart','review-required'],
'patient history':['HistoryAssistant','sources'],
'payment and receipt':['PaymentScreen','sendReceipt'],
'communication follow-up':['CommunicationComposerScreen','requiresFollowUp'],
'waiting room':['WaitingRoomScreen','in-chair'],
'lab tracking':['LaboratoryScreen','LabCaseFormScreen'],
'inventory':['InventoryScreen','InventoryItemFormScreen'],
'consent':['ConsentFormScreen','guardianName','witnessName'],
'prescription':['PrescriptionFormScreen','allergyWarningAcknowledged'],
'family account':['FamilyAccountsScreen','memberPatientIds'],
}
for name,needles in flows.items():
    for needle in needles:a.require(needle in source,'workflow-depth',f'{name} missing evidence: {needle}','src/features',severity='high')
for state in ['LoadingState','ErrorState','EmptyState']:
    count=source.count(state);a.require(count>=8,'state-coverage',f'{state} only used {count} times; operational screens need full state coverage','src/features',severity='medium')
a.require(source.count('accessibilityLabel')>=8,'accessibility-labels','Too few explicit accessibility labels in feature screens','src/features',severity='medium')
a.metrics={'workflow_checks':sum(len(v) for v in flows.values()),'loading_states':source.count('LoadingState'),'error_states':source.count('ErrorState'),'empty_states':source.count('EmptyState'),'accessibility_labels':source.count('accessibilityLabel')}
dump(a.report(),'usability.json')

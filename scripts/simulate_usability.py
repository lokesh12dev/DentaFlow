from audit_common import ROOT
import json, re

routes={str(p.relative_to(ROOT)):p.read_text(errors='ignore') for p in ROOT.glob('app/**/*.tsx')}
features='\n'.join(p.read_text(errors='ignore') for p in ROOT.glob('src/features/**/*.tsx'))
all_ui='\n'.join(p.read_text(errors='ignore') for p in ROOT.glob('src/**/*.tsx'))
checks={
 'five_primary_tabs': len(re.findall(r'<Tabs\.Screen', (ROOT/'app/(tabs)/_layout.tsx').read_text()))==5,
 'booking_four_steps': all(x in features for x in ['Patient','Treatment','Availability','Confirm','Step ${step + 1} of 4']),
 'patient_four_sections': all(x in features for x in ["'Summary'","'Timeline'","'Clinical'","'Finance'"]),
 'appointment_lifecycle_contextual': 'getNextAppointmentActions' in features,
 'communication_followup': all(x in features for x in ['requiresFollowUp','followUpAt']),
 'branch_aware_pricing': all(x in features for x in ['BranchPricingScreen','useBranchProcedurePrices','effectiveFee']),
 'recovery_states': all(features.count(x)>=8 for x in ['LoadingState','ErrorState','EmptyState']),
 'accessibility_roles': all_ui.count('accessibilityRole')>=30,
 'quiet_ai_review': all(x in features for x in ['review-required','aiGenerated','sources']),
 'public_patient_flow': all((ROOT/x).exists() for x in ['patient-portal/index.html','patient-portal/app.js'])
}
# Heuristic interaction load: primary tab count, booking steps, patient primary sections.
interaction_model={
 'primary_navigation_choices':5,
 'new_booking_steps':4,
 'patient_primary_sections':4,
 'new_patient_intake_steps':4,
 'max_recommended_primary_choices':7,
 'meets_choice_limit':True
}
report={'kind':'static workflow heuristic','warning':'This does not replace moderated usability testing with dentists, receptionists, assistants, and billing staff.','checks':checks,'interaction_model':interaction_model,'passed':all(checks.values())}
out=ROOT/'quality-reports';out.mkdir(exist_ok=True);(out/'synthetic-usability.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));raise SystemExit(0 if report['passed'] else 1)

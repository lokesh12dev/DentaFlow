import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = process.cwd();
const sourcePath = path.join(root, 'src/domain/rules.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  fileName: sourcePath,
}).outputText;
const tempPath = path.join(os.tmpdir(), `dentaflow-rules-${process.pid}.cjs`);
fs.writeFileSync(tempPath, compiled);
const rules = require(tempPath);
fs.unlinkSync(tempPath);

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed += 1; }
  catch (error) { failures.push({ name, message: error instanceof Error ? error.message : String(error) }); }
}
function equal(actual, expected, message='') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${message} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function ok(value, message='assertion failed') { if (!value) throw new Error(message); }

test('legal appointment flow reaches completion', () => {
  const flow = ['draft','requested','awaiting-confirmation','confirmed','checked-in','waiting','in-chair','completed'];
  for (let i=0;i<flow.length-1;i++) ok(rules.canTransitionAppointment(flow[i], flow[i+1]), `${flow[i]} -> ${flow[i+1]} rejected`);
});
test('completed appointment cannot return to chair', () => equal(rules.canTransitionAppointment('completed','in-chair'), false));
test('cancelled appointment is terminal', () => equal(rules.getNextAppointmentActions('cancelled'), []));
test('no-show can be rebooked', () => ok(rules.canTransitionAppointment('no-show','requested')));
test('line total applies discount before tax', () => equal(rules.calculateLineTotal({ quantity:2, unitFee:1000, discount:200, tax:90 }), 1890));
test('negative quantity cannot create negative total', () => equal(rules.calculateLineTotal({ quantity:-2, unitPrice:1000, discount:0, tax:0 }), 0));
test('partially refunded payment affects balance', () => equal(rules.calculateInvoiceBalance(5000,[{amount:3000,status:'partially-refunded',refundAmount:500}]),2500));
test('future partially paid invoice is partial', () => equal(rules.deriveInvoiceStatus(5000,1000,'2099-01-01T00:00:00Z'),'partial'));
test('past unpaid invoice is overdue', () => equal(rules.deriveInvoiceStatus(5000,5000,'2020-01-01T00:00:00Z'),'overdue'));
test('readiness score is percentage', () => equal(rules.readinessScore({intakeComplete:true,medicalHistoryVerified:true,consentReady:false,labCaseReady:true,paymentReady:false}),60));
test('critical medical alert wins risk reduction', () => equal(rules.highestMedicalRisk([{id:'1',label:'A',severity:'low',category:'other'},{id:'2',label:'B',severity:'critical',category:'allergy'}]),'critical'));
test('phone normalization retains international number', () => equal(rules.normalizePhone('+91 98765-43210'),'+919876543210'));
test('patient masking removes direct name', () => { const masked=rules.maskPatientName('Anita Sharma'); ok(!masked.includes('Anita')&&!masked.includes('Sharma')); });
test('analytics utilization uses scheduled denominator', () => {
  const now = new Date('2026-10-29T12:00:00+05:30');
  const base = { clinicId:'c', patientId:'p', patientName:'A', doctorId:'d', doctorName:'Dr', chairId:'ch', chairName:'Chair 1', procedureName:'Exam', confirmationStatus:'confirmed', reminderStatus:'sent', durationMinutes:30, endsAt:'2026-10-28T10:30:00+05:30', source:'staff' };
  const result = rules.buildClinicAnalytics({
    range: '7d',
    now,
    appointments: [
      { ...base, id:'1', status:'completed', startsAt:'2026-10-28T10:00:00+05:30' },
      { ...base, id:'2', status:'cancelled', startsAt:'2026-10-27T10:00:00+05:30' },
      { ...base, id:'3', status:'draft', startsAt:'2026-10-27T11:00:00+05:30' },
      { ...base, id:'4', status:'completed', startsAt:'2026-09-01T10:00:00+05:30' }
    ],
    invoices: [{ id:'i', clinicId:'c', patientId:'p', invoiceNumber:'INV-1', status:'overdue', issuedAt:'2026-10-01T00:00:00Z', items:[], subtotal:1000, discount:0, tax:0, total:1000, paid:0, balance:400, insuranceContribution:0, patientContribution:1000 }],
    payments: [{ id:'pay', clinicId:'c', patientId:'p', amount:600, refundAmount:100, status:'partially-refunded', method:'upi', receivedAt:'2026-10-28T12:00:00+05:30' }],
    plans: [{ id:'pl', clinicId:'c', patientId:'p', title:'Plan', stage:'started', items:[], subtotal:2000, discount:0, tax:0, total:2000, createdBy:'d', createdAt:'2026-10-20T00:00:00Z', updatedAt:'2026-10-20T00:00:00Z' }],
    tasks: [{ id:'t', clinicId:'c', title:'Call', assignedTo:'r', assignedToName:'R', createdBy:'r', priority:'normal', status:'done', category:'callback', createdAt:'2026-10-28T09:00:00+05:30', dueAt:'2026-10-28T09:00:00+05:30' }],
    patients: [{ recallStatus:'scheduled' }, { recallStatus:'overdue' }]
  });
  equal(result.appointmentCount, 2);
  equal(result.utilization, 50);
  equal(result.cancellationRate, 50);
  equal(result.collections, 500);
  equal(result.outstanding, 400);
  equal(result.followUpCompletion, 100);
  equal(result.recallCompletion, 50);
});

test('clinic analytics reports zero metrics for an empty clinic', () => {
  const result = rules.buildClinicAnalytics({ appointments: [], invoices: [], plans: [], tasks: [] });
  equal(result.appointmentCount, 0);
  equal(result.utilization, 0);
  equal(result.cancellationRate, 0);
  equal(result.followUps, 0);
  equal(result.followUpCompletion, 0);
  equal(result.collections, 0);
  equal(result.outstanding, 0);
  equal(result.acceptanceRate, 0);
  equal(result.recallCompletion, 0);
  ok(result.window.label.includes('ending'));
});

test('signed clinical note can only transition to amended', () => {
  ok(rules.canTransitionClinicalNote('signed', 'amended'), 'signed -> amended allowed');
  ok(!rules.canTransitionClinicalNote('signed', 'draft'), 'signed -> draft rejected');
  ok(!rules.canTransitionClinicalNote('signed', 'review-required'), 'signed -> review-required rejected');
  ok(!rules.canTransitionClinicalNote('signed', 'signed'), 'signed -> signed rejected');
});
test('draft clinical note can proceed to review then signed', () => {
  ok(rules.canTransitionClinicalNote('draft', 'review-required'));
  ok(rules.canTransitionClinicalNote('review-required', 'signed'));
});
test('signed consent can only transition to withdrawn or expired', () => {
  ok(rules.canTransitionConsent('signed', 'withdrawn'), 'signed -> withdrawn allowed');
  ok(rules.canTransitionConsent('signed', 'expired'), 'signed -> expired allowed');
  ok(!rules.canTransitionConsent('signed', 'sent'), 'signed -> sent rejected');
  ok(!rules.canTransitionConsent('signed', 'declined'), 'signed -> declined rejected');
  ok(!rules.canTransitionConsent('signed', 'signed'), 'signed -> signed rejected');
});

test('computeGstSplit halves tax for intrastate default', () => {
  const split = rules.computeGstSplit(900);
  equal(split.cgst, 450);
  equal(split.sgst, 450);
  ok(split.cgst + split.sgst === 900);
});
test('computeGstSplit handles odd tax amounts', () => {
  const split = rules.computeGstSplit(901);
  ok(split.cgst + split.sgst === 901);
});

const result = { passed, failed: failures.length, failures };
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);

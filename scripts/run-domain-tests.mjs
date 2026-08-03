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

const result = { passed, failed: failures.length, failures };
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);

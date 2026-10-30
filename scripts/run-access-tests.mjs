import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = process.cwd();
const sourcePath = path.join(root, 'src/domain/access.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  fileName: sourcePath,
}).outputText;
const tempPath = path.join(os.tmpdir(), `dentaflow-access-${process.pid}.cjs`);
fs.writeFileSync(tempPath, compiled);
const access = require(tempPath);
fs.unlinkSync(tempPath);

const checks = [
  ['owner administers settings', access.can('owner', 'settings.manage')],
  ['administrator manages the team', access.can('manager', 'team.manage')],
  ['dentist can sign clinical work', access.can('dentist', 'clinical.sign')],
  ['dentist cannot administer the team', !access.can('dentist', 'team.manage')],
  ['assistant manages inventory', access.can('assistant', 'inventory.manage')],
  ['assistant cannot refund payments', !access.can('assistant', 'refund.create')],
  ['reception can create patients', access.can('receptionist', 'patient.create')],
  ['reception cannot read clinical notes', !access.can('receptionist', 'clinical.read')],
  ['billing can refund payments', access.can('billing', 'refund.create')],
  ['billing cannot read clinical notes', !access.can('billing', 'clinical.read')],
  ['module route resolves its permission', access.requiredPermissionForPath('/(modules)/integrations') === 'integration.manage'],
  ['reports require report.read', access.requiredPermissionForPath('/(modules)/reports') === 'report.read'],
  ['billing cannot read inventory', !access.can('billing', 'inventory.read')],
  ['receptionist cannot read reports', !access.can('receptionist', 'report.read')],
  ['assistant cannot sign clinical notes', !access.can('assistant', 'clinical.sign')],
  ['assistant cannot create prescriptions', !access.can('assistant', 'prescription.create')],
];

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
console.log(JSON.stringify({ passed: checks.length - failures.length, failed: failures.length, failures }, null, 2));
if (failures.length) process.exit(1);

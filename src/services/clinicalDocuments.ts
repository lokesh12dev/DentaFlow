import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Clinic, Patient, Prescription } from '@/domain/types';

function escape(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]!));
}

function clinicAddress(clinic: Clinic): string {
  return [clinic.address.line1, clinic.address.line2, clinic.address.city, clinic.address.state, clinic.address.postalCode].filter(Boolean).join(', ');
}

export async function createAndSharePrescription(clinic: Clinic, patient: Patient, prescription: Prescription): Promise<string> {
  const rows = prescription.items.map((item, index) => `<tr><td>${index + 1}</td><td><strong>${escape(item.medicine)} ${escape(item.strength ?? '')}</strong><br><span class="muted">${escape(item.instructions ?? '')}</span></td><td>${escape(item.dosage)}</td><td>${escape(item.frequency)}</td><td>${escape(item.duration)}</td></tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page{margin:34px}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#17191c;font-size:13px}.header{display:flex;justify-content:space-between;border-bottom:2px solid #18324a;padding-bottom:18px}.clinic{font-size:22px;font-weight:700;color:#18324a}.muted{color:#646a73;font-size:11px}.rx{font-size:34px;color:#167d78;margin:22px 0 10px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #e4e7eb;vertical-align:top}th{font-size:11px;color:#646a73;text-transform:uppercase}.patient{padding:16px 0;display:flex;justify-content:space-between}.footer{margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end}.signature{border-top:1px solid #17191c;padding-top:8px;min-width:220px;text-align:center}</style></head><body>
  <div class="header"><div><div class="clinic">${escape(clinic.name)}</div><div class="muted">${escape(clinicAddress(clinic))}<br>${escape(clinic.phone)} · ${escape(clinic.email)}</div></div><div><strong>Prescription</strong><div class="muted">Issued ${new Date(prescription.issuedAt).toLocaleString(clinic.locale)}</div></div></div>
  <div class="patient"><div><strong>${escape(patient.displayName)}</strong><br><span class="muted">${escape(patient.patientNumber)} · DOB ${escape(patient.dateOfBirth)}</span></div><div class="muted">Allergy warning ${prescription.allergyWarningAcknowledged ? 'reviewed' : 'not acknowledged'}</div></div>
  <div class="rx">℞</div><table><thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead><tbody>${rows}</tbody></table>
  ${prescription.notes ? `<p><strong>Clinical instructions</strong><br>${escape(prescription.notes)}</p>` : ''}
  <div class="footer"><div class="muted">This prescription was generated from an authorised clinical record. Verify the patient and medicine instructions before dispensing.</div><div class="signature">${escape(prescription.prescribedByName)}<br><span class="muted">Prescribing clinician</span></div></div>
  </body></html>`;
  const result = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: `Prescription for ${patient.displayName}` });
  return result.uri;
}

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Clinic, Invoice, Patient, Payment } from '@/domain/types';
import { money } from '@/core/format';

function escape(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]!));
}

export async function createAndShareReceipt(clinic: Clinic, patient: Patient, payment: Payment, invoice?: Invoice): Promise<string> {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#17191c;padding:40px}
    .header{display:flex;justify-content:space-between;border-bottom:1px solid #e4e7eb;padding-bottom:20px}
    h1{font-size:24px;margin:0} .muted{color:#646a73}.amount{font-size:32px;font-weight:700;margin:28px 0}
    table{width:100%;border-collapse:collapse}td{padding:10px 0;border-bottom:1px solid #eceef1}.right{text-align:right}
    .footer{margin-top:36px;font-size:12px;color:#646a73}
  </style></head><body>
    <div class="header"><div><h1>${escape(clinic.name)}</h1><div class="muted">${escape(clinic.address.line1)}, ${escape(clinic.address.city)}</div></div><div><strong>RECEIPT</strong><div class="muted">${escape(payment.receiptNumber)}</div></div></div>
    <div class="amount">${money(payment.amount, clinic.currency, clinic.locale)}</div>
    <table><tr><td>Patient</td><td class="right">${escape(patient.displayName)} · ${escape(patient.patientNumber)}</td></tr>
    <tr><td>Received on</td><td class="right">${new Date(payment.receivedAt).toLocaleString(clinic.locale)}</td></tr>
    <tr><td>Payment method</td><td class="right">${escape(payment.method)}</td></tr>
    ${invoice ? `<tr><td>Invoice</td><td class="right">${escape(invoice.invoiceNumber)}</td></tr>` : ''}
    ${payment.reference ? `<tr><td>Reference</td><td class="right">${escape(payment.reference)}</td></tr>` : ''}</table>
    <div class="footer">Computer-generated receipt from DentaFlow. Contact ${escape(clinic.phone)} for questions.</div>
  </body></html>`;
  const result = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: `Receipt ${payment.receiptNumber}` });
  return result.uri;
}

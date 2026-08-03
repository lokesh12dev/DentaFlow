const PHONE = /(?:\+?\d[\d\s()-]{7,}\d)/g;
const EMAIL = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
const LONG_ID = /\b(?:DF-|UHID-|PAT-)?\d{5,}\b/g;

export function deidentifyText(input: string, patientName?: string): string {
  let output = input.replace(EMAIL, '[EMAIL]').replace(PHONE, '[PHONE]').replace(LONG_ID, '[IDENTIFIER]');
  if (patientName?.trim()) {
    const escaped = patientName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    output = output.replace(new RegExp(escaped, 'gi'), '[PATIENT]');
  }
  return output.slice(0, 30_000);
}

export async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let value = 0; for (let i = 0; i < a.length; i += 1) value |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return value === 0;
}

export async function hmacBase64Sha1(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
  let binary = '';
  for (const byte of signature) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function validateTwilioSignature(authToken: string, requestUrl: string, form: URLSearchParams, provided: string): Promise<boolean> {
  const canonical = requestUrl + [...form.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}${value}`).join('');
  return timingSafeEqual(await hmacBase64Sha1(authToken, canonical), provided);
}

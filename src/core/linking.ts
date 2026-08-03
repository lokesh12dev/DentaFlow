import { Linking, Platform } from 'react-native';
import { normalizePhone } from '@/domain/rules';

export async function callPhone(phone: string): Promise<void> {
  await Linking.openURL(`tel:${normalizePhone(phone)}`);
}

export async function emailAddress(email: string, subject?: string, body?: string): Promise<void> {
  const query = new URLSearchParams();
  if (subject) query.set('subject', subject);
  if (body) query.set('body', body);
  await Linking.openURL(`mailto:${email}${query.size ? `?${query.toString()}` : ''}`);
}

export async function openWhatsApp(phone: string, message: string): Promise<void> {
  const url = `https://wa.me/${normalizePhone(phone).replace('+', '')}?text=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
}

export async function smsPhone(phone: string, message: string): Promise<void> {
  const separator = Platform.OS === 'ios' ? '&' : '?';
  await Linking.openURL(`sms:${normalizePhone(phone)}${separator}body=${encodeURIComponent(message)}`);
}

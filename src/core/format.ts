import { format, formatDistanceToNowStrict, isToday, isTomorrow, parseISO } from 'date-fns';

export function money(value: number, currency = 'INR', locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export function time(value: string): string {
  return format(parseISO(value), 'h:mm a');
}

export function dateLabel(value: string): string {
  const date = parseISO(value);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, d MMM');
}

export function fullDate(value: string): string {
  return format(parseISO(value), 'd MMMM yyyy');
}

export function dateTime(value: string): string {
  return format(parseISO(value), 'd MMM yyyy, h:mm a');
}

export function relativeTime(value: string): string {
  return formatDistanceToNowStrict(parseISO(value), { addSuffix: true });
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

export const calendarDate = dateLabel;

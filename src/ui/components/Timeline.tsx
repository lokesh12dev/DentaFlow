import React from 'react';
import { View } from 'react-native';
import { BadgeIndianRupee, CalendarDays, ClipboardList, FileText, FlaskConical, Mail, MessageCircle, Phone, ShieldCheck } from '../icons';
import { dateTime } from '@/core/format';
import type { TimelineEvent } from '@/domain/types';
import type { LucideIcon } from '../icons';
import { spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';

const icons: Record<string, LucideIcon> = { appointment: CalendarDays, clinical: ClipboardList, communication: MessageCircle, payment: BadgeIndianRupee, consent: ShieldCheck, treatment: FileText, lab: FlaskConical, document: FileText, system: FileText, call: Phone, whatsapp: MessageCircle, email: Mail };

export function TimelineList({ events }: { events: TimelineEvent[] }) {
  const theme = useTheme();
  return <View>{events.map((event, index) => {
    const Icon = icons[event.icon] ?? icons[event.type] ?? FileText;
    const color = event.tone === 'danger' ? theme.colors.danger : event.tone === 'warning' ? theme.colors.warning : event.tone === 'success' ? theme.colors.success : event.tone === 'info' ? theme.colors.info : theme.colors.textSecondary;
    const background = event.tone === 'danger' ? theme.colors.dangerSoft : event.tone === 'warning' ? theme.colors.warningSoft : event.tone === 'success' ? theme.colors.successSoft : event.tone === 'info' ? theme.colors.infoSoft : theme.colors.surfaceTertiary;
    return <View key={event.id} style={{ flexDirection: 'row', gap: spacing[3] }}><View style={{ alignItems: 'center' }}><View style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: background, alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color={color} /></View>{index < events.length - 1 ? <View style={{ flex: 1, width: 1, minHeight: 30, backgroundColor: theme.colors.border, marginVertical: spacing[1] }} /> : null}</View><View style={{ flex: 1, paddingBottom: spacing[5], gap: 3 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}><AppText variant="bodyStrong" style={{ flex: 1 }}>{event.title}</AppText><AppText variant="caption" tone="muted" tabular>{dateTime(event.occurredAt)}</AppText></View>{event.description ? <AppText tone="secondary">{event.description}</AppText> : null}{event.actorName ? <AppText variant="caption" tone="muted">By {event.actorName}</AppText> : null}</View></View>;
  })}</View>;
}

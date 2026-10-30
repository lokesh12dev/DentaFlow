import React from 'react';
import { Pressable, View } from 'react-native';
import { AlertCircle, CalendarDays, CheckCircle2, HeartPulse, BadgeIndianRupee, Mail, MessageCircle, Phone } from '../icons';
import { APPOINTMENT_STATUS_LABELS } from '@/domain/constants';
import type { Appointment, Communication, Patient, Task } from '@/domain/types';
import { dateLabel, money, relativeTime, time } from '@/core/format';
import { radii, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';
import { Avatar } from './ListRow';
import { Badge } from './Badge';
import { AppIcon } from './AppIcon';

function appointmentTone(status: Appointment['status']) {
  if (status === 'completed') return 'success' as const;
  if (status === 'cancelled' || status === 'no-show') return 'danger' as const;
  if (status === 'waiting' || status === 'checked-in' || status === 'awaiting-confirmation') return 'warning' as const;
  if (status === 'in-chair') return 'clinical' as const;
  return 'info' as const;
}

export function AppointmentRow({ appointment, onPress, onPrimaryAction, primaryActionLabel }: { appointment: Appointment; onPress: () => void; onPrimaryAction?: () => void; primaryActionLabel?: string }) {
  const theme = useTheme();
  const missingRequirements = Object.values(appointment.readiness).filter((ready) => !ready).length;
  const railColor = appointment.status === 'in-chair' ? theme.colors.clinical : appointment.status === 'waiting' || appointment.status === 'checked-in' ? theme.colors.warning : appointment.status === 'completed' ? theme.colors.success : appointment.status === 'cancelled' || appointment.status === 'no-show' ? theme.colors.danger : theme.colors.info;
  return <View style={{ paddingVertical: spacing[3] }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${appointment.patientName}, ${appointment.procedureName}, ${time(appointment.startsAt)}`} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}>
        <View style={{ width: 50, alignItems: 'flex-end', gap: 2, paddingTop: 1 }}><AppText variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>{time(appointment.startsAt)}</AppText><AppText variant="tiny" tone="muted">{appointment.durationMinutes}m</AppText></View>
        <View accessibilityElementsHidden style={{ width: 12, minHeight: 68, alignSelf: 'stretch', alignItems: 'center' }}>
          <View style={{ position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: theme.colors.borderStrong }} />
          <View style={{ width: 9, height: 9, marginTop: 6, borderRadius: radii.pill, backgroundColor: railColor, borderWidth: 2, borderColor: theme.colors.surface }} />
        </View>
        <View style={{ flex: 1, gap: spacing[2] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}><AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{appointment.patientName}</AppText><Badge label={APPOINTMENT_STATUS_LABELS[appointment.status]} tone={appointmentTone(appointment.status)} /></View>
          <AppText tone="secondary" numberOfLines={1}>{appointment.procedureName}</AppText>
          <AppText variant="caption" tone="muted">{appointment.doctorName} · {appointment.chairName}</AppText>
          {missingRequirements ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
            <AppIcon icon={AlertCircle} size={14} tone={missingRequirements > 2 ? 'danger' : 'warning'} />
            <AppText variant="caption" tone={missingRequirements > 2 ? 'danger' : 'warning'}>{missingRequirements} requirement{missingRequirements === 1 ? '' : 's'} to verify</AppText>
          </View> : null}
        </View>
      </View>
    </Pressable>
    {onPrimaryAction && primaryActionLabel ? <Pressable accessibilityRole="button" accessibilityLabel={primaryActionLabel} onPress={onPrimaryAction} hitSlop={4} style={({ pressed }) => ({ alignSelf: 'flex-start', minHeight: 36, marginLeft: 50 + spacing[3] + 12 + spacing[3], marginTop: spacing[2], paddingHorizontal: spacing[3], borderRadius: radii.pill, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.68 : 1 })}><AppText variant="caption" style={{ color: theme.colors.primary, fontVariant: ['tabular-nums'] }}>{primaryActionLabel}</AppText></Pressable> : null}
  </View>;
}

export function PatientRow({ patient, onPress }: { patient: Patient; onPress: () => void }) {
  const critical = patient.medicalAlerts.some((alert) => alert.severity === 'critical' || alert.severity === 'high');
  const keyAlert = critical ? patient.medicalAlerts.find((alert) => alert.severity === 'critical' || alert.severity === 'high')?.label : !patient.intakeVerified ? 'Intake review needed' : patient.recallStatus === 'overdue' ? 'Recall overdue' : patient.activeTreatmentStage ? patient.activeTreatmentStage.replaceAll('-', ' ') : undefined;
  const trailing = patient.nextAppointmentAt ? `${dateLabel(patient.nextAppointmentAt)} · ${time(patient.nextAppointmentAt)}` : patient.balance > 0 ? `${money(patient.balance)} due` : 'No visit booked';
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${patient.displayName}`} onPress={onPress} style={({ pressed }) => ({ paddingVertical: spacing[3], opacity: pressed ? 0.65 : 1 })}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
      <Avatar name={patient.displayName} tone={critical ? 'danger' : 'clinical'} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{patient.displayName}</AppText>
          {critical ? <AppIcon icon={HeartPulse} size={16} tone="danger" /> : null}
        </View>
        <AppText variant="caption" tone="secondary">{patient.patientNumber} · {patient.age} years</AppText>
        {keyAlert ? <AppText variant="caption" tone={critical ? 'danger' : 'warning'} numberOfLines={1}>{keyAlert}</AppText> : null}
      </View>
      <AppText variant="caption" tone={patient.balance > 0 && !patient.nextAppointmentAt ? 'warning' : 'muted'} style={{ maxWidth: 92, textAlign: 'right', fontVariant: ['tabular-nums'] }} numberOfLines={2}>{trailing}</AppText>
    </View>
  </Pressable>;
}

export function CommunicationRow({ communication, onPress }: { communication: Communication; onPress: () => void }) {
  const theme = useTheme();
  const Icon = communication.channel === 'call' ? Phone : communication.channel === 'whatsapp' ? MessageCircle : communication.channel === 'email' ? Mail : MessageCircle;
  const failed = communication.status === 'failed' || communication.status === 'missed';
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${communication.channel} from ${communication.patientName ?? communication.phone ?? 'unknown contact'}`} onPress={onPress} style={({ pressed }) => ({ paddingVertical: spacing[3], opacity: pressed ? 0.65 : 1 })}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}><View style={{ width: 42, height: 42, borderRadius: radii.list, backgroundColor: failed ? theme.colors.dangerSoft : theme.colors.infoSoft, alignItems: 'center', justifyContent: 'center' }}><AppIcon icon={Icon} size={19} tone={failed ? 'danger' : 'information'} /></View><View style={{ flex: 1, gap: 3 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}><AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{communication.patientName ?? communication.phone ?? communication.email ?? 'Unknown contact'}</AppText>{communication.unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.clinical }} /> : null}</View><AppText tone="secondary" numberOfLines={2}>{communication.body ?? communication.subject ?? communication.callOutcome ?? (communication.status === 'missed' ? 'Missed call' : 'Communication logged')}</AppText><AppText variant="caption" tone="muted" tabular>{communication.channel} · {relativeTime(communication.occurredAt)}</AppText></View></View>
  </Pressable>;
}

export function TaskRow({ task, onPress }: { task: Task; onPress: () => void }) {
  const theme = useTheme();
  const urgent = task.priority === 'urgent' || task.priority === 'high';
  const Icon = task.category === 'callback' ? Phone : task.category === 'payment' ? BadgeIndianRupee : task.category === 'clinical' ? HeartPulse : task.category === 'recall' ? CalendarDays : task.category === 'inventory' ? AlertCircle : CheckCircle2;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${task.title}, ${task.priority} priority`} onPress={onPress} style={({ pressed }) => ({ paddingVertical: spacing[3], opacity: pressed ? 0.65 : 1 })}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}><View style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: urgent ? theme.colors.warningSoft : theme.colors.surfaceTertiary, alignItems: 'center', justifyContent: 'center' }}><AppIcon icon={Icon} size={18} tone={urgent ? 'warning' : 'default'} /></View><View style={{ flex: 1, gap: 3 }}><AppText variant="bodyStrong">{task.title}</AppText>{task.description ? <AppText tone="secondary" numberOfLines={2}>{task.description}</AppText> : null}<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}><Badge label={task.priority} tone={task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warning' : 'neutral'} /><AppText variant="caption" tone="muted" tabular>{task.assignedToName}{task.dueAt ? ` · ${relativeTime(task.dueAt)}` : ''}</AppText></View></View></View>
  </Pressable>;
}

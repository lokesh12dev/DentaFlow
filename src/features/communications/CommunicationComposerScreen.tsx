import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { CommunicationChannel } from '@/domain/types';
import { CHANNEL_LABELS } from '@/domain/constants';
import { useCreateCommunication, usePatients, useTemplates } from '@/hooks/useClinicQueries';
import { emailAddress, openWhatsApp, smsPhone } from '@/core/linking';
import { env } from '@/core/env';
import { sendProviderMessage, startPhoneCall } from '@/services/integrations';
import { useSessionStore } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';
import { Clock3, Mail, MessageCircle, Phone, Send, UserRound } from '@/ui/icons';
import { AppText, Button, Chip, Field, PageHeader, Screen, SectionHeader, Surface } from '@/ui/components';
import { spacing } from '@/ui/tokens';

const channels: CommunicationChannel[] = ['call', 'whatsapp', 'email', 'sms', 'internal'];

export function CommunicationComposerScreen() {
  const params = useLocalSearchParams<{ patientId?: string; channel?: CommunicationChannel; appointmentId?: string; replyTo?: string }>();
  const patients = usePatients();
  const templates = useTemplates();
  const create = useCreateCommunication();
  const toast = useUIStore((state) => state.showToast);
  const clinicId = useSessionStore((state) => state.activeClinicId);
  const demoMode = useSessionStore((state) => state.demoMode);
  const [patientId, setPatientId] = useState(params.patientId ?? '');
  const [channel, setChannel] = useState<CommunicationChannel>(params.channel ?? 'whatsapp');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [followUp, setFollowUp] = useState(false);
  const [followUpAt, setFollowUpAt] = useState('');
  const [sending, setSending] = useState(false);

  const patient = patients.data?.find((item) => item.id === patientId);
  const matchingTemplates = useMemo(
    () => (templates.data ?? []).filter((template) => template.channel === channel && template.active),
    [templates.data, channel]
  );
  const canSend = channel === 'internal'
    ? Boolean(body.trim())
    : Boolean(patient && (channel === 'call' || body.trim()));

  const logLocalOrFallback = async () => {
    await create.mutateAsync({
      patientId: patientId || undefined,
      channel,
      body: body || undefined,
      subject: subject || undefined,
      phone: patient?.phone,
      email: patient?.email,
      relatedAppointmentId: params.appointmentId,
      requiresFollowUp: followUp,
      followUpAt: followUpAt || undefined
    });
  };

  const openDeviceFallback = async () => {
    if (!patient) return;
    if (channel === 'whatsapp') await openWhatsApp(patient.phone, body);
    if (channel === 'email' && patient.email) await emailAddress(patient.email, subject, body);
    if (channel === 'sms') await smsPhone(patient.phone, body);
  };

  const submit = async () => {
    if (!canSend || sending) return;
    if (followUp && !followUpAt.trim()) {
      toast('Add a due date for the follow-up.', 'warning');
      return;
    }
    setSending(true);
    try {
      if (channel === 'internal') {
        await logLocalOrFallback();
        toast('Internal note added to the patient timeline.', 'success');
        router.back();
        return;
      }
      if (!patient) throw new Error('Choose a patient before communicating.');

      if (channel === 'call') {
        if (!demoMode && clinicId && env.useCloudTelephony) {
          try {
            await startPhoneCall({ clinicId, patientId: patient.id, phone: patient.phone, useCloudTelephony: true, body, relatedAppointmentId: params.appointmentId, requiresFollowUp: followUp, followUpAt: followUpAt || undefined });
            toast('Cloud call started and added to the patient timeline.', 'success');
          } catch {
            await startPhoneCall({ clinicId, patientId: patient.id, phone: patient.phone, useCloudTelephony: false });
            await logLocalOrFallback();
            toast('Cloud telephony is unavailable. The device dialler was opened and the attempt was logged.', 'warning');
          }
        } else {
          await startPhoneCall({ clinicId: clinicId ?? '', patientId: patient.id, phone: patient.phone, useCloudTelephony: false });
          await logLocalOrFallback();
          toast('Device dialler opened and the call attempt was logged.', 'success');
        }
        router.back();
        return;
      }

      if (!demoMode && clinicId && env.preferProviderMessaging) {
        try {
          await sendProviderMessage({
            clinicId,
            patientId: patient.id,
            channel,
            body,
            subject: subject || undefined,
            relatedAppointmentId: params.appointmentId,
            requiresFollowUp: followUp,
            followUpAt: followUpAt || undefined
          });
          toast(`${CHANNEL_LABELS[channel]} sent and added to the patient timeline.`, 'success');
          router.back();
          return;
        } catch {
          await openDeviceFallback();
          await logLocalOrFallback();
          toast(`${CHANNEL_LABELS[channel]} provider is unavailable. A device fallback was opened and logged.`, 'warning');
          router.back();
          return;
        }
      }

      await openDeviceFallback();
      await logLocalOrFallback();
      toast(`${CHANNEL_LABELS[channel]} opened on this device and logged.`, 'success');
      router.back();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to start communication.', 'danger');
    } finally {
      setSending(false);
    }
  };

  return <Screen>
    <PageHeader title="New communication" subtitle="One accountable interaction in the patient timeline" onBack={() => router.back()} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[4] }}>
      <Surface style={{ gap: spacing[3] }}>
        <SectionHeader title="Channel" subtitle="Patient-facing delivery or a private team note" icon={Send} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
          {channels.map((item) => <Chip key={item} label={CHANNEL_LABELS[item]} selected={channel === item} onPress={() => setChannel(item)} />)}
        </View>
        {channel === 'whatsapp' && <View style={{ gap: 2 }}><AppText variant="caption" tone="secondary">{demoMode ? 'WhatsApp: demo mode — provider delivery not configured' : env.preferProviderMessaging ? 'WhatsApp: provider delivery configured' : 'WhatsApp: device fallback only — provider not configured'}</AppText>{demoMode || !env.preferProviderMessaging ? <AppText variant="caption" tone="warning">Messages will open on this device and be logged, not sent via provider.</AppText> : null}</View>}
      </Surface>

      <Surface style={{ gap: spacing[3] }}>
        <SectionHeader title="Patient" subtitle="Attach the interaction to the correct record" icon={UserRound} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
          {patients.data?.slice(0, 12).map((item) => <Chip key={item.id} label={item.displayName} selected={patientId === item.id} onPress={() => setPatientId(item.id)} />)}
        </View>
        {patient ? <View style={{ gap: 3 }}><AppText variant="caption" tone="secondary">{patient.phone}{patient.email ? ` · ${patient.email}` : ''}</AppText>{channel === 'whatsapp' && !patient.whatsappConsent ? <AppText variant="caption" tone="danger">WhatsApp consent is not recorded. Provider delivery will be blocked.</AppText> : null}</View> : null}
      </Surface>

      {matchingTemplates.length ? <Surface style={{ gap: spacing[3] }}>
        <SectionHeader title="Approved templates" subtitle="Use reviewed clinic wording" icon={MessageCircle} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
          {matchingTemplates.map((template) => <Chip key={template.id} label={template.name} onPress={() => {
            setBody(template.body.replaceAll('{{patient_name}}', patient?.firstName ?? 'patient'));
            setSubject(template.name);
          }} />)}
        </View>
      </Surface> : null}

      <Surface style={{ gap: spacing[3] }}>
        <SectionHeader title={channel === 'call' ? 'Call preparation' : 'Message'} icon={channel === 'call' ? Phone : channel === 'email' ? Mail : MessageCircle} />
        {channel === 'email' ? <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="Email subject" /> : null}
        <Field
          label={channel === 'call' ? 'Call purpose and notes' : channel === 'internal' ? 'Internal note' : 'Message'}
          value={body}
          onChangeText={setBody}
          placeholder={channel === 'call' ? 'Reason for call and expected outcome' : 'Write a clear, respectful message'}
          multiline
        />
      </Surface>

      <Surface style={{ gap: spacing[3] }}>
        <SectionHeader title="Follow-up" subtitle="Give unanswered work an owner and due time" icon={Clock3} />
        <Chip label={followUp ? 'Follow-up required' : 'No follow-up'} selected={followUp} onPress={() => setFollowUp(!followUp)} />
        {followUp ? <Field label="Due date and time" value={followUpAt} onChangeText={setFollowUpAt} placeholder="2026-08-04T10:00:00+05:30" /> : null}
      </Surface>

      <Button
        label={channel === 'call' ? 'Start call and log' : channel === 'internal' ? 'Save internal note' : 'Send and log'}
        icon={channel === 'call' ? Phone : Send}
        disabled={!canSend}
        loading={sending || create.isPending}
        onPress={submit}
        full
      />
    </View>
  </Screen>;
}

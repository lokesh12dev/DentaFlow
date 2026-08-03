import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import type { CommunicationChannel } from '@/domain/types';
import { useBookingRequests, useCommunications, useMarkCommunicationRead } from '@/hooks/useClinicQueries';
import { useUIStore } from '@/store/uiStore';
import { CalendarDays, Inbox, Phone } from '@/ui/icons';
import { AppIcon, AppText, Chip, CommunicationRow, EmptyState, ErrorState, LoadingState, PageHeader, Screen, SectionHeader } from '@/ui/components';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';

const filters: { label: string; value: 'all' | CommunicationChannel | 'follow-up' | 'unread' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Missed calls', value: 'call' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Email', value: 'email' },
  { label: 'Follow-up', value: 'follow-up' }
];

export function InboxScreen() {
  const theme = useTheme();
  const query = useCommunications();
  const bookingRequests = useBookingRequests();
  const markRead = useMarkCommunicationRead();
  const [filter, setFilter] = useState<(typeof filters)[number]['value']>('all');
  const setCommand = useUIStore((state) => state.setCommandOpen);
  const rows = useMemo(() => (query.data ?? []).filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return item.unread;
    if (filter === 'follow-up') return item.requiresFollowUp;
    if (filter === 'call') return item.channel === 'call' && item.status === 'missed';
    return item.channel === filter;
  }), [filter, query.data]);
  const missed = (query.data ?? []).filter((item) => item.channel === 'call' && item.status === 'missed' && item.requiresFollowUp).length;
  const unread = (query.data ?? []).filter((item) => item.unread).length;
  const newBookingRequests = (bookingRequests.data ?? []).filter((item) => item.status === 'new').length;

  return <Screen>
    <PageHeader title="Inbox" subtitle={`${unread} unread`} onSearch={() => setCommand(true)} />
    <View style={{ gap: spacing[5] }}>
      {(newBookingRequests || missed) ? <View accessibilityLabel="Inbox action summary" style={{ flexDirection: 'row', paddingHorizontal: spacing[4], backgroundColor: theme.colors.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${newBookingRequests} booking requests`} onPress={() => router.push('/booking-requests')} style={({ pressed }) => ({ flex: 1, minHeight: 66, paddingVertical: spacing[2], paddingRight: spacing[3], flexDirection: 'row', alignItems: 'center', gap: spacing[2], opacity: pressed ? 0.68 : 1 })}>
          <AppIcon icon={CalendarDays} tone="clinical" size={18} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>{newBookingRequests}</AppText>
            <AppText variant="tiny" tone="muted">Booking requests</AppText>
          </View>
        </Pressable>
        <View style={{ width: 1, backgroundColor: theme.colors.border }} />
        <Pressable accessibilityRole="button" accessibilityLabel={`${missed} missed calls requiring follow-up`} onPress={() => setFilter('call')} style={({ pressed }) => ({ flex: 1, minHeight: 66, paddingVertical: spacing[2], paddingLeft: spacing[3], flexDirection: 'row', alignItems: 'center', gap: spacing[2], opacity: pressed ? 0.68 : 1 })}>
          <AppIcon icon={Phone} tone={missed ? 'danger' : 'default'} size={18} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>{missed}</AppText>
            <AppText variant="tiny" tone="muted">Callbacks due</AppText>
          </View>
        </Pressable>
      </View> : null}

      <View style={{ paddingHorizontal: spacing[4] }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }}>
          {filters.map((item) => <Chip key={item.value} label={item.label} selected={filter === item.value} onPress={() => setFilter(item.value)} />)}
        </ScrollView>
      </View>

      <View style={{ paddingHorizontal: spacing[4] }}>
        <SectionHeader title={filter === 'all' ? 'Conversations' : filters.find((item) => item.value === filter)?.label ?? 'Conversations'} subtitle={`${rows.length} patient threads`} />
        {query.isLoading ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : rows.length === 0 ? <EmptyState title="Inbox is clear" message="There are no conversations matching this filter." icon={Inbox} /> : <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border }}>
          {rows.map((communication, index) => <View key={communication.id} style={{ borderBottomWidth: index < rows.length - 1 ? 1 : 0, borderBottomColor: theme.colors.border }}>
            <CommunicationRow communication={communication} onPress={() => {
              if (communication.unread) markRead.mutate(communication.id);
              router.push({ pathname: '/communication/new', params: { patientId: communication.patientId, channel: communication.channel, replyTo: communication.id } });
            }} />
          </View>)}
        </View>}
      </View>
    </View>
  </Screen>;
}

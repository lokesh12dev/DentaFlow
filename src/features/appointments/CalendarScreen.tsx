import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { router } from 'expo-router';
import { useAppointments, useStaff } from '@/hooks/useClinicQueries';
import { useUIStore } from '@/store/uiStore';
import type { AppointmentView } from '@/domain/types';
import { CalendarDays, ChevronLeft, ChevronRight, TriangleAlert } from '@/ui/icons';
import { AppIcon, AppointmentRow, Chip, EmptyState, ErrorState, IconButton, LoadingState, PageHeader, Screen, SectionHeader, SegmentedControl, AppText } from '@/ui/components';
import { radii, spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';

const viewOptions: { label: string; value: AppointmentView }[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Doctor', value: 'doctor' },
  { label: 'Chair', value: 'chair' }
];

export function CalendarScreen() {
  const theme = useTheme();
  const setCommand = useUIStore((state) => state.setCommandOpen);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<AppointmentView>('day');
  const [doctorId, setDoctorId] = useState<string>();
  const [chairName, setChairName] = useState<string>();
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const appointmentsQuery = useAppointments(view === 'week' ? undefined : { date: dateKey, doctorId: view === 'doctor' ? doctorId : undefined });
  const staffQuery = useStaff();
  const days = useMemo(() => Array.from({ length: view === 'week' ? 7 : 9 }, (_, index) => addDays(view === 'week' ? weekStart : addDays(selectedDate, -4), index)), [selectedDate, view, weekStart]);
  const appointments = useMemo(() => {
    let rows = appointmentsQuery.data ?? [];
    if (view === 'week') {
      const from = format(weekStart, 'yyyy-MM-dd');
      const to = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      rows = rows.filter((appointment) => appointment.startsAt.slice(0, 10) >= from && appointment.startsAt.slice(0, 10) <= to);
    }
    if (view === 'chair' && chairName) rows = rows.filter((appointment) => appointment.chairName === chairName);
    return rows;
  }, [appointmentsQuery.data, chairName, view, weekStart]);
  const grouped = useMemo(() => {
    const map = new Map<string, typeof appointments>();
    appointments.forEach((appointment) => {
      const key = appointment.startsAt.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), appointment]);
    });
    return map;
  }, [appointments]);
  const chairs = useMemo(() => Array.from(new Set((appointmentsQuery.data ?? []).map((appointment) => appointment.chairName))), [appointmentsQuery.data]);
  const conflicts = useMemo(() => appointments.filter((item, index) => appointments.some((other, otherIndex) => index !== otherIndex && item.chairId === other.chairId && item.startsAt < other.endsAt && item.endsAt > other.startsAt)), [appointments]);
  const periodLabel = view === 'week' ? `${format(weekStart, 'd MMM')} – ${format(addDays(weekStart, 6), 'd MMM yyyy')}` : format(selectedDate, 'EEEE, d MMMM');

  const changeView = (next: AppointmentView) => {
    setView(next);
    if (next !== 'doctor') setDoctorId(undefined);
    if (next !== 'chair') setChairName(undefined);
  };

  return <Screen>
    <PageHeader title="Calendar" subtitle={`${appointments.length} scheduled visits`} onSearch={() => setCommand(true)} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[4] }}>
      <SegmentedControl value={view} options={viewOptions} onChange={changeView} compact />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton label="Previous period" icon={ChevronLeft} onPress={() => setSelectedDate(addDays(selectedDate, view === 'week' ? -7 : -1))} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText variant="bodyStrong" numberOfLines={1}>{periodLabel}</AppText>
          <AppText variant="caption" tone="muted">Tap a date to focus the schedule</AppText>
        </View>
        <IconButton label="Next period" icon={ChevronRight} onPress={() => setSelectedDate(addDays(selectedDate, view === 'week' ? 7 : 1))} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }}>
        {days.map((day) => {
          const active = isSameDay(day, selectedDate);
          const visitCount = grouped.get(format(day, 'yyyy-MM-dd'))?.length ?? 0;
          return <Pressable key={day.toISOString()} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`${format(day, 'EEEE d MMMM')}, ${visitCount} visits`} onPress={() => setSelectedDate(day)} style={({ pressed }) => ({ width: 52, minHeight: 64, borderRadius: radii.md, backgroundColor: active ? theme.colors.primary : pressed ? theme.colors.surfaceTertiary : theme.colors.surface, borderWidth: 1, borderColor: active ? theme.colors.primary : theme.colors.border, alignItems: 'center', justifyContent: 'center', gap: 2 })}>
            <AppText variant="tiny" style={{ color: active ? theme.colors.textInverse : theme.colors.textMuted }}>{format(day, 'EEE')}</AppText>
            <AppText variant="bodyStrong" style={{ color: active ? theme.colors.textInverse : theme.colors.text, fontVariant: ['tabular-nums'] }}>{format(day, 'd')}</AppText>
            <View style={{ width: visitCount ? 5 : 3, height: visitCount ? 5 : 3, borderRadius: radii.pill, backgroundColor: active ? theme.colors.textInverse : visitCount ? theme.colors.clinical : theme.colors.borderStrong }} />
          </Pressable>;
        })}
      </ScrollView>

      {view === 'doctor' ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }}>
        <Chip label="All doctors" selected={!doctorId} onPress={() => setDoctorId(undefined)} />
        {staffQuery.data?.filter((staff) => staff.role === 'dentist' || staff.role === 'owner').map((staff) => <Chip key={staff.id} label={staff.name} selected={doctorId === staff.id} onPress={() => setDoctorId(staff.id)} />)}
      </ScrollView> : null}
      {view === 'chair' ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }}>
        <Chip label="All chairs" selected={!chairName} onPress={() => setChairName(undefined)} />
        {chairs.map((chair) => <Chip key={chair} label={chair} selected={chairName === chair} onPress={() => setChairName(chair)} />)}
      </ScrollView> : null}

      {conflicts.length ? <View accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.danger }}>
        <AppIcon icon={TriangleAlert} tone="danger" />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong" tone="danger">{conflicts.length} chair conflicts</AppText>
          <AppText variant="caption" tone="secondary">Review overlapping visits before confirmation.</AppText>
        </View>
      </View> : null}

      <View>
        <SectionHeader title={view === 'week' ? 'Week schedule' : 'Day schedule'} subtitle="Chronological clinic rail" />
        {appointmentsQuery.isLoading ? <LoadingState /> : appointmentsQuery.isError ? <ErrorState onRetry={() => appointmentsQuery.refetch()} /> : appointments.length === 0 ? <EmptyState title="No visits scheduled" message="Use Book appointment to fill this capacity." icon={CalendarDays} /> : <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border }}>
          {appointments.map((appointment, index) => <View key={appointment.id} style={{ borderBottomWidth: index < appointments.length - 1 ? 1 : 0, borderBottomColor: theme.colors.border }}>
            <AppointmentRow appointment={appointment} onPress={() => router.push(`/appointment/${appointment.id}`)} />
          </View>)}
        </View>}
      </View>
    </View>
  </Screen>;
}

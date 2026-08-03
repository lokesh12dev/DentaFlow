import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { AlertCircle } from '@/ui/icons';
import { AppIcon, AppText, Avatar, Chip, ErrorState, LoadingState, PageHeader, PatientRow, Screen, SearchField, SectionHeader } from '@/ui/components';
import { radii, spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';
import { usePatients } from '@/hooks/useClinicQueries';
import { useUIStore } from '@/store/uiStore';
import type { PatientFilters } from '@/repositories';

const filters: { value: NonNullable<PatientFilters['flag']>; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'medical-alerts', label: 'Medical alerts' },
  { value: 'incomplete-intake', label: 'Intake review' },
  { value: 'outstanding', label: 'Balance due' },
  { value: 'recall', label: 'Recall' },
  { value: 'pending-treatment', label: 'Pending care' }
];

export function PatientsScreen() {
  const [query, setQuery] = useState('');
  const [flag, setFlag] = useState<NonNullable<PatientFilters['flag']>>('all');
  const theme = useTheme();
  const router = useRouter();
  const setCommandOpen = useUIStore((state) => state.setCommandOpen);
  const result = usePatients({ query: query || undefined, flag });
  const recent = useMemo(() => result.data?.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4) ?? [], [result.data]);
  const rows = useMemo(() => {
    const data = result.data ?? [];
    if (query || flag !== 'all') return data;
    const recentIds = new Set(recent.map((patient) => patient.id));
    return data.filter((patient) => !recentIds.has(patient.id));
  }, [flag, query, recent, result.data]);

  return <Screen scroll={false}>
    <PageHeader title="Patients" subtitle={`${result.data?.length ?? 0} active records`} onSearch={() => setCommandOpen(true)} />
    <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[3], gap: spacing[3] }}>
      <SearchField value={query} onChangeText={setQuery} placeholder="Search name, phone or patient ID" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }}>
        {filters.map((item) => <Chip key={item.value} label={item.label} selected={flag === item.value} onPress={() => setFlag(item.value)} />)}
      </ScrollView>
    </View>

    {result.isLoading ? <LoadingState label="Loading patient directory…" /> : result.isError ? <ErrorState message={result.error instanceof Error ? result.error.message : undefined} onRetry={() => result.refetch()} /> : <FlashList
      data={rows}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={result.isRefetching} onRefresh={() => result.refetch()} tintColor={theme.colors.clinical} />}
      contentContainerStyle={{ paddingHorizontal: spacing[4] }}
      ListHeaderComponent={query || flag !== 'all' ? <SectionHeader title="Search results" subtitle={`${rows.length} matching records`} /> : <View>
        {recent.length ? <View style={{ paddingTop: spacing[2], paddingBottom: spacing[5] }}>
          <SectionHeader title="Recently opened" subtitle="Return to active records" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }}>
            {recent.map((patient) => <Pressable key={patient.id} accessibilityRole="button" accessibilityLabel={`Open ${patient.displayName}`} onPress={() => router.push(`/patient/${patient.id}` as never)} style={({ pressed }) => ({ width: 82, minHeight: 86, alignItems: 'center', justifyContent: 'center', gap: spacing[2], borderRadius: radii.md, backgroundColor: pressed ? theme.colors.surfaceSecondary : 'transparent' })}>
              <Avatar name={patient.displayName} size={42} tone={patient.medicalAlerts.length ? 'danger' : 'clinical'} />
              <AppText variant="caption" numberOfLines={1} style={{ maxWidth: 78 }}>{patient.firstName}</AppText>
            </Pressable>)}
          </ScrollView>
        </View> : null}
        <SectionHeader title="Patient directory" subtitle={`${rows.length} other records`} />
      </View>}
      renderItem={({ item, index }) => <View style={{ paddingHorizontal: spacing[1], borderTopWidth: index === 0 ? 1 : 0, borderBottomWidth: 1, borderColor: theme.colors.border }}>
        <PatientRow patient={item} onPress={() => router.push(`/patient/${item.id}` as never)} />
      </View>}
      ListEmptyComponent={<View style={{ paddingTop: spacing[12], alignItems: 'center', gap: spacing[3] }}>
        <AppIcon icon={AlertCircle} size={28} />
        <AppText variant="title3">No patients match this view</AppText>
        <AppText tone="secondary" style={{ textAlign: 'center', maxWidth: 300 }}>Change the search or filter, or use Add patient.</AppText>
      </View>}
    />}
  </Screen>;
}

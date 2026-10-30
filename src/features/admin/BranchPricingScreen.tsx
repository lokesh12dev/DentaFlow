import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useBranchProcedurePrices, useBranches, useProcedures, useUpsertBranchProcedurePrice } from '@/hooks/useClinicQueries';
import { AppText, Badge, Button, Chip, EmptyState, ErrorState, Field, LoadingState, PageHeader, Screen, SectionHeader, Surface } from '@/ui/components';
import { BadgeIndianRupee, Building2, Check, Clock3, Edit3 } from '@/ui/icons';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';
import { useSessionStore } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';

interface Draft { procedureTypeId: string; fee: string; duration: string; active: boolean }

export function BranchPricingScreen() {
  const theme = useTheme();
  const toast = useUIStore((state) => state.showToast);
  const activeBranchId = useSessionStore((state) => state.activeBranchId);
  const setActiveBranch = useSessionStore((state) => state.setActiveBranch);
  const branches = useBranches();
  const procedures = useProcedures();
  const [branchId, setBranchId] = useState(activeBranchId ?? '');
  const selectedBranchId = branchId || branches.data?.[0]?.id || '';
  const prices = useBranchProcedurePrices(selectedBranchId);
  const save = useUpsertBranchProcedurePrice();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const branch = branches.data?.find((item) => item.id === selectedBranchId);
  const priceByProcedure = useMemo(() => new Map(prices.data?.map((item) => [item.procedureTypeId, item]) ?? []), [prices.data]);

  const beginEdit = (procedureTypeId: string) => {
    const procedure = procedures.data?.find((item) => item.id === procedureTypeId);
    const override = priceByProcedure.get(procedureTypeId);
    if (!procedure) return;
    setEditing(procedureTypeId);
    setDraft({ procedureTypeId, fee: String(override?.fee ?? procedure.defaultFee), duration: String(override?.durationMinutes ?? procedure.defaultDurationMinutes), active: override?.active ?? true });
  };

  const submit = async () => {
    if (!draft || !selectedBranchId) return;
    const fee = Number(draft.fee);
    const duration = Number(draft.duration);
    if (!Number.isFinite(fee) || fee < 0 || !Number.isFinite(duration) || duration < 5 || duration > 480) {
      toast('Enter a valid fee and a duration between 5 and 480 minutes.', 'danger');
      return;
    }
    try {
      await save.mutateAsync({ branchId: selectedBranchId, procedureTypeId: draft.procedureTypeId, fee, durationMinutes: duration, active: draft.active });
      setEditing(null); setDraft(null);
      toast('Branch price saved', 'success');
    } catch (error) { toast(error instanceof Error ? error.message : 'Unable to save branch price', 'danger'); }
  };

  if (branches.isLoading || procedures.isLoading) return <Screen><LoadingState label="Loading branch pricing…" /></Screen>;
  if (branches.isError || procedures.isError) return <Screen><ErrorState onRetry={() => { branches.refetch(); procedures.refetch(); }} /></Screen>;

  return <Screen>
    <PageHeader title="Branch pricing" subtitle="Local fees and chair-time defaults with a clinic-wide fallback" onBack={() => router.back()} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[4], paddingBottom: spacing[8] }}>
      <Surface style={{ gap: spacing[3] }}>
        <SectionHeader title="Location context" subtitle="Changes affect new estimates and appointment summaries at this branch" icon={Building2} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
          {branches.data?.map((item) => <Chip key={item.id} label={item.name} selected={selectedBranchId === item.id} onPress={() => { setBranchId(item.id); setActiveBranch(item.id); setEditing(null); setDraft(null); }} />)}
        </View>
      </Surface>

      <Surface tone="clinical" style={{ gap: spacing[2] }}>
        <AppText variant="bodyStrong">Predictable pricing without duplicate procedure lists</AppText>
        <AppText tone="secondary">A branch override changes the effective fee or duration only for {branch?.name ?? 'this location'}. Removing the override returns the procedure to its clinic-wide default.</AppText>
      </Surface>

      <Surface style={{ gap: spacing[3] }}>
        <SectionHeader title="Procedure catalogue" subtitle={`${procedures.data?.length ?? 0} active procedures`} icon={BadgeIndianRupee} />
        {prices.isLoading ? <LoadingState /> : prices.isError ? <ErrorState onRetry={() => prices.refetch()} /> : !procedures.data?.length ? <EmptyState title="No procedures" message="Create procedure types before configuring branch prices." icon={BadgeIndianRupee} /> : procedures.data.map((procedure) => {
          const override = priceByProcedure.get(procedure.id);
          const isEditing = editing === procedure.id && draft;
          return <View key={procedure.id} style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: spacing[3], gap: spacing[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
              <View style={{ flex: 1, gap: 3 }}>
                <AppText variant="bodyStrong">{procedure.name}</AppText>
                <AppText variant="caption" tone="secondary" tabular>{procedure.category} · Clinic default ₹{procedure.defaultFee.toLocaleString('en-IN')} · {procedure.defaultDurationMinutes} min</AppText>
              </View>
              <View style={{ alignItems: 'flex-end', gap: spacing[1] }}>
                <AppText variant="bodyStrong" tabular>₹{(override?.active ? override.fee : procedure.defaultFee).toLocaleString('en-IN')}</AppText>
                <Badge label={override?.active ? `${override.durationMinutes ?? procedure.defaultDurationMinutes} min · Branch override` : `${procedure.defaultDurationMinutes} min · Default`} tone={override?.active ? 'info' : 'neutral'} />
              </View>
            </View>
            {isEditing ? <Surface tone="secondary" style={{ gap: spacing[3] }}>
              <View style={{ flexDirection: 'row', gap: spacing[3] }}>
                <Field label="Fee" value={draft.fee} onChangeText={(fee) => setDraft({ ...draft, fee })} keyboardType="decimal-pad" icon={BadgeIndianRupee} style={{ flex: 1 }} />
                <Field label="Duration" value={draft.duration} onChangeText={(duration) => setDraft({ ...draft, duration })} keyboardType="number-pad" icon={Clock3} style={{ flex: 1 }} />
              </View>
              <Pressable accessibilityRole="switch" accessibilityState={{ checked: draft.active }} onPress={() => setDraft({ ...draft, active: !draft.active })} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <View style={{ width: 42, height: 26, borderRadius: 13, padding: 3, backgroundColor: draft.active ? theme.colors.clinical : theme.colors.surfaceTertiary, alignItems: draft.active ? 'flex-end' : 'flex-start' }}><View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.surface }} /></View>
                <View style={{ flex: 1 }}><AppText variant="label">Use branch override</AppText><AppText variant="caption" tone="secondary">Turn off to restore clinic defaults without deleting audit history.</AppText></View>
              </Pressable>
              <View style={{ flexDirection: 'row', gap: spacing[2] }}><Button label="Cancel" tone="secondary" onPress={() => { setEditing(null); setDraft(null); }} style={{ flex: 1 }} /><Button label="Save price" icon={Check} loading={save.isPending} onPress={submit} style={{ flex: 1 }} /></View>
            </Surface> : <Button label={override ? 'Edit branch override' : 'Add branch override'} icon={Edit3} tone="ghost" onPress={() => beginEdit(procedure.id)} />}
          </View>;
        })}
      </Surface>
    </View>
  </Screen>;
}

import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { AutomationRule } from '@/domain/types';
import { useAutomations, useSetAutomationEnabled } from '@/hooks/useClinicQueries';
import { useUIStore } from '@/store/uiStore';
import { relativeTime } from '@/core/format';
import { AppText, Badge, Button, EmptyState, ErrorState, LoadingState, PageHeader, Screen, SectionHeader, Surface } from '@/ui/components';
import { Plus, ShieldCheck, TriangleAlert } from '@/ui/icons';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';

const groupOrder = ['Appointments', 'Communication', 'Clinical follow-up', 'Recall'] as const;
type AutomationGroup = typeof groupOrder[number];

export function AutomationsScreen() {
  const theme = useTheme();
  const query = useAutomations();
  const setEnabled = useSetAutomationEnabled();
  const toast = useUIStore((state) => state.showToast);
  const toggle = async (id: string, enabled: boolean) => {
    try {
      await setEnabled.mutateAsync({ id, enabled });
      toast(enabled ? 'Automation enabled' : 'Automation paused', 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to update automation', 'danger');
    }
  };
  const groups = groupRules(query.data ?? []);
  return <Screen>
    <PageHeader title="Automations" subtitle="Safe operational follow-up" onBack={() => router.back()} right={<Button label="Create" icon={Plus} size="small" onPress={() => router.push('/automation/new')} />} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[4] }}>
      <Surface tone="clinical" style={{ padding: spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}>
          <ShieldCheck size={18} color={theme.colors.clinical} />
          <AppText variant="caption" tone="secondary" style={{ flex: 1 }}>Before sending, every rule checks patient consent, quiet hours, channel health and duplicate messages.</AppText>
        </View>
      </Surface>
      {query.isLoading ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : !query.data?.length ? <EmptyState title="No automations" message="Create a rule for confirmations, recalls or follow-up." icon={ShieldCheck} /> : groups.map((group) => <View key={group.title} style={{ gap: spacing[2] }}>
        <SectionHeader title={group.title} subtitle={`${group.rules.length} ${group.rules.length === 1 ? 'rule' : 'rules'}`} />
        <Surface padded={false} style={{ paddingHorizontal: spacing[4] }}>
          {group.rules.map((rule, index) => <View key={rule.id}>
            <AutomationRow rule={rule} onToggle={(enabled) => toggle(rule.id, enabled)} busy={setEnabled.isPending} />
            {index < group.rules.length - 1 ? <Divider /> : null}
          </View>)}
        </Surface>
      </View>)}
    </View>
  </Screen>;
}

function AutomationRow({ rule, onToggle, busy }: { rule: AutomationRule; onToggle: (enabled: boolean) => void; busy: boolean }) {
  const theme = useTheme();
  return <View style={{ paddingVertical: spacing[3], gap: spacing[3] }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong">{rule.name}</AppText>
        <AppText variant="caption" tone="secondary">{rule.trigger} → {rule.action}</AppText>
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: rule.enabled, disabled: busy }}
        accessibilityLabel={`${rule.name} ${rule.enabled ? 'enabled' : 'disabled'}`}
        disabled={busy}
        onPress={() => onToggle(!rule.enabled)}
        style={({ pressed }) => ({ width: 48, height: 28, borderRadius: 14, backgroundColor: rule.enabled ? theme.colors.clinical : theme.colors.surfaceTertiary, padding: 3, alignItems: rule.enabled ? 'flex-end' : 'flex-start', opacity: busy ? 0.5 : pressed ? 0.72 : 1 })}
      >
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.surface }} />
      </Pressable>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' }}>
      <Badge label={rule.channel ?? 'internal'} tone="neutral" />
      <AppText variant="caption" tone="muted">{rule.lastRunAt ? `Last run ${relativeTime(rule.lastRunAt)}` : 'Not run yet'} · {rule.runCount} total</AppText>
      {rule.failureCount > 0 ? <Pressable accessibilityRole="button" accessibilityLabel={`Inspect ${rule.failureCount} failures for ${rule.name}`} onPress={() => router.push('/audit')} style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing[1], opacity: pressed ? 0.68 : 1 })}>
        <TriangleAlert size={15} color={theme.colors.danger} />
        <AppText variant="caption" style={{ color: theme.colors.danger }}>Inspect {rule.failureCount} failures</AppText>
      </Pressable> : null}
    </View>
  </View>;
}

function groupRules(rules: AutomationRule[]) {
  const grouped = new Map<AutomationGroup, AutomationRule[]>();
  for (const rule of rules) {
    const group = automationGroup(rule);
    grouped.set(group, [...(grouped.get(group) ?? []), rule]);
  }
  return groupOrder.filter((title) => grouped.has(title)).map((title) => ({ title, rules: grouped.get(title)! }));
}

function automationGroup(rule: AutomationRule): AutomationGroup {
  const searchable = `${rule.name} ${rule.trigger} ${rule.action}`.toLowerCase();
  if (searchable.includes('recall')) return 'Recall';
  if (searchable.includes('treatment') || searchable.includes('extraction') || searchable.includes('root canal') || searchable.includes('symptom')) return 'Clinical follow-up';
  if (searchable.includes('appointment') || searchable.includes('reminder') || searchable.includes('confirmation')) return 'Appointments';
  return 'Communication';
}

function Divider() { const theme = useTheme(); return <View style={{ height: 1, backgroundColor: theme.colors.border }} />; }

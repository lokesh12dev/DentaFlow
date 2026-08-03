import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  BadgeIndianRupee, BookOpen, Building2, ChevronRight, ClipboardList, FileClock,
  FlaskConical, History, LayoutDashboard, ListChecks, Package, Settings,
  ShieldCheck, SlidersHorizontal, Stethoscope, UsersRound, WandSparkles,
} from '@/ui/icons';
import type { LucideIcon } from '@/ui/icons';
import { AppIcon, AppText, ListRow, PageHeader, Screen, SectionHeader, Surface } from '@/ui/components';
import { spacing } from '@/ui/tokens';
import { useUIStore } from '@/store/uiStore';
import { useClinic } from '@/hooks/useClinicQueries';

type Module = { title: string; detail?: string; icon: LucideIcon; route: string };

const groups: { title: string; modules: Module[] }[] = [
  { title: 'Practice operations', modules: [
    { title: 'Waiting room', detail: 'Live queue and chair handoff', icon: ListChecks, route: '/waiting-room' },
    { title: 'Billing', detail: 'Receivables and payments', icon: BadgeIndianRupee, route: '/billing' },
    { title: 'Treatment pipeline', detail: 'Care from proposal to completion', icon: Stethoscope, route: '/treatment-pipeline' },
    { title: 'Recall', detail: 'Due and overdue patient follow-up', icon: FileClock, route: '/recalls' },
  ] },
  { title: 'Clinical operations', modules: [
    { title: 'Laboratory', detail: 'Cases, shades and due dates', icon: FlaskConical, route: '/laboratory' },
    { title: 'Inventory', detail: 'Stock, batches and expiry', icon: Package, route: '/inventory' },
    { title: 'Templates', detail: 'Clinical, consent and message templates', icon: BookOpen, route: '/templates' },
  ] },
  { title: 'Team and insights', modules: [
    { title: 'Tasks', detail: 'Callbacks and handovers', icon: ClipboardList, route: '/tasks' },
    { title: 'Reports', detail: 'Operations and collections', icon: LayoutDashboard, route: '/reports' },
    { title: 'Team', detail: 'People, roles and access', icon: UsersRound, route: '/team' },
    { title: 'Branches', detail: 'Locations, chairs and context', icon: Building2, route: '/branches' },
  ] },
  { title: 'System', modules: [
    { title: 'Automations', detail: 'Reminders and follow-up rules', icon: WandSparkles, route: '/automations' },
    { title: 'Integrations', detail: 'Connected communication services', icon: SlidersHorizontal, route: '/integrations' },
    { title: 'Audit log', detail: 'Access and change history', icon: ShieldCheck, route: '/audit' },
    { title: 'Settings', detail: 'Clinic, privacy and notifications', icon: Settings, route: '/settings' },
  ] },
];

export function MoreScreen() {
  const clinic = useClinic();
  const setCommand = useUIStore((state) => state.setCommandOpen);
  return <Screen>
    <PageHeader title="More" subtitle={clinic.data?.name ?? 'DentaFlow Clinic'} onSearch={() => setCommand(true)} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[5] }}>
      {groups.map((group) => <View key={group.title} style={{ gap: spacing[2] }}>
        <SectionHeader title={group.title} />
        <Surface padded={false} style={{ paddingHorizontal: spacing[4] }}>
          {group.modules.map((module, index) => <View key={module.route}>
            <ListRow
              title={module.title}
              subtitle={module.detail}
              icon={module.icon}
              iconTone={group.title === 'Clinical operations' ? 'clinical' : 'primary'}
              trailing={<AppIcon icon={ChevronRight} size={18} />}
              showChevron={false}
              onPress={() => router.push(module.route as never)}
            />
            {index < group.modules.length - 1 ? <Divider /> : null}
          </View>)}
        </Surface>
      </View>)}
      <View style={{ alignItems: 'center', gap: spacing[1] }}>
        <AppIcon icon={History} size={16} />
        <AppText variant="caption" tone="muted">Operational changes are recorded in the audit log.</AppText>
      </View>
    </View>
  </Screen>;
}

function Divider() {
  return <View style={{ height: 1, marginLeft: 52, backgroundColor: 'rgba(128, 138, 148, 0.18)' }} />;
}

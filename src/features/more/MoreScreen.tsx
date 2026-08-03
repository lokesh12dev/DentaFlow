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
import { useClinic, useDashboard } from '@/hooks/useClinicQueries';
import { can, type Permission } from '@/domain/access';

type Module = { title: string; detail?: string; icon: LucideIcon; route: string; permission: Permission };

const groups: { title: string; modules: Module[] }[] = [
  { title: 'Clinic operations', modules: [
    { title: 'Waiting room', icon: ListChecks, route: '/waiting-room', permission: 'waiting.read' },
    { title: 'Tasks', icon: ClipboardList, route: '/tasks', permission: 'task.read' },
    { title: 'Recall', icon: FileClock, route: '/recalls', permission: 'recall.read' },
    { title: 'Treatment pipeline', icon: Stethoscope, route: '/treatment-pipeline', permission: 'treatment.read' },
  ] },
  { title: 'Finance', modules: [
    { title: 'Billing', icon: BadgeIndianRupee, route: '/billing', permission: 'billing.read' },
    { title: 'Reports', icon: LayoutDashboard, route: '/reports', permission: 'report.read' },
  ] },
  { title: 'Clinical support', modules: [
    { title: 'Laboratory', icon: FlaskConical, route: '/laboratory', permission: 'laboratory.read' },
    { title: 'Inventory', icon: Package, route: '/inventory', permission: 'inventory.read' },
    { title: 'Templates', icon: BookOpen, route: '/templates', permission: 'template.read' },
  ] },
  { title: 'Administration', modules: [
    { title: 'Team', icon: UsersRound, route: '/team', permission: 'team.manage' },
    { title: 'Branches', icon: Building2, route: '/branches', permission: 'branch.manage' },
    { title: 'Automations', icon: WandSparkles, route: '/automations', permission: 'automation.manage' },
    { title: 'Integrations', icon: SlidersHorizontal, route: '/integrations', permission: 'integration.manage' },
    { title: 'Audit log', icon: ShieldCheck, route: '/audit', permission: 'audit.read' },
    { title: 'Settings', icon: Settings, route: '/settings', permission: 'settings.manage' },
  ] },
];

export function MoreScreen() {
  const clinic = useClinic();
  const dashboard = useDashboard();
  const setCommand = useUIStore((state) => state.setCommandOpen);
  const visibleGroups = groups.map((group) => ({ ...group, modules: group.modules.filter((module) => !dashboard.data || can(dashboard.data.currentStaff.role, module.permission)) })).filter((group) => group.modules.length);
  return <Screen>
    <PageHeader title="More" subtitle={clinic.data?.name ?? 'DentaFlow Clinic'} onSearch={() => setCommand(true)} />
    <View style={{ paddingHorizontal: spacing[4], gap: spacing[5] }}>
      {visibleGroups.map((group) => <View key={group.title} style={{ gap: spacing[2] }}>
        <SectionHeader title={group.title} />
        <Surface padded={false} style={{ paddingHorizontal: spacing[4] }}>
          {group.modules.map((module, index) => <View key={module.route}>
            <ListRow
              title={module.title}
              icon={module.icon}
              iconTone={group.title === 'Clinical support' ? 'clinical' : 'primary'}
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

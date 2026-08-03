import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { TaskStatus } from '@/domain/types';
import { useSetTaskStatus, useTasks } from '@/hooks/useClinicQueries';
import { useUIStore } from '@/store/uiStore';
import { AppText, Badge, Button, Chip, EmptyState, ErrorState, LoadingState, PageHeader, Screen, SectionHeader, Surface, TaskRow } from '@/ui/components';
import { CheckCircle2, ClipboardList, Clock3, Filter, Plus } from '@/ui/icons';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';

export function TasksScreen() {
  const theme = useTheme(); const query = useTasks(); const setStatus = useSetTaskStatus(); const toast = useUIStore((s) => s.showToast); const [filter,setFilter] = useState<'open'|'mine'|'urgent'|'done'>('open');
  const rows = useMemo(() => (query.data ?? []).filter((t) => filter === 'done' ? t.status === 'done' : filter === 'urgent' ? t.status !== 'done' && (t.priority === 'urgent' || t.priority === 'high') : t.status !== 'done' && t.status !== 'cancelled'), [query.data,filter]);
  const update = async (id:string,status:TaskStatus) => { try { await setStatus.mutateAsync({id,status}); toast(status==='done'?'Task completed':'Task updated','success'); } catch(e){toast(e instanceof Error?e.message:'Unable to update task','danger');} };
  return <Screen><PageHeader title="Tasks" subtitle="Callbacks, handovers and accountable follow-up" onBack={() => router.back()} right={<Button label="New" icon={Plus} size="small" onPress={()=>router.push('/task/new')} />} />
    <View style={{paddingHorizontal:spacing[4],gap:spacing[4]}}>
      <Surface style={{gap:spacing[3]}}><SectionHeader title="Work queue" subtitle="Prioritise by patient risk and due time" icon={Filter}/><View style={{flexDirection:'row',flexWrap:'wrap',gap:spacing[2]}}>{(['open','mine','urgent','done'] as const).map((f)=><Chip key={f} label={f[0]!.toUpperCase()+f.slice(1)} selected={filter===f} onPress={()=>setFilter(f)}/>)}</View></Surface>
      <Surface style={{gap:0}}><SectionHeader title={filter==='done'?'Completed work':'Needs action'} subtitle={`${rows.length} tasks in this view`} icon={ClipboardList}/>{query.isLoading?<LoadingState/>:query.isError?<ErrorState onRetry={()=>query.refetch()}/>:!rows.length?<EmptyState title="No tasks here" message="The selected queue is clear." icon={CheckCircle2}/>:rows.map((task,index)=><View key={task.id}><TaskRow task={task} onPress={()=>task.status==='done'?update(task.id,'open'):update(task.id,'done')}/>{task.status!=='done'?<View style={{flexDirection:'row',gap:spacing[2],paddingBottom:spacing[3],paddingLeft:53}}><Button label="Start" size="small" tone="secondary" onPress={()=>update(task.id,'in-progress')}/><Button label="Complete" size="small" tone="clinical" onPress={()=>update(task.id,'done')}/>{task.patientId?<Button label="Patient" size="small" tone="ghost" onPress={()=>router.push(`/patient/${task.patientId}`)}/>:null}</View>:null}{index<rows.length-1?<View style={{height:1,backgroundColor:theme.colors.border}}/>:null}</View>)}</Surface>
      <Surface tone="warning" style={{gap:spacing[2]}}><AppText variant="bodyStrong">Escalation policy</AppText><AppText tone="secondary">Urgent tasks that pass their due time should notify the assignee and practice manager; the database workflow is included.</AppText></Surface>
    </View>
  </Screen>;
}

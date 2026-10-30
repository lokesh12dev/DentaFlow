import React, { useState } from 'react';
import { View } from 'react-native';
import { BookOpen, CheckCircle2, Search, Sparkles } from '@/ui/icons';
import { AppText, Button, Field, ListRow, ModalSheet, Surface } from '@/ui/components';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';
import { usePatientHistoryQuestion } from '@/hooks/useClinicQueries';
import { dateTime } from '@/core/format';

const prompts = [
  'What allergies are recorded?',
  'What remains unpaid?',
  'Show treatment history for tooth 46.',
  'What was discussed at the latest visit?'
];

export function HistoryAssistant({ visible, patientId, onClose }: { visible: boolean; patientId: string; onClose: () => void }) {
  const [question, setQuestion] = useState('');
  const theme = useTheme();
  const assistant = usePatientHistoryQuestion(patientId);
  const ask = (value = question) => { if (value.trim()) assistant.mutate(value.trim()); };
  return <ModalSheet visible={visible} title="Search patient history" subtitle="Answers include source records and dates" onClose={onClose} footer={<Button label="Ask history" icon={Search} onPress={() => ask()} loading={assistant.isPending} disabled={!question.trim()} full />}>
    <Field label="Question" value={question} onChangeText={setQuestion} placeholder="Ask about allergies, treatment, payments, or a tooth" multiline icon={BookOpen} />
    <View style={{ gap: spacing[2] }}><AppText variant="label">Useful questions</AppText>{prompts.map((prompt) => <Button key={prompt} label={prompt} tone="secondary" onPress={() => { setQuestion(prompt); ask(prompt); }} full />)}</View>
    {assistant.data ? <Surface tone="clinical" style={{ gap: spacing[3] }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}><Sparkles size={18} color={theme.colors.clinical} /><AppText variant="bodyStrong">Answer</AppText></View><AppText>{assistant.data.answer}</AppText><View style={{ gap: spacing[1] }}><AppText variant="label">Sources</AppText>{assistant.data.sources.length ? assistant.data.sources.map((source) => <ListRow key={source.id} title={source.label} subtitle={dateTime(source.occurredAt)} icon={CheckCircle2} iconTone="clinical" showChevron={false} />) : <AppText tone="secondary">No source records were returned.</AppText>}</View></Surface> : null}
    {assistant.isError ? <Surface tone="danger"><AppText tone="danger">{assistant.error instanceof Error ? assistant.error.message : 'The history assistant could not answer.'}</AppText></Surface> : null}
  </ModalSheet>;
}

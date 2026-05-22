import { useState } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { milestoneRepository } from '../../src/repositories/MilestoneRepository';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { colors, spacing } from '../../src/config/theme';
import type { Milestone } from '../../src/types/database';

const LABELS: Record<Milestone['type'], string> = {
  first_meeting: 'Primer encuentro',
  first_date: 'Primera cita',
  first_trip: 'Primer viaje',
  last_trip: 'Último viaje',
};

export default function EditMilestoneScreen() {
  const { type } = useLocalSearchParams<{ type: Milestone['type'] }>();
  const { coupleId, userId } = useCoupleContext();
  const qc = useQueryClient();
  const [title, setTitle] = useState(LABELS[type as Milestone['type']] ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');

  const save = async () => {
    if (!coupleId || !userId || !type) return;
    await milestoneRepository.upsert(coupleId, userId, {
      type: type as Milestone['type'],
      title: title.trim() || LABELS[type as Milestone['type']],
      milestone_date: date,
      description: description || null,
      photo_path: null,
    });
    qc.invalidateQueries({ queryKey: ['milestones', coupleId] });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{LABELS[type as Milestone['type']]}</Text>
      <Input label="Título" value={title} onChangeText={setTitle} />
      <Input label="Fecha (AAAA-MM-DD)" value={date} onChangeText={setDate} />
      <Input label="Descripción" value={description} onChangeText={setDescription} />
      <Button title="Guardar hito" onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  heading: { fontSize: 20, fontWeight: '700', color: colors.primaryPinkDark, marginBottom: spacing.md },
});

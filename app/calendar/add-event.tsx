import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { coupleRepository } from '../../src/repositories/CoupleRepository';
import { eventService } from '../../src/services/EventService';
import { aiSuggestionService } from '../../src/services/AiSuggestionService';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { colors, spacing } from '../../src/config/theme';

export default function AddEventScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { coupleId, userId } = useCoupleContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderDays, setReminderDays] = useState('3');

  const save = async () => {
    if (!coupleId || !userId || !date || !title.trim()) return;
    const members = await coupleRepository.getMembers(coupleId, userId);
    const partner = members.find((m) => m.user_id !== userId)?.user_id;
    if (!partner) return;

    await eventService.createEvent(coupleId, userId, partner, {
      event_date: date,
      title: title.trim(),
      description: description || null,
      color: colors.primaryPink,
      icon: 'heart',
      reminder_days: Math.min(15, Math.max(1, parseInt(reminderDays, 10) || 3)),
      romantic_note: description || null,
    });
    router.back();
  };

  const suggest = async () => {
    const text = await aiSuggestionService.suggestRomanticText({
      kind: 'event_description',
      title,
    });
    setDescription(text);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Agregar fecha especial — {date}</Text>
      <Input label="Título" value={title} onChangeText={setTitle} />
      <Input label="Descripción" value={description} onChangeText={setDescription} />
      <Input
        label="Recordatorio (1-15 días antes)"
        value={reminderDays}
        onChangeText={setReminderDays}
        keyboardType="numeric"
        maxLength={2}
      />
      <Button title="Sugerir con IA" variant="secondary" onPress={suggest} />
      <Button title="Guardar fecha" onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  heading: { fontWeight: '700', marginBottom: spacing.md, color: colors.text },
});

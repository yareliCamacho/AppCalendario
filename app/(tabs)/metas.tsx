import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { coupleRepository } from '../../src/repositories/CoupleRepository';
import { goalRepository } from '../../src/repositories/GoalRepository';
import { goalService } from '../../src/services/GoalService';
import { GoalProgressBar } from '../../src/components/goals/GoalProgressBar';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { colors, spacing, contentMaxWidth } from '../../src/config/theme';

export default function MetasScreen() {
  const { coupleId, userId } = useCoupleContext();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', coupleId],
    enabled: Boolean(coupleId && userId),
    queryFn: () => goalRepository.list(coupleId!, userId!),
  });

  const getPartner = async () => {
    const members = await coupleRepository.getMembers(coupleId!, userId!);
    return members.find((m) => m.user_id !== userId)?.user_id ?? null;
  };

  const addGoal = async () => {
    if (!coupleId || !userId || !title.trim()) return;
    const partner = await getPartner();
    if (!partner) return;
    const targetAmount = parseFloat(target) || 0;
    if (targetAmount <= 0) return;
    await goalService.create(coupleId, userId, partner, {
      title: title.trim(),
      description: null,
      target_amount: targetAmount,
      saved_amount: 0,
      currency: 'MXN',
    });
    setTitle('');
    setTarget('');
    qc.invalidateQueries({ queryKey: ['goals', coupleId] });
  };

  const addSaved = async (goalId: string, current: number, delta: number, targetAmount: number) => {
    if (!coupleId || !userId) return;
    const partner = await getPartner();
    if (!partner) return;
    await goalService.updateSaved(goalId, coupleId, userId, partner, current + delta, targetAmount);
    qc.invalidateQueries({ queryKey: ['goals', coupleId] });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Input label="Meta" value={title} onChangeText={setTitle} placeholder="Ej. Comprar casa" />
      <Input label="Monto objetivo" value={target} onChangeText={setTarget} keyboardType="numeric" />
      <Button title="Registrar meta" onPress={addGoal} />

      {goals.map((g) => (
        <View key={g.id} style={styles.card}>
          <Text style={styles.cardTitle}>{g.title}</Text>
          {g.description ? <Text style={styles.desc}>{g.description}</Text> : null}
          <GoalProgressBar saved={Number(g.saved_amount)} target={Number(g.target_amount)} currency={g.currency} />
          <View style={styles.row}>
            <Button
              title="+1,000"
              variant="secondary"
              onPress={() => addSaved(g.id, Number(g.saved_amount), 1000, Number(g.target_amount))}
            />
            <Button
              title="+5,000"
              variant="secondary"
              onPress={() => addSaved(g.id, Number(g.saved_amount), 5000, Number(g.target_amount))}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.md, marginTop: spacing.md },
  cardTitle: { fontWeight: '700', fontSize: 17 },
  desc: { color: colors.textMuted, marginVertical: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});

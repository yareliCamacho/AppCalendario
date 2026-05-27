import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { coupleRepository } from '../../src/repositories/CoupleRepository';
import { goalRepository } from '../../src/repositories/GoalRepository';
import { goalService } from '../../src/services/GoalService';
import { GoalProgressBar } from '../../src/components/goals/GoalProgressBar';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { TabScreenShell, scrollOnAppBackground } from '../../src/components/ui/TabScreenShell';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { SoftCard } from '../../src/components/ui/SoftCard';
import { colors, spacing, contentMaxWidth, radii } from '../../src/config/theme';
import { useTabScrollInsets } from '../../src/hooks/useTabScrollInsets';

export default function MetasScreen() {
  const insets = useSafeAreaInsets();
  const { contentContainerStyle: tabScrollStyle } = useTabScrollInsets();
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
    <TabScreenShell>
      <ScrollView
        style={scrollOnAppBackground}
        contentContainerStyle={[
          styles.container,
          tabScrollStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Metas"
          subtitle="Construyan juntos sus próximos sueños 💕"
        />

        <SoftCard style={styles.formCard}>
          <Input label="Meta" value={title} onChangeText={setTitle} placeholder="Ej. Comprar casa" />
          <Input
            label="Monto objetivo (MXN)"
            value={target}
            onChangeText={setTarget}
            keyboardType="numeric"
            placeholder="50000"
          />
          <Button title="Registrar meta" onPress={addGoal} />
        </SoftCard>

        {goals.length === 0 ? (
          <SoftCard>
            <Text style={styles.emptyText}>Sin metas aún. Registra la primera arriba.</Text>
          </SoftCard>
        ) : null}

        {goals.map((g) => (
          <SoftCard key={g.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalIcon}>
                <Text style={styles.goalIconText}>★</Text>
              </View>
              <Text style={styles.cardTitle}>{g.title}</Text>
            </View>
            {g.description ? <Text style={styles.desc}>{g.description}</Text> : null}
            <GoalProgressBar
              saved={Number(g.saved_amount)}
              target={Number(g.target_amount)}
              currency={g.currency}
            />
            <View style={styles.row}>
              <Button
                title="+ $1,000"
                variant="secondary"
                onPress={() => addSaved(g.id, Number(g.saved_amount), 1000, Number(g.target_amount))}
                style={styles.rowBtn}
              />
              <Button
                title="+ $5,000"
                variant="secondary"
                onPress={() => addSaved(g.id, Number(g.saved_amount), 5000, Number(g.target_amount))}
                style={styles.rowBtn}
              />
            </View>
          </SoftCard>
        ))}
      </ScrollView>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  formCard: { marginBottom: spacing.md },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
  goalCard: { marginBottom: spacing.md },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: '#FFF6E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconText: { fontSize: 18, color: colors.statGold },
  cardTitle: { fontWeight: '700', fontSize: 18, color: colors.text, flex: 1 },
  desc: { color: colors.textMuted, marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  rowBtn: { flex: 1 },
});

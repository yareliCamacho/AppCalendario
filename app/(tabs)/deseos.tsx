import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { coupleRepository } from '../../src/repositories/CoupleRepository';
import { wishRepository } from '../../src/repositories/WishRepository';
import { wishService } from '../../src/services/WishService';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { colors, spacing, contentMaxWidth } from '../../src/config/theme';

export default function DeseosScreen() {
  const { coupleId, userId } = useCoupleContext();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'place' | 'purchase'>('place');

  const { data: pending = [] } = useQuery({
    queryKey: ['wishes', coupleId, 'pending'],
    enabled: Boolean(coupleId && userId),
    queryFn: () => wishRepository.list(coupleId!, userId!, 'pending'),
  });

  const { data: fulfilled = [] } = useQuery({
    queryKey: ['wishes', coupleId, 'fulfilled'],
    enabled: Boolean(coupleId && userId),
    queryFn: () => wishRepository.list(coupleId!, userId!, 'fulfilled'),
  });

  const getPartner = async () => {
    if (!coupleId || !userId) return null;
    const members = await coupleRepository.getMembers(coupleId, userId);
    return members.find((m) => m.user_id !== userId)?.user_id ?? null;
  };

  const addWish = async () => {
    if (!coupleId || !userId || !title.trim()) return;
    const partner = await getPartner();
    if (!partner) return;
    await wishService.create(coupleId, userId, partner, {
      type,
      title: title.trim(),
      description: null,
      photo_path: null,
    });
    setTitle('');
    qc.invalidateQueries({ queryKey: ['wishes', coupleId] });
  };

  const fulfill = async (id: string) => {
    if (!coupleId || !userId) return;
    const partner = await getPartner();
    if (!partner) return;
    await wishService.fulfill(id, coupleId, userId, partner);
    qc.invalidateQueries({ queryKey: ['wishes', coupleId] });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Input label="Nuevo deseo" value={title} onChangeText={setTitle} placeholder="Título" />
      <View style={styles.typeRow}>
        <Button title="Lugar" variant={type === 'place' ? 'primary' : 'ghost'} onPress={() => setType('place')} />
        <Button title="Compra" variant={type === 'purchase' ? 'primary' : 'ghost'} onPress={() => setType('purchase')} />
      </View>
      <Button title="Agregar deseo" onPress={addWish} />

      <Text style={styles.section}>Por hacer</Text>
      {pending.map((w) => (
        <Pressable key={w.id} style={styles.item} onPress={() => fulfill(w.id)}>
          <Text style={styles.itemTitle}>{w.title}</Text>
          <Text style={styles.hint}>Toca para marcar cumplido ♥</Text>
        </Pressable>
      ))}

      <Text style={[styles.section, styles.fulfilledSection]}>Cumplidos</Text>
      {fulfilled.map((w) => (
        <View key={w.id} style={styles.itemFulfilled}>
          <Text style={styles.fulfilledTitle}>♥ {w.title}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  section: { fontWeight: '700', fontSize: 18, marginTop: spacing.lg, marginBottom: spacing.sm },
  fulfilledSection: { color: colors.fulfilledGreen },
  item: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm },
  itemTitle: { fontWeight: '600' },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  itemFulfilled: { backgroundColor: '#E8F5E9', padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm },
  fulfilledTitle: { color: colors.fulfilledGreen, fontWeight: '600' },
});

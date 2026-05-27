import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { coupleRepository } from '../../src/repositories/CoupleRepository';
import { wishRepository } from '../../src/repositories/WishRepository';
import { wishService } from '../../src/services/WishService';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { TabScreenShell, scrollOnAppBackground } from '../../src/components/ui/TabScreenShell';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { SoftCard } from '../../src/components/ui/SoftCard';
import { colors, spacing, contentMaxWidth, radii, glass } from '../../src/config/theme';
import { useTabScrollInsets } from '../../src/hooks/useTabScrollInsets';

export default function DeseosScreen() {
  const { contentContainerStyle: tabScrollStyle } = useTabScrollInsets();
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
          title="Lista de deseos"
          subtitle="Lugares y sueños que quieren cumplir juntos 💕"
        />

        <SoftCard style={styles.formCard}>
          <Input label="Nuevo deseo" value={title} onChangeText={setTitle} placeholder="Viaje a Bali" />
          <View style={styles.typeRow}>
            <Pressable
              style={[styles.typeChip, type === 'place' && styles.typeChipActive]}
              onPress={() => setType('place')}
            >
              <Text style={[styles.typeChipText, type === 'place' && styles.typeChipTextActive]}>
                📍 Lugar
              </Text>
            </Pressable>
            <Pressable
              style={[styles.typeChip, type === 'purchase' && styles.typeChipActive]}
              onPress={() => setType('purchase')}
            >
              <Text style={[styles.typeChipText, type === 'purchase' && styles.typeChipTextActive]}>
                🛍 Compra
              </Text>
            </Pressable>
          </View>
          <Button title="Agregar deseo" onPress={addWish} />
        </SoftCard>

        <Text style={styles.section}>
          Deseos activos <Text style={styles.badge}>{pending.length}</Text>
        </Text>
        {pending.length === 0 ? (
          <SoftCard style={styles.emptyHint}>
            <Text style={styles.emptyText}>Aún no hay deseos. ¡Agrega el primero arriba!</Text>
          </SoftCard>
        ) : (
          pending.map((w) => (
            <Pressable key={w.id} onPress={() => fulfill(w.id)}>
              <SoftCard style={styles.item}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemIcon}>
                    <Text>{w.type === 'place' ? '📍' : '🛍'}</Text>
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>{w.title}</Text>
                    <Text style={styles.hint}>Toca para marcar cumplido</Text>
                  </View>
                  <Text style={styles.itemHeart}>♡</Text>
                </View>
              </SoftCard>
            </Pressable>
          ))
        )}

        <Text style={[styles.section, styles.fulfilledSection]}>
          Cumplidos <Text style={styles.badgeGreen}>{fulfilled.length}</Text>
        </Text>
        {fulfilled.map((w) => (
          <View key={w.id} style={styles.itemFulfilled}>
            <Text style={styles.fulfilledTitle}>✓ {w.title}</Text>
          </View>
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
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  typeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    ...glass.surface,
  },
  typeChipActive: {
    backgroundColor: colors.primaryPinkDark,
    borderColor: colors.primaryPinkDark,
  },
  typeChipText: { fontWeight: '600', color: colors.text },
  typeChipTextActive: { color: colors.white },
  section: {
    fontWeight: '700',
    fontSize: 17,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  fulfilledSection: { color: colors.fulfilledGreen },
  badge: { color: colors.primaryPinkDark },
  badgeGreen: { color: colors.fulfilledGreen },
  emptyHint: { marginBottom: spacing.sm },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
  item: { marginBottom: spacing.sm },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...glass.surface,
  },
  itemBody: { flex: 1 },
  itemTitle: { fontWeight: '700', fontSize: 16, color: colors.text },
  itemHeart: { color: colors.primaryPinkDark, fontSize: 22 },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  itemFulfilled: {
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    ...glass.panel,
  },
  fulfilledTitle: { color: colors.fulfilledGreen, fontWeight: '600', fontSize: 15 },
});

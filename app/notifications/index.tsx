import { FlatList, Text, StyleSheet, Pressable, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { notificationRepository } from '../../src/repositories/NotificationRepository';
import { colors, spacing } from '../../src/config/theme';

export default function NotificationsScreen() {
  const { userId } = useCoupleContext();
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['notifications', userId],
    enabled: Boolean(userId),
    queryFn: () => notificationRepository.listForUser(userId!),
  });

  const markRead = async (id: string) => {
    if (!userId) return;
    await notificationRepository.markRead(id, userId);
    qc.invalidateQueries({ queryKey: ['notifications', userId] });
  };

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => (
        <Pressable style={[styles.item, !item.read_at && styles.unread]} onPress={() => markRead(item.id)}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </Pressable>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Sin notificaciones</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
  item: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.primaryPink },
  title: { fontWeight: '700' },
  body: { color: colors.textMuted, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});

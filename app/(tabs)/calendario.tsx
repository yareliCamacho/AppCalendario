import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { eventRepository } from '../../src/repositories/EventRepository';
import { colors, spacing, contentMaxWidth } from '../../src/config/theme';

export default function CalendarioScreen() {
  const { coupleId, userId } = useCoupleContext();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);

  const { data: events = [] } = useQuery({
    queryKey: ['events', coupleId, year, month],
    enabled: Boolean(coupleId && userId),
    queryFn: () => eventRepository.listByMonth(coupleId!, userId!, year, month),
  });

  const markedDates = useMemo(() => new Set(events.map((e) => e.event_date)), [events]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const cells = useMemo(() => {
    const arr: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [daysInMonth, firstDay]);

  const openDay = (day: number) => {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    router.push({ pathname: '/calendar/day-detail', params: { date } });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.monthTitle}>
        {month}/{year}
      </Text>
      <View style={styles.grid}>
        {cells.map((day, i) =>
          day ? (
            <Pressable key={i} style={styles.cell} onPress={() => openDay(day)}>
              <Text style={styles.dayNum}>{day}</Text>
              {markedDates.has(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`) ? (
                <Text style={styles.heart}>♥</Text>
              ) : null}
            </Pressable>
          ) : (
            <View key={i} style={styles.cellEmpty} />
          ),
        )}
      </View>
      <Pressable style={styles.addBtn} onPress={() => router.push({ pathname: '/calendar/add-event', params: { date: now.toISOString().slice(0, 10) } })}>
        <Text style={styles.addText}>+ Agregar fecha especial</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' },
  monthTitle: { fontSize: 20, fontWeight: '700', marginBottom: spacing.md, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellEmpty: { width: '14.28%', aspectRatio: 1 },
  dayNum: { fontSize: 14, color: colors.text },
  heart: { color: colors.primaryPinkDark, fontSize: 10 },
  addBtn: { marginTop: spacing.lg, backgroundColor: colors.primaryPink, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  addText: { fontWeight: '600', color: colors.text },
});
